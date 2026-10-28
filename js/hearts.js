// Вордмарки «ВетЭксперт» (герой и подвал) целиком нарисованы сердечками на холсте.
// Включается атрибутом data-hearts="dark" | "light" (палитра под тёмную или светлую надпись),
// data-hearts-intro — заставка: сердечки слетаются со всех сторон и собираются в надпись.
//
// Идея как у Cursor Driven Particle Typography (21st.dev): надпись всегда состоит из частиц,
// поэтому нет подмены «частицы ↔ настоящий текст» — нечему мерцать и проступать позади.
// Обычный текст остаётся в разметке невидимым: для поисковиков, экранных дикторов и выравнивания.
// Пока надпись никто не трогает, холст нарисован один раз и ничего не считает.
(function () {
  const words = document.querySelectorAll("[data-hearts]");
  if (!words.length) return;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const weak = (navigator.hardwareConcurrency || 8) <= 4;

  // сердечко размером ~1×1 с центром в нуле
  const HEART = new Path2D("M0 0.32C-0.06 0.26-0.5-0.04-0.5-0.24-0.5-0.43-0.33-0.5-0.22-0.5-0.12-0.5-0.04-0.44 0-0.37 0.04-0.44 0.12-0.5 0.22-0.5 0.33-0.5 0.5-0.43 0.5-0.24 0.5-0.04 0.06 0.26 0 0.32Z");

  words.forEach(setup);

  function setup(word) {
    const ink = word.querySelector(".wm-ink");
    const host = word.closest(".hero, .site-footer") || word.parentElement; // контейнер, в котором лежит холст
    if (!ink || !host) return;
    const dark = word.dataset.hearts === "dark";
    let introPending = word.hasAttribute("data-hearts-intro") && !calm;

    const STEP = weak ? 6 : 5;     // шаг сетки сердечек, px
    const REST = 1.22;             // размер сердечка в покое относительно шага: ряды касаются, без полосок
    const RADIUS = 110;            // радиус влияния курсора, px
    const PUSH = 1.6;              // сила отталкивания
    const SPRING = 0.05;           // возврат на место
    const DAMP = 0.86;             // затухание скорости
    const PAD = 160;               // запас холста: сердечки разлетаются за пределы букв

    const canvas = document.createElement("canvas");
    canvas.className = "wordmark-hearts";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let particles = [];
    let base = "#000";
    const mouse = { x: -9999, y: -9999, inside: false };
    let running = false;

    const smooth = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

    // сетка сердечек по форме букв: каждую букву рисуем туда, где её поставил браузер
    function build() {
      const hr = host.getBoundingClientRect();
      const r = ink.getBoundingClientRect();
      if (!r.width) return false;
      const cs = getComputedStyle(ink);
      const W = r.width + PAD * 2, H = r.height + PAD * 2;
      canvas.style.left = (r.left - hr.left - PAD) + "px";
      canvas.style.top = (r.top - hr.top - PAD) + "px";
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);

      const fontSize = parseFloat(cs.fontSize);
      const off = document.createElement("canvas");
      off.width = Math.ceil(r.width); off.height = Math.ceil(r.height);
      const o = off.getContext("2d", { willReadFrequently: true });
      o.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      if ("letterSpacing" in o) o.letterSpacing = "0px";
      const asc = o.measureText("Вр").fontBoundingBoxAscent || fontSize * 0.93;
      o.fillStyle = "#000"; o.textBaseline = "alphabetic";
      const walker = document.createTreeWalker(ink, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (let i = 0; i < n.length; i++) {
          if (!n.data[i].trim()) continue;
          range.setStart(n, i); range.setEnd(n, i + 1);
          const g = range.getBoundingClientRect();
          o.fillText(n.data[i], g.left - r.left, g.top - r.top + asc);
        }
      }

      base = cs.color;
      const palette = dark ? ["#5B4BDB", "#5B4BDB", "#A396EE", "#7869E3"] : ["#FFFFFF", "#CFC8F5", "#5B4BDB", "#FFFFFF"];
      const data = o.getImageData(0, 0, off.width, off.height).data;
      particles = [];
      for (let y = STEP / 2; y < off.height; y += STEP) {
        for (let x = STEP / 2; x < off.width; x += STEP) {
          if (data[((y | 0) * off.width + (x | 0)) * 4 + 3] > 110) {
            const hx = x + PAD, hy = y + PAD;
            particles.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, rot: 0, delay: 0, c: palette[(Math.random() * palette.length) | 0] });
          }
        }
      }
      fitToContainer(r);
      return true;
    }

    // Холст рисует Onest чуть мельче и со сдвигом относительно браузера, поэтому облако сердечек
    // подгоняем к краям контейнера: вордмарк должен стоять от края до края, как обычный текст (data-fit)
    function fitToContainer(inkRect) {
      if (!particles.length || !word.hasAttribute("data-fit")) return;
      const box = word.parentElement, bs = getComputedStyle(box), br = box.getBoundingClientRect();
      const half = (STEP * REST) / 2;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of particles) {
        if (p.hx < minX) minX = p.hx; if (p.hx > maxX) maxX = p.hx;
        if (p.hy < minY) minY = p.hy; if (p.hy > maxY) maxY = p.hy;
      }
      // края контейнера в координатах холста (холст начинается на PAD левее и выше .wm-ink)
      const left = br.left + parseFloat(bs.paddingLeft) - inkRect.left + PAD + half;
      const right = br.right - parseFloat(bs.paddingRight) - inkRect.left + PAD - half;
      const k = (right - left) / (maxX - minX);      const cy = (minY + maxY) / 2;
      for (const p of particles) {
        p.hx = left + (p.hx - minX) * k;
        p.hy = cy + (p.hy - cy) * k;
        p.x = p.hx; p.y = p.hy;
      }
    }

    // заставка: сердечки стартуют разбросанными и слетаются по очереди слева направо
    function scatter() {
      const w = canvas.width / dpr, h = canvas.height / dpr;
      for (const p of particles) {
        const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * Math.max(w, h) * 0.45;
        p.x = p.hx + Math.cos(a) * d;
        p.y = p.hy + Math.sin(a) * d * 0.6;
        p.vx = 0; p.vy = 0; p.rot = (Math.random() - 0.5) * 2;
        p.delay = Math.round((p.hx / w) * 40 + Math.random() * 18); // кадры ожидания: волна слева направо
      }
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const size = STEP * REST;
      // сначала все сердечки, стоящие на месте, — одним цветом надписи
      ctx.fillStyle = base;
      ctx.globalAlpha = 1;
      for (const p of particles) {
        if (p.delay > 0) continue;
        const moved = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy);
        if (moved > 1.5 || Math.abs(p.rot) > 0.02) continue;
        ctx.setTransform(size * dpr, 0, 0, size * dpr, p.x * dpr, p.y * dpr);
        ctx.fill(HEART);
      }
      // затем летящие: крупнее, повёрнуты, цвет уходит из цвета надписи в палитру
      for (const p of particles) {
        if (p.delay > 0) continue;
        const moved = Math.hypot(p.x - p.hx, p.y - p.hy);
        if (moved <= 1.5 && Math.abs(p.rot) <= 0.02) continue;
        const k = smooth(1.5, 14, moved);
        const s = size * (1 + Math.min(moved / 70, 0.4));
        const cos = Math.cos(p.rot) * s * dpr, sin = Math.sin(p.rot) * s * dpr;
        ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = 1 - k; ctx.fillStyle = base; ctx.fill(HEART);
        ctx.globalAlpha = k; ctx.fillStyle = p.c; ctx.fill(HEART);
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      let busy = false;
      const reach2 = RADIUS * RADIUS;
      for (const p of particles) {
        if (p.delay > 0) { p.delay--; busy = true; continue; }
        if (mouse.inside) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < reach2) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / RADIUS) * PUSH;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f;
          }
        }
        p.vx = (p.vx + (p.hx - p.x) * SPRING) * DAMP;
        p.vy = (p.vy + (p.hy - p.y) * SPRING) * DAMP;
        p.x += p.vx; p.y += p.vy;
        p.rot += (p.vx * 0.05 - p.rot) * 0.15;
        if (Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy) > 0.15 || Math.abs(p.vx) + Math.abs(p.vy) > 0.02 || Math.abs(p.rot) > 0.005) busy = true;
        else { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; p.rot = 0; } // встало — фиксируем точно на месте
      }
      draw();
      if (busy || mouse.inside) requestAnimationFrame(frame);
      else running = false;
    }
    const start = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

    // первая отрисовка и пересборка при смене размеров
    function render() {
      if (running) { later(); return; } // не пересобирать посреди заставки или разлёта — дождаться конца
      if (!build()) return;
      word.classList.add("is-hearts"); // настоящий текст прячем только когда холст готов
      if (introPending) { introPending = false; scatter(); start(); }
      else if (!running) draw();
    }
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(render, 120); };
    if (document.fonts) document.fonts.ready.then(() => setTimeout(render, 30)); else render();
    window.addEventListener("resize", later);
    document.addEventListener("fontchange", later);

    if (!canHover || calm) return;
    word.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true;
      start();
    });
    word.addEventListener("pointerleave", () => { mouse.inside = false; start(); });
  }
})();
