// ВетЭксперт — поведение страницы (без анимаций; они в js/anim.js на этапе 5)
(function () {
  const root = document.documentElement;
  root.lang = "ru";

  // Выравнивание по «чернилам», а не по коробке текста. У букв есть боковые отступы (у «В» в Onest ≈0,07em —
  // на кегле 220px это 15px пустоты), а отрицательный трекинг выталкивает последнюю букву за край.
  // Границы первой и последней буквы меряем на canvas.
  const measureCtx = document.createElement("canvas").getContext("2d");
  function bearings(el, px) {
    const cs = getComputedStyle(el);
    const text = (el.getAttribute("aria-label") || el.textContent).trim(); // у барабанов цифр текст в aria-label
    measureCtx.font = `${cs.fontWeight} ${px}px ${cs.fontFamily}`;
    const first = measureCtx.measureText(text[0]);
    const last = measureCtx.measureText(text[text.length - 1]);
    return {
      left: -first.actualBoundingBoxLeft,             // пустота слева от первой буквы
      right: last.width - last.actualBoundingBoxRight, // пустота справа от последней буквы
    };
  }

  // Вордмарки («ВетЭксперт», «Контакты») занимают ровно ширину контейнера: от края до края по буквам
  const fitTargets = document.querySelectorAll("[data-fit]");
  function fitWordmarks() {
    fitTargets.forEach((el) => {
      const box = el.parentElement;
      const style = getComputedStyle(box);
      const available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      el.style.marginLeft = "0px";
      el.style.fontSize = "100px";
      if (!el.offsetWidth) return;
      const tracking = parseFloat(getComputedStyle(el).letterSpacing) || 0; // хвостовой трекинг последней буквы
      const b = bearings(el, 100);
      const ink = el.offsetWidth - tracking - b.left - b.right; // offsetWidth: без вылетов внутреннего слоя .wm-ink
      let size = Math.min(480, (100 * available) / ink);
      el.style.fontSize = size.toFixed(2) + "px";
      // второй проход на итоговом кегле: хинтинг на 100px и на 250px даёт разные боковые отступы
      const b2 = bearings(el, size);
      const ink2 = el.offsetWidth - (parseFloat(getComputedStyle(el).letterSpacing) || 0) - b2.left - b2.right;
      size = Math.min(480, size * available / ink2);
      el.style.fontSize = size.toFixed(2) + "px";
      el.style.marginLeft = (-bearings(el, size).left).toFixed(2) + "px"; // отступ меряем на итоговом кегле
      if (el.id === "hero-title") root.style.setProperty("--wm-size", size.toFixed(2) + "px");
    });
  }

  // Крупные заголовки и цифры: первая буква встаёт ровно на край контейнера
  const OPTICAL = ".section-head h2, .booking__title, .about__title, .reviews-head__title, .facts__value, .score__value, .manifest, .site-footer__lead";
  function opticalAlign() {
    document.querySelectorAll(OPTICAL).forEach((el) => {
      // у цифр фактоидов есть линия-подчёркивание: её не двигаем, смещаем только текст
      const prop = el.classList.contains("facts__value") ? "textIndent" : "marginLeft";
      el.style[prop] = "0px";
      const px = parseFloat(getComputedStyle(el).fontSize);
      el.style[prop] = (-bearings(el, px).left).toFixed(2) + "px";
    });
  }

  function alignType() { fitWordmarks(); opticalAlign(); }
  alignType();
  window.addEventListener("resize", alignType);
  document.addEventListener("fontchange", alignType);
  if (document.fonts) document.fonts.ready.then(alignType);

  // Ссылки на мессенджеры берутся из js/config.js — менять их нужно только там
  const clinicCfg = (window.VET_CONFIG && window.VET_CONFIG.clinic) || {};
  document.querySelectorAll("[data-messenger]").forEach((a) => {
    const href = clinicCfg[a.dataset.messenger];
    if (href) a.href = href;
  });

  // Плавная прокрутка к якорям («Записаться», меню) с поправкой на закреплённую шапку.
  // Своя анимация вместо CSS scroll-behavior: можно задать кривую и прервать колесом или касанием.
  const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const siteHeader = document.querySelector(".site-header");
  let scrollAnim = 0;
  const stopScrollAnim = () => { cancelAnimationFrame(scrollAnim); scrollAnim = 0; };
  ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, stopScrollAnim, { passive: true }));
  function scrollToEl(el) {
    const offset = (siteHeader ? siteHeader.offsetHeight : 0) + 12;
    const to = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    const from = window.scrollY, dist = to - from;
    if (calmMotion || Math.abs(dist) < 4) { window.scrollTo(0, to); return; }
    const duration = Math.min(1400, Math.max(600, Math.abs(dist) * 0.45));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // мягкий разгон и торможение
    const t0 = performance.now();
    stopScrollAnim();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, from + dist * ease(t));
      scrollAnim = t < 1 ? requestAnimationFrame(step) : 0;
    };
    scrollAnim = requestAnimationFrame(step);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
    // фокус переносим к цели (для клавиатуры и экранных дикторов), без собственного скачка
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  // Бегущие строки: две одинаковые группы, CSS сдвигает трек на половину
  document.querySelectorAll(".marquee__track").forEach((track) => {
    const group = '<div class="marquee__group">' + track.innerHTML + "</div>";
    track.innerHTML = group + group;
  });

  // Курсор-лапка: над кнопками и ссылками заменяет системную руку и плавно догоняет мышь.
  // Только для мыши (hover + точный указатель); на тач-экранах и в полях ввода — обычное поведение.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (finePointer.matches) {
    const CLICKABLE = "a[href], button, select, summary, label.choice__item, label.consent, [role='button'], .select__option";
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paw = document.createElement("div");
    paw.className = "paw-cursor";
    paw.setAttribute("aria-hidden", "true");
    paw.innerHTML = '<svg viewBox="0 0 24 24">' +
      '<ellipse cx="5.6" cy="10" rx="2.1" ry="2.6" transform="rotate(-18 5.6 10)"/>' +
      '<ellipse cx="9.6" cy="5.8" rx="2.1" ry="2.7" transform="rotate(-6 9.6 5.8)"/>' +
      '<ellipse cx="14.4" cy="5.8" rx="2.1" ry="2.7" transform="rotate(6 14.4 5.8)"/>' +
      '<ellipse cx="18.4" cy="10" rx="2.1" ry="2.6" transform="rotate(18 18.4 10)"/>' +
      '<path d="M12 11.6c-3 0-6 3.6-6 6.3 0 1.8 1.4 2.8 3 2.8 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.6 0 3-1 3-2.8 0-2.7-3-6.3-6-6.3z"/></svg>';
    document.body.appendChild(paw);
    root.classList.add("has-paw-cursor");

    let tx = -100, ty = -100, x = -100, y = -100, tilt = 0, raf = 0;
    const tick = () => {
      const k = smooth ? 0.28 : 1;               // доля пути за кадр: лапка мягко догоняет мышь
      const dx = tx - x;
      x += dx * k; y += (ty - y) * k;
      tilt += (Math.max(-18, Math.min(18, dx * 0.6)) - tilt) * 0.15; // лёгкий наклон по ходу движения
      paw.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt - 14}deg)`;
      raf = (Math.abs(dx) > 0.1 || Math.abs(ty - y) > 0.1 || Math.abs(tilt) > 0.1) ? requestAnimationFrame(tick) : 0;
    };
    // Цвет лапки — по реальному фону под курсором: на тёмном и фиолетовом белая, на светлом фиолетовая.
    // Кнопки .btn при наведении заливаются тёмным или фиолетовым — над ними лапка всегда белая.
    const parseRGBA = (c) => {
      const n = (c.match(/[\d.]+/g) || []).map(Number);
      if (n.length < 3) return null;
      const scale = c.startsWith("color(") ? 255 : 1; // color(srgb 0.1 0.2 0.3) — доли, а не 0..255
      return { r: n[0] * scale, g: n[1] * scale, b: n[2] * scale, a: n.length > 3 ? n[3] : 1 };
    };
    function darkUnder(el) {
      if (el.closest(".btn")) return true;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = parseRGBA(getComputedStyle(n).backgroundColor);
        if (!c || c.a < 0.5) continue;
        return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 < 0.55;
      }
      return false;
    }
    let lastEl = null;
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      // в окне записи (верхний слой страницы) — обычный курсор: лапка оказалась бы под окном
      const over = !!e.target.closest(CLICKABLE) && !e.target.closest("dialog");
      if (e.target !== lastEl) { lastEl = e.target; paw.classList.toggle("is-on-dark", darkUnder(e.target)); }
      if (over && !paw.classList.contains("is-visible")) { x = e.clientX; y = e.clientY; } // появляется сразу на месте курсора
      paw.classList.toggle("is-visible", over);
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerdown", () => paw.classList.add("is-pressed"));
    document.addEventListener("pointerup", () => paw.classList.remove("is-pressed"));
    document.documentElement.addEventListener("mouseleave", () => paw.classList.remove("is-visible"));
  }

  // Подсветка карточек услуг за курсором: координаты курсора относительно каждой карточки
  const servicesGrid = document.querySelector(".services");
  if (servicesGrid && window.matchMedia("(hover: hover)").matches) {
    const cards = [...servicesGrid.querySelectorAll(".service")];
    let frame = 0;
    servicesGrid.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        cards.forEach((card) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", (e.clientX - r.left) + "px");
          card.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
    });
  }

  // Пока картинок нет в img\, показываем заглушки
  document.querySelectorAll("[data-pets], [data-media]").forEach((box) => {
    const img = box.querySelector("img");
    const showPlaceholder = () => box.classList.add("is-placeholder");
    if (!img || !img.getAttribute("src")) showPlaceholder();
    else if (img.complete && img.naturalWidth === 0) showPlaceholder();
    else img.addEventListener("error", showPlaceholder);
  });

  // «Записаться» на карточке услуги подставляет её в форму
  const serviceSelect = document.getElementById("lead-service");
  document.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!serviceSelect) return;
      const wanted = link.dataset.service;
      const option = [...serviceSelect.options].find((o) => o.value === wanted);
      if (option) {
        serviceSelect.value = option.value;
        serviceSelect.dispatchEvent(new Event("change")); // обновить свой выпадающий список
      }
    });
  });

  // Форма записи
  const form = document.getElementById("booking-form");
  if (form) {
    form.querySelectorAll("select.field__input").forEach(enhanceSelect);
    initBookingForm(form);
  }

  // Свой выпадающий список вместо системного: системный нельзя оформить под сайт.
  // Настоящий <select> остаётся в форме (скрытым) — из него берутся данные заявки.
  function enhanceSelect(select) {
    const id = select.id;
    const wrap = document.createElement("div");
    wrap.className = "select";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "field__input select__button";
    btn.id = id + "-button";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="select__value"></span><svg class="select__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const list = document.createElement("ul");
    list.className = "select__list";
    list.id = id + "-list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    list.hidden = true;
    btn.setAttribute("aria-controls", list.id);
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      label.id = label.id || id + "-label";
      label.htmlFor = btn.id;
      btn.setAttribute("aria-labelledby", label.id + " " + btn.id);
      list.setAttribute("aria-labelledby", label.id);
    }
    const opts = [...select.options].map((o, i) => {
      const li = document.createElement("li");
      li.className = "select__option";
      li.id = `${id}-opt-${i}`;
      li.setAttribute("role", "option");
      li.dataset.value = o.value;
      li.innerHTML = '<span></span><svg class="select__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
      li.firstChild.textContent = o.textContent;
      list.appendChild(li);
      return li;
    });
    select.classList.add("visually-hidden");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    select.parentNode.insertBefore(wrap, select);
    wrap.append(btn, list, select);

    let active = 0;
    function sync() {
      const i = Math.max(0, select.selectedIndex);
      btn.querySelector(".select__value").textContent = select.options[i].textContent;
      opts.forEach((li, k) => li.setAttribute("aria-selected", String(k === i)));
    }
    function setActive(i) {
      active = (i + opts.length) % opts.length;
      opts.forEach((li, k) => li.classList.toggle("is-active", k === active));
      list.setAttribute("aria-activedescendant", opts[active].id);
      opts[active].scrollIntoView({ block: "nearest" });
    }
    function open() {
      if (!list.hidden) return;
      list.hidden = false;
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      setActive(Math.max(0, select.selectedIndex));
      list.focus();
    }
    function close(refocus) {
      if (list.hidden) return;
      list.hidden = true;
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      if (refocus) btn.focus();
    }
    function choose(i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event("change"));
      close(true);
    }

    btn.addEventListener("click", () => (list.hidden ? open() : close(true)));
    btn.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); open(); }
    });
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".select__option");
      if (li) choose(opts.indexOf(li));
    });
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".select__option");
      if (li && opts.indexOf(li) !== active) setActive(opts.indexOf(li));
    });
    let typed = "", typedAt = 0;
    list.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Home") { e.preventDefault(); setActive(0); }
      else if (e.key === "End") { e.preventDefault(); setActive(opts.length - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") close(false);
      else if (e.key.length === 1) {
        // быстрый поиск по первым буквам
        const now = performance.now();
        typed = (now - typedAt > 700 ? "" : typed) + e.key.toLowerCase();
        typedAt = now;
        const hit = opts.findIndex((li) => li.textContent.toLowerCase().startsWith(typed));
        if (hit >= 0) setActive(hit);
      }
    });
    document.addEventListener("pointerdown", (e) => { if (!wrap.contains(e.target)) close(false); });
    select.addEventListener("change", sync);
    select.form && select.form.addEventListener("reset", () => setTimeout(sync, 0));
    sync();
  }

  // Карусели: стрелки листают на ширину видимой части, прячутся, если всё помещается
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      const max = track.scrollWidth - track.clientWidth;
      carousel.classList.toggle("is-static", max <= 2);
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    }
    function step(dir) {
      const item = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const perView = Math.max(1, Math.floor((track.clientWidth + gap) / (item.offsetWidth + gap)));
      track.scrollBy({ left: dir * perView * (item.offsetWidth + gap), behavior: reduce.matches ? "auto" : "smooth" });
    }
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Карточки врачей: на мыши раскрываются по наведению (CSS), на тач-экранах — по тапу на плашку.
  // Высоту плашки передаём в CSS: из неё «вырастает» карточка описания.
  const doctorCards = [...document.querySelectorAll(".doctor")];
  const setOpen = (card, open) => {
    card.classList.toggle("is-open", open);
    card.querySelector(".doctor__tag").setAttribute("aria-expanded", String(open));
  };
  function measureTags() {
    doctorCards.forEach((card) => card.style.setProperty("--tag-h", card.querySelector(".doctor__tag").offsetHeight + "px"));
  }
  measureTags();
  window.addEventListener("resize", measureTags);
  if (document.fonts) document.fonts.ready.then(measureTags);

  doctorCards.forEach((card) => {
    card.querySelector(".doctor__tag").addEventListener("click", (e) => {
      const open = !card.classList.contains("is-open");
      doctorCards.forEach((c) => c !== card && setOpen(c, false)); // открыта только одна
      setOpen(card, open);
      // фокус на кнопку — только при открытии с клавиатуры (detail 0), иначе после тапа она выглядит «нажатой»
      if (open && e.detail === 0) card.querySelector(".doctor__cta").focus({ preventScroll: true });
    });
  });
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".doctor")) doctorCards.forEach((c) => setOpen(c, false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = doctorCards.find((c) => c.classList.contains("is-open") || c.contains(document.activeElement));
    if (open) { setOpen(open, false); open.querySelector(".doctor__tag").focus(); }
  });

  // «Записаться к врачу» выбирает врача в форме (прокрутку к форме делает общий обработчик якорей)
  document.querySelectorAll("[data-doctor]").forEach((link) => {
    link.addEventListener("click", () => {
      const sel = document.getElementById("lead-doctor");
      if (!sel) return;
      const opt = [...sel.options].find((o) => o.value === link.dataset.doctor);
      if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change")); }
      doctorCards.forEach((c) => setOpen(c, false));
    });
  });

  // Своя карта: MapLibre + векторные тайлы OpenFreeMap (без ключа и рекламы, коммерческое использование разрешено).
  // Слои перекрашиваются в палитру сайта. В превью-артефакте внешние тайлы запрещены — там остаются ссылки.
  window.addEventListener("load", () => {
    const box = document.querySelector("[data-map]");
    if (!box || window.VET_PREVIEW || !window.maplibregl) return;
    const clinic = [46.121381, 51.476887]; // [долгота, широта]
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const css = getComputedStyle(document.documentElement);
    const tok = (name) => css.getPropertyValue(name).trim();
    const C = {
      land: "#ECEAF8", residential: "#E6E3F6", park: "#DDD8F4", water: "#C9C1F2",
      building: "#DAD5F2", road: "#FFFFFF", casing: tok("--line"), rail: "#C3BCEA",
      label: tok("--ink-soft"), halo: "#FFFFFF",
    };

    let map;
    try {
      map = new maplibregl.Map({
        container: "clinic-map",
        style: "https://tiles.openfreemap.org/styles/positron",
        center: clinic, zoom: 16, minZoom: 11, maxZoom: 18,
        scrollZoom: false, dragPan: !mobile, pitchWithRotate: false, dragRotate: false, touchPitch: false,
        attributionControl: { compact: true },
      });
    } catch (e) {
      return; // нет WebGL — остаются ссылки на Яндекс и 2ГИС
    }
    box.classList.add("is-live");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => {
      map.getStyle().layers.forEach(({ id, type }) => {
        const set = (prop, value) => { try { map.setPaintProperty(id, prop, value); } catch (e) { /* у слоя нет свойства */ } };
        if (type === "background") set("background-color", C.land);
        else if (type === "fill") {
          if (id === "water") set("fill-color", C.water);
          else if (id === "building") { set("fill-color", C.building); set("fill-outline-color", C.casing); }
          else if (/park|wood|grass/.test(id)) set("fill-color", C.park);
          else if (/residential/.test(id)) set("fill-color", C.residential);
        } else if (type === "line") {
          if (/casing/.test(id)) set("line-color", C.casing);
          else if (/highway|road/.test(id)) set("line-color", C.road);
          else if (/railway/.test(id)) set("line-color", C.rail);
          else if (/waterway/.test(id)) set("line-color", C.water);
          else if (/boundary/.test(id)) set("line-opacity", 0);
        } else if (type === "symbol") {
          if (/shield/.test(id)) { map.setLayoutProperty(id, "visibility", "none"); return; }
          map.setLayoutProperty(id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name:nonlatin"], ["get", "name"]]);
          set("text-color", C.label); set("text-halo-color", C.halo); set("text-halo-width", 1.4);
        }
      });
    });

    const pin = document.createElement("div");
    pin.className = "map-marker";
    pin.innerHTML = '<span class="map-marker__pulse"></span>' +
      '<span class="map-marker__dot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg></span>' +
      '<span class="map-marker__label">ВетЭксперт</span>';
    new maplibregl.Marker({ element: pin, anchor: "center" }).setLngLat(clinic).addTo(map);

    // Кнопки лежат внизу слева — метку чуть поднимаем, чтобы она не оказалась под ними
    map.jumpTo({ center: clinic, zoom: 16, padding: { bottom: mobile ? 120 : 80 } });
    // MapLibre измеряет контейнер один раз при создании; если размер потом поменялся
    // (догрузился шрифт, отработала анимация, сменилась ширина окна) — без resize() рисуется только кусок
    new ResizeObserver(() => map.resize()).observe(box);
    map.once("load", () => map.resize());
  });

  // Мобильное меню
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  const mobile = window.matchMedia("(max-width: 1023px)");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.hidden = !open && mobile.matches;
  }
  if (toggle && nav) {
    setMenu(false);
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a") && mobile.matches) setMenu(false); });
    mobile.addEventListener("change", () => setMenu(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
    });
  }

  function initBookingForm(form) {
    const phone = form.elements.phone;

    // Аккуратный формат номера по мере ввода: +7 900 000-00-00
    phone.addEventListener("input", () => {
      let d = phone.value.replace(/\D/g, "");
      if (!d) { phone.value = ""; return; }
      if (d[0] === "8") d = "7" + d.slice(1);
      if (d[0] !== "7") d = "7" + d;
      d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      let out = "+7";
      if (p[0]) out += " " + p[0];
      if (p[1]) out += " " + p[1];
      if (p[2]) out += "-" + p[2];
      if (p[3]) out += "-" + p[3];
      phone.value = out;
    });

    const checks = [
      { input: form.elements.name, test: (v) => v.trim().length >= 2 },
      { input: phone, test: (v) => v.replace(/\D/g, "").length === 11 },
      { input: form.elements.consent, test: (_, el) => el.checked },
    ];

    function setInvalid(input, invalid) {
      const holder = input.type === "checkbox" ? input.closest(".consent") : input.closest(".field");
      const error = document.getElementById(input.id + "-error");
      holder.classList.toggle("is-invalid", invalid);
      if (error) error.hidden = !invalid;
      if (invalid) input.setAttribute("aria-describedby", error.id);
      else input.removeAttribute("aria-describedby");
      input.setAttribute("aria-invalid", String(invalid));
    }

    checks.forEach(({ input, test }) => {
      const evt = input.type === "checkbox" ? "change" : "blur";
      input.addEventListener(evt, () => { if (input.getAttribute("aria-invalid") === "true" || input.value) setInvalid(input, !test(input.value, input)); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let firstBad = null;
      checks.forEach(({ input, test }) => {
        const bad = !test(input.value, input);
        setInvalid(input, bad);
        if (bad && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      const data = new FormData(form);
      const lead = {
        name: data.get("name").trim(),
        phone: data.get("phone"),
        pet: data.get("pet"),
        service: data.get("service"),
        doctor: data.get("doctor"),
        time: data.get("time"),
        comment: (data.get("comment") || "").trim(),
      };
      sendLead(lead);
      showSuccess(lead);
      form.reset();
      checks.forEach(({ input }) => input.removeAttribute("aria-invalid"));

      // Шаг «Заявка» пройден, следующий — звонок администратора
      const steps = document.querySelectorAll(".steps__item");
      if (steps.length > 1) {
        steps[0].classList.remove("is-active");
        steps[0].classList.add("is-done");
        steps[1].classList.add("is-active");
      }
    });
  }

  // Окно «Заявка принята»: повторяет, что выбрали, закрывается кнопкой, Esc или кликом по фону
  function showSuccess(lead) {
    const dlg = document.getElementById("booking-success");
    if (!dlg) return;
    dlg.querySelector("[data-success-name]").textContent = lead.name;
    dlg.querySelector("[data-success-pet]").textContent = lead.pet;
    dlg.querySelector("[data-success-service]").textContent = lead.service;
    dlg.querySelector("[data-success-doctor]").textContent = lead.doctor;
    dlg.querySelector("[data-success-time]").textContent = lead.time;
    dlg.querySelector("[data-success-phone]").textContent = lead.phone;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    dlg.querySelector("[data-success-close]").focus();
  }
  const successDlg = document.getElementById("booking-success");
  if (successDlg) {
    const closeDlg = () => (typeof successDlg.close === "function" ? successDlg.close() : successDlg.removeAttribute("open"));
    successDlg.querySelector("[data-success-close]").addEventListener("click", closeDlg);
    successDlg.addEventListener("click", (e) => { if (e.target === successDlg) closeDlg(); }); // клик по затемнению
  }

  // Единая точка отправки заявки. Пока форма никуда не уходит (решение 2026-10-28):
  // TODO: отправлять текст на почту клиники или в бота MAX / Telegram.
  function sendLead(lead) {
    const text = [
      "Заявка с сайта ВетЭксперт",
      "Имя: " + lead.name,
      "Телефон: " + lead.phone,
      "Питомец: " + lead.pet,
      "Услуга: " + lead.service,
      "Врач: " + lead.doctor,
      "Удобное время: " + lead.time,
      lead.comment ? "Что беспокоит: " + lead.comment : "",
    ].filter(Boolean).join("\n");
    return text;
  }
})();
