'use strict';
// ─────────────────────────────────────────────────────────────
//  «Оценка по фото» — главная фича сайта.
//
//  Клиент за три шага говорит, что у него сломалось, прикладывает
//  снимки и сразу видит предварительную вилку цены. Точную сумму
//  называет мастер, посмотрев фото, — заявка вместе со снимками
//  и отмеченными поломками уходит в Telegram.
//
//  Цены берутся из window.SERVICES (поля from / to). Пока они нулевые,
//  калькулятор честно говорит «назовём по фото» и не выдумывает цифр.
//
//  Разметка: <div data-estimate></div>
// ─────────────────────────────────────────────────────────────

(function () {
  const KINDS = window.REPAIR_KINDS || [];
  const SRV   = window.SERVICES || [];
  if (!KINDS.length || !SRV.length) return;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const money = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');

  function build(box) {
    let kind = KINDS[0].id;
    const picked = new Set();

    box.innerHTML = `
      <div class="est">
        <div class="est-steps">

          <section class="est-step">
            <h3><span class="est-num">1</span> Что чиним</h3>
            <div class="est-kinds" role="radiogroup" aria-label="Что чиним"></div>
          </section>

          <section class="est-step">
            <h3><span class="est-num">2</span> Что с ним не так</h3>
            <p class="est-hint">Отметьте всё, что подходит — можно несколько.</p>
            <div class="est-list"></div>
          </section>

          <section class="est-step">
            <h3><span class="est-num">3</span> Фото повреждения</h3>
            <p class="est-hint">Главное — снимите повреждение крупно и при свете.
            По фото мастер называет цену точно, а не «от и до».</p>
            <form class="est-form" data-form="remont">
              <div class="field" data-photos></div>
              <div class="field-2">
                <div class="field">
                  <label for="est-name">Как вас зовут</label>
                  <input id="est-name" name="name" type="text" autocomplete="name" placeholder="Имя">
                </div>
                <div class="field">
                  <label for="est-phone">Телефон *</label>
                  <input id="est-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+7 900 000-00-00">
                </div>
              </div>
              <div class="field">
                <label for="est-note">Что-то добавить?</label>
                <textarea id="est-note" name="problem" placeholder="Например: катаюсь по камням, доска нужна к выходным"></textarea>
              </div>
              <input type="hidden" name="item" value="">
              <input type="hidden" name="damage" value="">
              <label class="agree">
                <input type="checkbox" name="agree" required>
                <span>Согласен на обработку персональных данных (<a href="privacy.html">политика</a>)</span>
              </label>
              <input class="trap" type="text" name="trap" tabindex="-1" autocomplete="off" aria-hidden="true">
              <button class="btn btn-primary btn-wide" type="submit">Отправить на оценку</button>
              <div class="form-err"></div>
            </form>
          </section>

        </div>

        <aside class="est-card">
          <div class="est-card-in">
            <p class="est-card-label">Предварительно</p>
            <div class="est-sum">Отметьте, что случилось</div>
            <p class="est-card-note">Выберите поломку — покажем вилку.</p>
            <ul class="est-picked"></ul>
            <div class="est-card-foot">
              <p>Точную цену мастер называет по фото, до начала работ.
              Если по ходу вылезет что-то ещё — сначала звоним, потом делаем.</p>
            </div>
          </div>
        </aside>
      </div>`;

    const kindsBox = box.querySelector('.est-kinds');
    const listBox  = box.querySelector('.est-list');
    const sumBox   = box.querySelector('.est-sum');
    const noteBox  = box.querySelector('.est-card-note');
    const listPick = box.querySelector('.est-picked');
    const form     = box.querySelector('.est-form');

    kindsBox.innerHTML = KINDS.map((k, i) => `
      <button type="button" class="est-kind${i === 0 ? ' is-on' : ''}" data-kind="${esc(k.id)}"
              role="radio" aria-checked="${i === 0}">${esc(k.name)}</button>`).join('');

    const forKind = () => SRV.filter(s => (s.kinds || []).indexOf(kind) !== -1);

    function drawList() {
      listBox.innerHTML = forKind().map(s => {
        const on = picked.has(s.id);
        return `
        <label class="est-item${on ? ' is-on' : ''}">
          <input type="checkbox" value="${esc(s.id)}"${on ? ' checked' : ''}>
          <span class="est-tick" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M4 12.5l5.5 5.5L20 7"/></svg>
          </span>
          <span class="est-item-txt">
            <b>${esc(s.symptom)}</b>
            <i>${esc(s.name)}</i>
          </span>
          <span class="est-item-price">${priceLabel(s)}</span>
        </label>`;
      }).join('');
    }

    function priceLabel(s) {
      if (s.hidePrice) return '';
      if (s.from && s.to && s.to > s.from) return money(s.from) + '–' + money(s.to) + ' ₽';
      if (s.from && s.to === s.from) return money(s.from) + ' ₽';   // цена ровная
      if (s.from) return 'от ' + money(s.from) + ' ₽';
      return 'по фото';
    }

    function drawSum() {
      const chosen = SRV.filter(s => picked.has(s.id));
      form.item.value   = (KINDS.find(k => k.id === kind) || {}).name || '';
      form.damage.value = chosen.map(s => s.name).join(', ');

      listPick.innerHTML = chosen.map(s =>
        `<li><span>${esc(s.name)}</span><b>${priceLabel(s) || '—'}</b></li>`).join('');

      if (!chosen.length) {
        sumBox.textContent = 'Отметьте, что случилось';
        sumBox.classList.remove('is-num');
        noteBox.textContent = 'Выберите поломку — покажем вилку.';
        return;
      }

      const withPrice = chosen.filter(s => s.from);
      const noPrice   = chosen.length - withPrice.length;
      const from = withPrice.reduce((a, s) => a + s.from, 0);
      const to   = withPrice.reduce((a, s) => a + (s.to || s.from), 0);

      if (!withPrice.length) {
        sumBox.textContent = 'Назовём по фото';
        sumBox.classList.remove('is-num');
        noteBox.textContent = 'Такие работы считаются по состоянию — пришлите снимки, ответим суммой.';
        return;
      }

      sumBox.classList.add('is-num');
      sumBox.innerHTML = (to > from ? money(from) + '–' + money(to) : money(from)) + ' <span>₽</span>';
      noteBox.textContent = noPrice
        ? `Плюс ${noPrice === 1 ? 'одна работа' : noPrice + ' работы'} по осмотру — уточним по фото.`
        : 'Вилка предварительная. По фото назовём точно.';
    }

    kindsBox.addEventListener('click', e => {
      const btn = e.target.closest('.est-kind');
      if (!btn) return;
      kind = btn.dataset.kind;
      kindsBox.querySelectorAll('.est-kind').forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on);
      });
      // снимаем отметки, которые к новому виду снаряжения не относятся
      SRV.forEach(s => { if ((s.kinds || []).indexOf(kind) === -1) picked.delete(s.id); });
      drawList(); drawSum();
    });

    listBox.addEventListener('change', e => {
      const cb = e.target;
      if (cb.type !== 'checkbox') return;
      if (cb.checked) picked.add(cb.value); else picked.delete(cb.value);
      cb.closest('.est-item').classList.toggle('is-on', cb.checked);
      drawSum();
    });

    drawList();
    drawSum();
  }

  document.querySelectorAll('[data-estimate]').forEach(build);
})();
