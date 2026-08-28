'use strict';
// ─────────────────────────────────────────────────────────────
//  Прикрепление фото повреждения к заявке на ремонт.
//
//  Снимок с телефона весит 3–5 МБ, и отправлять его как есть нельзя:
//  на мобильном интернете заявка будет уходить минуту и может отвалиться.
//  Поэтому каждое фото ужимается прямо в браузере до 1400 px по длинной
//  стороне (~200–400 КБ) и уже в таком виде уезжает вместе с заявкой.
//
//  Разметка: <div class="field" data-photos></div> внутри формы.
// ─────────────────────────────────────────────────────────────

(function () {
  const MAX_FILES = 5;      // больше пяти для оценки ремонта не нужно
  const MAX_SIDE  = 1400;   // px по длинной стороне
  const QUALITY   = 0.72;
  const MAX_TOTAL = 4 * 1024 * 1024;   // общий потолок на все фото, в байтах

  const kb = n => n < 1024 * 1024
    ? Math.round(n / 1024) + ' КБ'
    : (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';

  // ── ужать один файл до разумного размера ──────────────────
  async function shrink(file) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      bitmap = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej(new Error('not-an-image'));
        img.src = URL.createObjectURL(file);
      });
    }

    const w = bitmap.width, h = bitmap.height;
    const k = Math.min(1, MAX_SIDE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k));
    const ch = Math.max(1, Math.round(h * k));

    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, cw, ch);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('not-an-image');

    const data = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(',')[1]);
      fr.onerror = () => rej(new Error('read-failed'));
      fr.readAsDataURL(blob);
    });

    return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', size: blob.size, data: data, preview: URL.createObjectURL(blob) };
  }

  // ── поле в форме ──────────────────────────────────────────
  function build(box) {
    const form = box.closest('form');
    if (!form) return;
    const shots = [];
    form.photoShots = shots;                     // отсюда их заберёт forms.js

    box.innerHTML = `
      <label>Фото повреждения <span class="ph-opt">— по желанию, но с ними мы ответим точнее</span></label>
      <div class="ph-zone" tabindex="0" role="button" aria-label="Добавить фото повреждения">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="M3 17V7a2 2 0 0 1 2-2h3l1.5-2h5L16 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <circle cx="12" cy="12" r="3.5"/>
        </svg>
        <b>Добавить фото</b>
        <span>Снимите повреждение крупно. До ${MAX_FILES} фото, ужимаются автоматически</span>
        <input type="file" accept="image/*" multiple hidden>
      </div>
      <div class="ph-grid" hidden></div>
      <div class="ph-note" role="status"></div>`;

    const zone  = box.querySelector('.ph-zone');
    const input = box.querySelector('input[type=file]');
    const grid  = box.querySelector('.ph-grid');
    const note  = box.querySelector('.ph-note');

    const total = () => shots.reduce((s, p) => s + p.size, 0);

    const draw = () => {
      grid.hidden = shots.length === 0;
      grid.innerHTML = shots.map((p, i) => `
        <figure class="ph-item">
          <img src="${p.preview}" alt="">
          <button type="button" class="ph-del" data-i="${i}" aria-label="Убрать фото">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </figure>`).join('');
      note.textContent = shots.length
        ? `${shots.length} из ${MAX_FILES} · ${kb(total())}`
        : '';
      note.classList.remove('is-warn');
      zone.classList.toggle('is-full', shots.length >= MAX_FILES);
    };

    const warn = msg => { note.textContent = msg; note.classList.add('is-warn'); };

    async function add(fileList) {
      const files = [...fileList];
      if (!files.length) return;
      if (shots.length >= MAX_FILES) { warn(`Больше ${MAX_FILES} фото не нужно — уберите лишнее.`); return; }

      note.classList.remove('is-warn');
      note.textContent = 'Готовим фото…';
      let added = 0, skipped = 0;

      for (const f of files) {
        if (shots.length >= MAX_FILES) { skipped++; continue; }
        try {
          const shot = await shrink(f);
          if (total() + shot.size > MAX_TOTAL) { skipped++; continue; }
          shots.push(shot);
          added++;
        } catch (e) { skipped++; }
      }

      draw();
      if (skipped) {
        const tail = skipped === 1 ? 'Один файл не подошёл' : `Не подошли файлы: ${skipped}`;
        warn(added
          ? `${tail} — это либо не фото, либо больше уже не помещается.`
          : `${tail}. Прикладывайте обычные фотографии — JPG или PNG.`);
      }
    }

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => { add(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach(ev =>
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev =>
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('is-over'); }));
    zone.addEventListener('drop', e => {
      if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files);
    });

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.ph-del');
      if (!btn) return;
      const removed = shots.splice(Number(btn.dataset.i), 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
      draw();
    });
  }

  document.querySelectorAll('[data-photos]').forEach(build);
})();
