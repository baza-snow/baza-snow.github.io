// ─────────────────────────────────────────────────────────────
//  БАЗА · посредник «форма на сайте → Telegram»
//
//  Куда вставлять:
//    script.google.com → «Новый проект» → выделить весь код в редакторе
//    и заменить на этот → вписать TOKEN и CHAT_ID ниже → «Развернуть»
//    → «Новое развёртывание» → тип «Веб-приложение»
//    → «Запуск от имени: я», «Доступ: все» → скопировать ссылку вида
//      https://script.google.com/macros/s/AKfy.../exec
//    → вставить эту ссылку в config.js в поле formEndpoint.
//
//  Пошагово — в README.md.
// ─────────────────────────────────────────────────────────────

const TOKEN   = 'СЮДА_ТОКЕН_БОТА';   // выдаёт @BotFather
const CHAT_ID = 'СЮДА_ID_ЧАТА';      // группа «БАЗА — заявки», обычно с минусом: -100...

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    const head = d.type === 'prokat'
      ? '🏂 <b>Заявка на ПРОКАТ</b>'
      : '🔧 <b>Заявка на РЕМОНТ / ПОДБОР</b>';

    const line = (icon, label, value) =>
      value ? icon + ' <b>' + label + ':</b> ' + esc(value) + '\n' : '';

    let text = head + '\n\n' +
      line('👤', 'Имя',       d.name)     +
      line('📞', 'Телефон',   d.phone)    +
      line('🎿', 'Снаряжение', d.item)    +
      line('🎿', 'Что нужно', d.kit)      +
      line('🏷', 'Модель',    d.model)    +
      line('📅', 'С какого числа', d.dateFrom) +
      line('⏱', 'Суток',     d.days)      +
      line('📏', 'Рост, см',  d.height)   +
      line('👟', 'Размер ноги', d.foot)   +
      line('🎯', 'Уровень',   d.level)    +
      line('📝', 'Описание',  d.problem)  +
      line('📝', 'Комментарий', d.note)   +
      '\n📄 ' + esc(d.page || '') +
      '\n<a href="' + esc(d.url) + '">открыть страницу</a>';

    UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Разовая проверка. Запустите эту функцию в редакторе (кнопка «Выполнить») —
// в группе должно появиться сообщение «проверка связи».
function test() {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: CHAT_ID, text: 'проверка связи — БАЗА' })
  });
}
