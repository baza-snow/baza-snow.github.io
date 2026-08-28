'use strict';
// ─────────────────────────────────────────────────────────────
//  Две формы: «заявка на ремонт» и «заявка на прокат».
//  Обе уходят POST-запросом на Google Apps Script, а тот пересылает
//  сообщение в Telegram. Токен бота живёт в скрипте — на сайте его нет.
//  Адрес скрипта задаётся в config.js -> formEndpoint.
//  Настройка описана в README.md.
// ─────────────────────────────────────────────────────────────

(function () {
  const B = window.BAZA || {};

  document.querySelectorAll('form[data-form]').forEach(form => {
    const type = form.dataset.form;              // 'remont' | 'prokat'
    const btn = form.querySelector('button[type="submit"]');
    const errBox = form.querySelector('.form-err');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.trap && form.trap.value) return;   // ловушка для роботов
      if (errBox) errBox.textContent = '';

      const data = { type: type, url: location.href, page: document.title };
      new FormData(form).forEach((v, k) => {
        if (k === 'trap' || k === 'agree') return;
        v = String(v).trim();
        if (v) data[k] = v;
      });

      if (!B.formEndpoint) {
        if (errBox) {
          errBox.textContent = B.phone
            ? 'Отправка заявок ещё не подключена. Позвоните: ' + B.phone
            : 'Отправка заявок ещё не подключена (см. README.md).';
        }
        return;
      }

      const label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }

      try {
        await fetch(B.formEndpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        const wrap = form.closest('.form-card') || form.parentNode;
        const phoneLine = B.phone
          ? ` Если срочно — звоните: <a href="tel:${B.phoneTel || B.phone.replace(/[^\d+]/g, '')}">${B.phone}</a>.`
          : '';
        wrap.innerHTML = `<div class="form-done">
            <b>Заявка отправлена.</b>
            <p>Свяжемся с вами и подтвердим ${type === 'prokat' ? 'бронь' : 'запись'}.${phoneLine}</p>
          </div>`;
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (errBox) {
          errBox.textContent = 'Не удалось отправить.' + (B.phone ? ' Позвоните: ' + B.phone : ' Попробуйте позже.');
        }
      }
    });
  });
})();
