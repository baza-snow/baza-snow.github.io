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
    const SPACING = 150;                       // расстояние между кабинками, px

    // Кабинка гондолы: захват на тросе, изогнутая подвеска и корпус
    // с широким остеклением — как на настоящей канатке. Захват стоит
    // у правого края картинки, там же в разметке проходит трос.
    const cabinSVG = `
      <svg viewBox="0 0 34 40" width="34" height="40" fill="none"
           stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="28" y="0.8" width="6" height="4" rx="1.3"/>
        <path d="M31 4.8v2.6a5.6 5.6 0 0 1-5.6 5.6H17.6v1.9"/>
        <rect x="1.6" y="15.2" width="27.4" height="18.2" rx="8"/>
        <rect x="4.9" y="18" width="20.6" height="9.4" rx="4.6"/>
        <path d="M15.2 18v9.4"/>
      </svg>`;

    // Опора: траверса с роликами на тросе и мачта, уходящая вбок.
    // Опоры стоят на месте — кабинки проезжают мимо.
    const towerSVG = `
      <svg viewBox="0 0 26 34" width="26" height="34" fill="none"
           stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 7.5v19"/>
        <path d="M7 17h16"/>
        <path d="M5.4 11h1.6M5.4 17h1.6M5.4 23h1.6"/>
        <circle cx="4" cy="11" r="1.4"/>
        <circle cx="4" cy="17" r="1.4"/>
        <circle cx="4" cy="23" r="1.4"/>
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
    rider.innerHTML = cabinSVG;

    const need = Math.ceil(window.innerHeight / SPACING) + 3;
    for (let i = 0; i < need; i++) {
      const c = document.createElement('div');
      c.className = 'lift-chair';
      c.style.top = (i * SPACING) + 'px';
      c.innerHTML = cabinSVG;
      run.appendChild(c);
    }

    // опоры — на своих местах вдоль троса
    const towers = document.createElement('div');
    towers.className = 'lift-towers';
    [22, 54, 84].forEach(pos => {
      const t = document.createElement('div');
      t.className = 'lift-tower';
      t.style.top = pos + '%';
      t.innerHTML = towerSVG;
      towers.appendChild(t);
    });

    lift.append(cable, towers, chairs, rider);

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
