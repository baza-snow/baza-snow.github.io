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
//  ВАЖНО: если вы уже разворачивали прошлую версию скрипта, после замены
//  кода нужно «Развернуть» → «Управление развёртываниями» → карандаш
//  → версия «Новая» → «Развернуть». Иначе фото приходить не будут:
//  на сайте останется работать старая версия скрипта.
//
//  Пошагово — в README.md.
// ─────────────────────────────────────────────────────────────

const TOKEN   = 'СЮДА_ТОКЕН_БОТА';   // выдаёт @BotFather
const CHAT_ID = 'СЮДА_ID_ЧАТА';      // ваш личный id (просто цифры, например 123456789)
                                     // или id группы — тогда с минусом: -100...
                                     // Как узнать — в README, раздел про заявки.

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    const head = d.type === 'prokat'
      ? '🏂 <b>Заявка на ПРОКАТ</b>'
      : '🔧 <b>Заявка на РЕМОНТ / ПОДБОР</b>';

    const line = (icon, label, value) =>
      value ? icon + ' <b>' + label + ':</b> ' + esc(value) + '\n' : '';

    const photos = d.photos || [];

    const text = head + '\n\n' +
      line('👤', 'Имя',       d.name)     +
      line('📞', 'Телефон',   d.phone)    +
      line('🎿', 'Снаряжение', d.item)    +
      line('🔩', 'Что не так', d.damage)  +
      line('🎿', 'Что нужно', d.kit)      +
      line('🏷', 'Модель',    d.model)    +
      line('📅', 'С какого числа', d.dateFrom) +
      line('⏱', 'Суток',     d.days)      +
      line('📏', 'Рост, см',  d.height)   +
      line('👟', 'Размер ноги', d.foot)   +
      line('🎯', 'Уровень',   d.level)    +
      line('📝', 'Описание',  d.problem)  +
      line('📝', 'Комментарий', d.note)   +
      (photos.length ? '📷 <b>Фото:</b> ' + photos.length + ' — ниже\n' : '') +
      '\n📄 ' + esc(d.page || '') +
      '\n<a href="' + esc(d.url) + '">открыть страницу</a>';

    // 1. сама заявка
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    // id заявки, чтобы фото прицепились к ней ответом, а не висели отдельно
    let replyTo = null;
    try {
      const parsed = JSON.parse(res.getContentText());
      if (parsed.ok && parsed.result) replyTo = parsed.result.message_id;
    } catch (ignore) {}

    // 2. фото повреждения, по одному
    for (let i = 0; i < photos.length; i++) {
      try {
        const bytes = Utilities.base64Decode(photos[i].data);
        const blob  = Utilities.newBlob(bytes, 'image/jpeg', photos[i].name || ('foto-' + (i + 1) + '.jpg'));
        const form  = {
          chat_id: String(CHAT_ID),
          caption: 'Фото ' + (i + 1) + ' из ' + photos.length +
                   (d.phone ? ' · заявка ' + d.phone : ''),
          photo: blob
        };
        if (replyTo) form.reply_to_message_id = String(replyTo);

        UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendPhoto', {
          method: 'post',
          payload: form,                 // multipart — Apps Script соберёт сам
          muteHttpExceptions: true
        });
      } catch (errPhoto) {
        UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
          method: 'post',
          contentType: 'application/json',
          muteHttpExceptions: true,
          payload: JSON.stringify({
            chat_id: CHAT_ID,
            text: '⚠️ Фото ' + (i + 1) + ' не отправилось: ' + errPhoto,
            reply_to_message_id: replyTo
          })
        });
      }
    }

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
