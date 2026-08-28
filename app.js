'use strict';
// ─────────────────────────────────────────────────────────────
//  БАЗА — общая логика страниц: подстановка контактов из config.js,
//  мобильное меню, отрисовка прайсов, каталога, кейсов и отзывов.
// ─────────────────────────────────────────────────────────────

(function () {
  const B = window.BAZA || {};
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── контакты в шапке и подвале ──────────────────────────────
  document.querySelectorAll('[data-phone]').forEach(el => {
    if (!B.phone) { el.classList.add('hide'); return; }
    el.textContent = B.phone;
    if (el.tagName === 'A') el.href = 'tel:' + (B.phoneTel || B.phone.replace(/[^\d+]/g, ''));
  });
  document.querySelectorAll('[data-hours]').forEach(el => {
    if (!B.hours) { el.classList.add('hide'); return; }
    el.textContent = B.hours;
  });
  document.querySelectorAll('[data-address]').forEach(el => { el.textContent = B.addressFull || B.address; });
  document.querySelectorAll('[data-map]').forEach(el => { el.href = B.map; });

  // ── ссылки на Авито ────────────────────────────────────────
  document.querySelectorAll('[data-avito]').forEach(el => {
    if (!B.avito) {
      // ссылки ещё нет — кнопка ведёт на форму той же страницы,
      // адрес уже стоит в разметке, поэтому href не трогаем
      el.removeAttribute('target');
      if (el.dataset.avitoText) el.textContent = el.dataset.avitoText;
      return;
    }
    el.href = B.avito;
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // ── мессенджеры ────────────────────────────────────────────
  document.querySelectorAll('[data-wa]').forEach(el => {
    if (!B.whatsapp) { el.classList.add('hide'); return; }
    el.href = 'https://wa.me/' + B.whatsapp.replace(/\D/g, '');
  });
  document.querySelectorAll('[data-tg]').forEach(el => {
    if (!B.telegram) { el.classList.add('hide'); return; }
    el.href = 'https://t.me/' + B.telegram.replace(/^@/, '');
  });

  // ── цифры доверия ──────────────────────────────────────────
  const setTxt = (sel, v) => document.querySelectorAll(sel).forEach(e => { e.textContent = v; });
  setTxt('[data-avito-rating]', B.avitoRating);
  setTxt('[data-avito-reviews]', B.avitoReviews);
  setTxt('[data-avito-orders]', B.avitoOrders);
  setTxt('[data-avito-years]', B.avitoYears);
  setTxt('[data-ya-rating]', B.yandexRating);
  setTxt('[data-ya-reviews]', B.yandexReviews);

  // ── бургер ─────────────────────────────────────────────────
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', e => {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  // ── прайс проката ──────────────────────────────────────────
  const rentBox = document.getElementById('rentPrices');
  if (rentBox && window.RENT) {
    rentBox.innerHTML = window.RENT.map(r => `
      <div class="price-row">
        <div><b>${esc(r.name)}</b><span>${esc(r.note)}</span></div>
        ${r.price
          ? `<div class="price-val">${esc(r.price)} ₽<small>в сутки</small></div>`
          : `<div class="price-val soft">уточним при брони</div>`}
      </div>`).join('');
  }

  // ── прайс сервиса ──────────────────────────────────────────
  const srvBox = document.getElementById('servicePrices');
  if (srvBox && window.SERVICES) {
    srvBox.innerHTML = window.SERVICES.map(s => `
      <div class="price-row">
        <div><b>${esc(s.name)}</b><span>${esc(s.text)}</span></div>
        ${s.price
          ? `<div class="price-val">${esc(s.price)} ₽</div>`
          : `<div class="price-val soft">цена по осмотру</div>`}
      </div>`).join('');
  }

  // ── правила проката ────────────────────────────────────────
  const rulesBox = document.getElementById('rentRules');
  if (rulesBox && window.RENT_RULES) {
    rulesBox.innerHTML = window.RENT_RULES.map(r => `<li>${esc(r)}</li>`).join('');
  }

  // ── каталог ────────────────────────────────────────────────
  const catBox = document.getElementById('catalogGrid');
  if (catBox && window.CATALOG) {
    catBox.innerHTML = window.CATALOG.map(c => `
      <article class="cat">
        <div class="cat-img"><img src="${esc(c.photo)}" alt="${esc(c.name)} — БАЗА, Екатеринбург" loading="lazy"></div>
        <div class="cat-txt">
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.text)}</p>
          <div class="cat-price">${esc(c.price)}</div>
        </div>
      </article>`).join('');
  }

  // ── кейсы ремонта ──────────────────────────────────────────
  const renderCases = (box, list) => {
    box.innerHTML = list.map(c => `
      <article class="case" id="case-${esc(c.id)}">
        <div class="case-head">
          <span class="tag">${esc(c.board)}</span>
          <h3>${esc(c.title)}</h3>
        </div>
        <div class="case-shots" style="--n:${c.shots.length}">
          ${c.shots.map((s, i) => `
            <figure class="shot${i === c.shots.length - 1 && c.shots.length > 1 ? ' is-after' : ''}">
              <img src="${esc(s.src)}" alt="${esc(c.title)} — ${esc(s.label)}" loading="lazy">
              <figcaption>${esc(s.label)}</figcaption>
            </figure>`).join('')}
        </div>
        <div class="case-body">
          <div class="case-cols">
            <div><h4>Что было</h4><p>${esc(c.problem)}</p></div>
            <div><h4>Что сделали</h4><p>${esc(c.work)}</p></div>
          </div>
        </div>
      </article>`).join('');
  };
  const casesAll = document.getElementById('casesAll');
  if (casesAll && window.CASES) renderCases(casesAll, window.CASES);
  const casesTop = document.getElementById('casesTop');
  if (casesTop && window.CASES) renderCases(casesTop, window.CASES.slice(0, 3));

  // ── отзывы ─────────────────────────────────────────────────
  const revBox = document.getElementById('reviews');
  if (revBox && window.REVIEWS) {
    revBox.innerHTML = window.REVIEWS.map(r => `
      <blockquote class="rev">
        <div class="stars">★★★★★</div>
        <p>${esc(r.text)}</p>
        <footer><b>${esc(r.author)}</b> · ${esc(r.date)} · ${esc(r.source)}</footer>
      </blockquote>`).join('');
  }

  // ── год в подвале ──────────────────────────────────────────
  setTxt('[data-year]', new Date().getFullYear());
})();
