'use strict';
// ─────────────────────────────────────────────────────────────
//  Атмосфера горнолыжки: канатка сбоку и хребты в шапке.
//
//  1. Подъёмник. Вдоль правого края идёт трос, по нему едут кресла.
//     Канатка работает всегда — как настоящая, — а когда вы листаете
//     страницу, она ещё и подгоняется вместе со скроллом. Оранжевое
//     кресло — это вы: показывает, докуда долистали.
//     Насечки на тросе — разделы страницы, по ним можно кликать.
//
//  2. Хребты в шапке двигаются с разной скоростью: дальние медленно,
//     ближние быстро — получается глубина, как из окна подъёмника.
//
//  Всё выключается, если в системе включено «уменьшать движение».
// ─────────────────────────────────────────────────────────────

(function () {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. КАНАТКА ────────────────────────────────────────────
  const lift = document.querySelector('.lift');
  if (lift) {
    const SPACING = 132;                       // расстояние между креслами, px
    const chairSVG = `
      <svg viewBox="0 0 22 26" width="22" height="26" fill="none"
           stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M11 0v11"/>
        <path d="M4.5 11h13"/>
        <path d="M5 11V5.5"/>
        <path d="M5 16.5h11"/>
        <path d="M5 11v5.5"/>
      </svg>`;

    const cable  = document.createElement('div');
    cable.className = 'lift-cable';

    // два движения складываются: постоянный ход задаётся в CSS на .lift-run,
    // а скролл сдвигает внешний .lift-chairs. Так канатка едет и сама по себе,
    // и разгоняется, когда листают страницу.
    const chairs = document.createElement('div');
    chairs.className = 'lift-chairs';
    const run = document.createElement('div');
    run.className = 'lift-run';
    chairs.appendChild(run);

    const rider  = document.createElement('div');
    rider.className = 'lift-rider';
    rider.innerHTML = chairSVG;

    const need = Math.ceil(window.innerHeight / SPACING) + 3;
    for (let i = 0; i < need; i++) {
      const c = document.createElement('div');
      c.className = 'lift-chair';
      c.style.top = (i * SPACING) + 'px';
      c.innerHTML = chairSVG;
      run.appendChild(c);
    }
    lift.append(cable, chairs, rider);

    // насечки-станции: разделы, которым в разметке задано короткое имя
    // через data-stop. Что не отмечено — на канатке не показываем.
    const stops = [...document.querySelectorAll('[data-stop][id]')]
      .map(el => ({ el: el, name: el.dataset.stop }));

    let nav = null;
    if (stops.length > 1) {
      nav = document.createElement('nav');
      nav.className = 'lift-nav';
      nav.setAttribute('aria-label', 'Разделы страницы');
      nav.innerHTML = stops.map(s => `
        <a class="lift-stop" href="#${s.el.id}">
          <span class="lift-dot"></span>
          <span class="lift-label">${s.name.replace(/[<>&]/g, '')}</span>
        </a>`).join('');
      lift.appendChild(nav);
    }
    const dots = nav ? [...nav.querySelectorAll('.lift-stop')] : [];

    let ticking = false;
    function place() {
      ticking = false;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const y   = window.scrollY || doc.scrollTop;
      const p   = Math.min(1, Math.max(0, y / max));

      // кресла едут по тросу и зацикливаются
      if (!calm) {
        chairs.style.transform = 'translateY(' + (-(y * 0.4) % SPACING) + 'px)';
      }

      // «вы» — от верха до низа троса
      const railTop = 88, railBot = window.innerHeight - 56;
      rider.style.top = (railTop + (railBot - railTop) * p) + 'px';

      // насечки встают туда, где начинается их раздел
      dots.forEach((d, i) => {
        const el = stops[i].el;
        const q  = Math.min(1, Math.max(0, (el.offsetTop - window.innerHeight * 0.35) / max));
        d.style.top = (railTop + (railBot - railTop) * q) + 'px';
        const top = el.getBoundingClientRect().top;
        d.classList.toggle('is-on', top <= window.innerHeight * 0.45 &&
          top + el.offsetHeight > window.innerHeight * 0.45);
      });
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    place();
    lift.classList.add('is-ready');
  }

  // ── 2. ХРЕБТЫ В ШАПКЕ ─────────────────────────────────────
  const range = document.querySelector('.range');
  if (range && !calm) {
    const layers = [...range.querySelectorAll('.range-layer')];
    let ticking = false;
    function move() {
      ticking = false;
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > window.innerHeight * 1.2) return;      // ниже шапки считать незачем
      layers.forEach((l, i) => {
        l.style.transform = 'translate3d(0,' + (y * (0.06 + i * 0.09)) + 'px,0)';
      });
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    }, { passive: true });
    move();
  }
})();
