// ВетЭксперт — анимации (GSAP 3 + ScrollTrigger). Приёмы взяты из refs/Animation_good_blocks.mp4.
// Порядок в каждой секции: заголовок проявляется из размытия → сопровождающий текст → содержимое.
// При prefers-reduced-motion или без GSAP страница остаётся статичной и полностью видимой.
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove("anim-pending");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const EASE = "power3.out";
  const CLEAR = "transform,opacity,filter";
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // Делит текст элемента на слова или буквы, сохраняя вложенный .plate целым
  function split(el, mode) {
    const units = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = mode === "chars" ? [...child.textContent] : child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement("span");
            span.className = "split-unit";
            span.textContent = part;
            frag.appendChild(span);
            units.push(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.classList.contains("plate")) { child.classList.add("split-unit"); units.push(child); }
          else walk(child);
        }
      });
    };
    walk(el);
    return units;
  }

  // Заголовок секции + сопровождающий текст одной цепочкой
  function revealHead(heading, companions, start = "top 82%") {
    if (!heading) return null;
    const tl = gsap.timeline({ scrollTrigger: { trigger: heading, start, once: true } });
    tl.from(split(heading, "words"), {
      opacity: 0, y: 26, filter: "blur(12px)",
      duration: 0.9, ease: EASE, stagger: 0.06, clearProps: CLEAR,
    });
    companions.filter((c) => c && (!Array.isArray(c) || c.length)).forEach((c) => {
      tl.from(c, {
        opacity: 0, y: 18, filter: "blur(6px)",
        duration: 0.8, ease: EASE, stagger: 0.08, clearProps: CLEAR,
      }, "-=0.55");
    });
    return tl;
  }

  // Содержимое секции: мягкий подъём с лёгким шлейфом
  function revealItems(items, trigger, vars = {}) {
    if (!items.length) return;
    gsap.from(items, Object.assign({
      opacity: 0, y: 36,
      duration: 1, ease: EASE, stagger: 0.09, clearProps: CLEAR,
      scrollTrigger: { trigger, start: "top 86%", once: true },
    }, vars));
  }

  // 1. Загрузка героя — единственный «громкий» момент страницы
  const wordmark = $(".hero__wordmark");
  const chars = wordmark ? split(wordmark, "chars") : [];
  document.dispatchEvent(new CustomEvent("fontchange")); // перепроверить ширину вордмарка после разбивки
  root.classList.remove("anim-pending");

  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(chars, { yPercent: 70, opacity: 0, duration: 1.1, stagger: 0.045, clearProps: CLEAR })
    .from(".hero__podium", { yPercent: 10, opacity: 0, duration: 1, ease: EASE }, 0.3) // без clearProps: дальше подиум двигает прокрутка
    .from(".hero__pets", { y: 90, opacity: 0, duration: 1.3, ease: EASE, clearProps: CLEAR }, 0.5)
    .from(".hero__stage-inner > *", { y: 20, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.1, clearProps: CLEAR }, 0.85);

  // Прокрутка героя: пёс и кот чуть увеличиваются (от лап), подиум потихоньку уезжает вниз —
  // пока герой не скроется за верх экрана. Двигаем картинку и фон подиума, а не их контейнеры,
  // чтобы не мешать заставке и не уводить животных под вордмарк.
  const heroEl = $(".hero");
  if (heroEl) {
    const scroll = { trigger: heroEl, start: "top top", end: "bottom top", scrub: 0.6 };
    gsap.to(".hero__pets img", { scale: 1.12, ease: "none", scrollTrigger: scroll });
    gsap.to(".hero__podium", { y: () => heroEl.offsetHeight * 0.22, ease: "none", scrollTrigger: Object.assign({}, scroll) });
  }

  // 2. Популярные услуги
  revealHead($("#services .section-head h2"), [$("#services .section-head p")]);
  // Сетка карточек наклонена назад и выпрямляется в такт прокрутке (как Container Scroll Animation):
  // scrub привязывает наклон к положению страницы, поэтому при прокрутке вверх карточки снова наклоняются
  const grid = $(".services");
  if (grid) {
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    gsap.fromTo(grid,
      { rotationX: narrow ? 14 : 24, scale: narrow ? 0.94 : 0.9, y: 30, transformPerspective: 1300, transformOrigin: "50% 0%" },
      { rotationX: 0, scale: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: grid, start: "top bottom", end: "top 30%", scrub: 0.8 } });
  }

  // 3. Запись
  revealHead($(".booking__title"), [$(".booking__text"), $$(".steps__item"), $(".booking__call")]);
  revealItems([$(".booking-form")], ".booking-form", { y: 48, duration: 1.1 });

  // 4. О клинике: заголовок с плашкой, манифест заливается по прокрутке, факты и фото
  revealHead($(".about__title"), []);
  const manifest = $("[data-manifest]");
  if (manifest) {
    const words = split(manifest, "words");
    const style = getComputedStyle(root);
    const ink = style.getPropertyValue("--ink").trim();
    const soft = style.getPropertyValue("--ink-soft").trim();
    const faint = style.getPropertyValue("--line").trim();
    words.forEach((w) => { w.dataset.to = w.closest(".manifest__soft") ? soft : ink; });
    gsap.fromTo(words, { color: faint }, {
      color: (i, el) => el.dataset.to,
      ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: manifest, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
    });
  }
  revealItems($$(".facts__item"), ".facts");

  // Фактоиды «листаются» до значения, как барабаны счётчика: каждая цифра — лента 0–9 ×2,
  // прокручивается через полный круг до нужной. Запятая, «/» и тире стоят на месте.
  // Настоящий текст остаётся в aria-label, ширина символов фиксированная (tabular-nums) — строка не прыгает.
  const facts = $$(".facts__value");
  facts.forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    [...text].forEach((ch) => {
      if (!/\d/.test(ch)) {
        const s = document.createElement("span");
        s.className = "odo__sep"; s.setAttribute("aria-hidden", "true"); s.textContent = ch;
        el.appendChild(s);
        return;
      }
      const col = document.createElement("span");
      col.className = "odo"; col.setAttribute("aria-hidden", "true");
      col.dataset.target = 10 + Number(ch); // вторая десятка ленты — прокрутка через полный круг
      const strip = document.createElement("span");
      strip.className = "odo__strip";
      strip.innerHTML = "01234567890123456789".split("").map((d) => "<span>" + d + "</span>").join("");
      col.appendChild(strip);
      el.appendChild(col);
    });
  });
  document.dispatchEvent(new CustomEvent("fontchange")); // оптическое выравнивание по новой разметке
  const odos = $$(".odo");
  if (odos.length) {
    gsap.to(odos.map((c) => c.firstChild), {
      "--i": (i, s) => Number(s.parentNode.dataset.target),
      duration: (i) => 1.6 + (i % 3) * 0.25,
      ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".facts", start: "top 80%", once: true },
    });
  }
  revealItems([$(".about__media")], ".about__media", { y: 0, scale: 0.94, duration: 1.2 });

  // Карусель: двигаем её целиком, а карточки внутри только проявляются.
  // Сдвиг карточек внутри прокручиваемой ленты меняет её ширину, и scroll-snap дёргает ленту.
  function revealCarousel(carousel) {
    if (!carousel) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: carousel, start: "top 86%", once: true } });
    tl.from(carousel, { opacity: 0, y: 40, duration: 1.1, ease: EASE, clearProps: CLEAR })
      .from($$("[data-carousel-track] > *", carousel), {
        opacity: 0, duration: 0.9, ease: "power1.out", stagger: 0.1, clearProps: "opacity",
      }, 0.1);
  }

  // 5. Врачи
  revealHead($("#doctors .section-head h2"), [$("#doctors .section-head p")]);
  revealCarousel($("#doctors .carousel"));

  // 6. Отзывы: сцена закрепляется, карточки сменяют друг друга по прокрутке (видео-референс, 7–9 с).
  // За текущей карточкой выглядывает следующая (наклонена в другую сторону, чуть меньше).
  // При смене текущая уходит вверх, следующая выходит вперёд, а за ней из глубины появляется очередная.
  revealHead($(".reviews-head__title"), [$(".score"), $(".reviews-head__all")]);
  const stage = $("[data-reviews]");
  if (stage) {
    const cards = $$(".review-card", stage);
    const dots = $$(".reviews-stage__dots i", stage);
    const TILT = [-4, 3, -2.5];
    // положение «следующей» карточки за текущей: наклон в противоположную сторону от текущей
    const behind = (i) => {
      const side = (TILT[i - 1] || -1) < 0 ? 1 : -1; // наклон и сдвиг — в сторону, противоположную текущей
      return { x: 34 * side, y: 30, rotation: 8 * side, scale: 0.94, opacity: 1 };
    };
    stage.classList.add("is-stacked");
    gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%", zIndex: (i) => cards.length - i });
    gsap.set(cards[0], { rotation: TILT[0] });
    if (cards[1]) gsap.set(cards[1], behind(1));
    gsap.set(cards.slice(2), { y: 30, rotation: 0, scale: 0.86, opacity: 0 });

    const steps = cards.length - 1;
    const tl = gsap.timeline({
      defaults: { duration: 1 },
      scrollTrigger: {
        trigger: stage, start: "center center", end: () => "+=" + window.innerHeight * 0.9 * steps,
        pin: true, scrub: 0.8, invalidateOnRefresh: true,
        snap: { snapTo: 1 / steps, duration: { min: 0.25, max: 0.6 }, ease: "power2.inOut" },
        onUpdate: (self) => {
          const i = Math.round(self.progress * steps);
          dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
        },
      },
    });
    // каждый шаг длится ровно 1, поэтому snap (1/steps) попадает точно на момент, когда карточка встала
    for (let i = 1; i <= steps; i++) {
      // уходящая остаётся непрозрачной и закрывает следующую, гаснет только в конце пути
      tl.to(cards[i - 1], { y: () => -stage.offsetHeight * 0.85, rotation: -14, scale: 0.92, duration: 0.7, ease: "power2.in" }, i - 1)
        .to(cards[i - 1], { opacity: 0, duration: 0.2, ease: "none" }, i - 1 + 0.5)
        .to(cards[i], { x: 0, y: 0, rotation: TILT[i] || 0, scale: 1, opacity: 1, duration: 0.75, ease: "power2.out" }, i - 1 + 0.25);
      if (cards[i + 1]) tl.to(cards[i + 1], Object.assign(behind(i + 1), { duration: 0.6, ease: "power2.out" }), i - 1 + 0.4);
    }

    // первое появление сцены: стопка мягко поднимается целиком (карточки внутри двигает прокрутка)
    gsap.from($(".reviews-stack", stage), {
      opacity: 0, y: 60, duration: 1.1, ease: EASE,
      scrollTrigger: { trigger: stage, start: "top 80%", once: true },
    });
  }

  // 7. Контакты: слово проявляется, за ним по очереди адрес, часы, телефон, мессенджеры; затем карта
  revealHead($(".contacts__word"), [$$(".contacts__item")], "top 75%");
  revealItems([$(".map")], ".map", { y: 40 });

  // Позиции триггеров пересчитываем один раз, когда шрифт догрузился (до первой прокрутки),
  // а не по каждому событию: пересчёт посреди анимации откатывает её и даёт рывок
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
