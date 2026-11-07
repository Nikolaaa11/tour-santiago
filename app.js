(() => {
  "use strict";

  const STOPS = window.STOPS;
  const ROUTES = window.ROUTES;
  const LEGS = window.LEGS;
  const SPOTS = window.SPOTS || [];
  const TOTAL = STOPS.length;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobileMq = matchMedia("(max-width: 899px)");
  const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Estado ----------
  const params = new URLSearchParams(location.search);
  let mode = params.get("modo") === "teleferico" ? "teleferico" : "funicular";
  let active = 0; // 0 = ruta completa
  const fromHash = location.hash.match(/^#parada-(\d+)$/);
  if (fromHash && +fromHash[1] >= 1 && +fromHash[1] <= TOTAL) active = +fromHash[1];

  const DONE_KEY = "tour-santiago-hechas";
  const done = new Set();
  try { JSON.parse(localStorage.getItem(DONE_KEY) || "[]").forEach((n) => done.add(n)); } catch (_) { /* sin almacenamiento */ }
  const saveDone = () => { try { localStorage.setItem(DONE_KEY, JSON.stringify([...done])); } catch (_) { /* sin almacenamiento */ } };

  const stopData = (s) => (s.modes ? { ...s, ...s.modes[mode] } : s);
  const spotsOf = (id) => SPOTS.filter((x) => x.stop === id);

  // ---------- Hora de Santiago ----------
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function nowSantiago() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const h = +get("hour") % 24;
    const m = +get("minute");
    return { dow: DOW.indexOf(get("weekday")), min: h * 60 + m, hh: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
  }
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

  function status(hours) {
    if (!hours) return null;
    const { dow, min } = nowSantiago();
    const today = hours[dow];
    if (today === "?") return { cls: "unknown", text: "Hoy: confirmar horario" };
    if (!today) return { cls: "closed", text: "Hoy cerrado" };
    if (today.length === 1 && today[0][0] === "00:00" && today[0][1] === "24:00") return { cls: "always", text: "Siempre abierto" };
    for (const [o, c] of today) {
      if (min >= toMin(o) && min < toMin(c)) {
        return toMin(c) - min <= 45 ? { cls: "soon", text: `Cierra a las ${c}` } : { cls: "open", text: `Abierto · cierra ${c}` };
      }
    }
    const next = today.find(([o]) => toMin(o) > min);
    return next ? { cls: "closed", text: `Abre a las ${next[0]}` } : { cls: "closed", text: "Cerrado por hoy" };
  }

  // ---------- Formato e íconos ----------
  const nf1 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const fmtDist = (m) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${nf1.format(m / 1000)} km`);

  const ICON = {
    walk: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M9 21l2.5-6.5L14 17v4M8 12l3-4 3 1 2 3 2 1M11 8l.5 6.5"/></svg>',
    funicular: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20L22 8"/><path d="M7 9.5l8-1.5 1.5 6.5-8 1.6z"/><path d="M9.5 12.5h4"/></svg>',
    cable: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l20-2.5"/><path d="M12 4v4"/><rect x="6.5" y="8" width="11" height="10" rx="2.5"/><path d="M6.5 13h11"/></svg>',
    nav: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  };
  const KINDS = {
    comer: { label: "Comer", emoji: "🍽️" },
    brindar: { label: "Brindar", emoji: "🍹" },
    antojo: { label: "Antojo y café", emoji: "🍦" },
    cultura: { label: "Cultura", emoji: "🎨" },
    panorama: { label: "Panorama", emoji: "✨" },
  };
  const TRANSIT_NAME = { funicular: "funicular", cable: "teleférico" };

  function legInfo(n) {
    const parts = LEGS[mode][n];
    if (!parts) return null;
    let m = 0, min = 0, transit = null;
    for (const [id, kind] of parts) {
      if (kind === "walk") { m += ROUTES[id].m; min += ROUTES[id].min; } else transit = kind;
    }
    if (!transit) return { kind: "walk", text: `${min} min a pie · ${fmtDist(m)}` };
    const verb = n === 3 ? "Bajan en" : "Suben en";
    const ride = transit === "cable" ? `${TRANSIT_NAME[transit]}, unos 7 min` : TRANSIT_NAME[transit];
    return { kind: transit, text: `${verb} ${ride} + ${min} min a pie${m > 950 ? ` · ${fmtDist(m)}` : ""}` };
  }

  const walkTotal = () => {
    let m = 0;
    for (const parts of Object.values(LEGS[mode])) for (const [id, kind] of parts) if (kind === "walk") m += ROUTES[id].m;
    return m;
  };

  const mapsLink = (coord, q) => (q
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${coord[1]},${coord[0]}&travelmode=walking`);

  // ---------- Hero ----------
  function renderStats() {
    const km = walkTotal() / 1000;
    $("#stats").innerHTML = `
      <div><dt>paradas</dt><dd data-count="${TOTAL}">${TOTAL}</dd></div>
      <div><dt>km a pie</dt><dd data-count="${km.toFixed(1)}" data-dec="1">${nf1.format(km)}</dd></div>
      <div><dt>de 10:00 a 15:40</dt><dd>~6 h</dd></div>
      <div><dt>lugares para comer y brindar</dt><dd data-count="${SPOTS.length}">${SPOTS.length}</dd></div>`;
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = +(el.dataset.dec || 0);
    if (reduceMotion.matches || !isFinite(target)) return;
    const fmt = new Intl.NumberFormat("es-CL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const t0 = performance.now();
    const D = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / D);
      el.textContent = fmt.format(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderMarquee() {
    const items = [
      "🚡 Funicular de 1925", "🍑 Mote con huesillo en la cumbre", "🏔️ Vista a la cordillera", "🌳 Parque Forestal",
      "🦀 Pastel de jaiba", "🐟 Caldillo de congrio", "⛪ Catedral Metropolitana", "🏰 Castillo Hidalgo",
      ...SPOTS.map((s) => `${KINDS[s.kind]?.emoji || "📍"} ${s.name}`),
    ];
    const html = items.map((t) => `<span>${esc(t)}</span>`).join("");
    $("#marquee").innerHTML = html + html;
  }

  function renderToday() {
    const { dow, hh, min } = nowSantiago();
    const msgs = {
      1: "Los lunes no funcionan los teleféricos, el funicular cierra por lo menos el primer lunes del mes y los museos están cerrados. Si pueden, cambien de día.",
      0: "El domingo la Catedral cierra a las 13:00: pasen antes del almuerzo, está a 9 minutos del Mercado. La Piojera, Zunino y El Rápido no abren.",
      6: "El sábado la Catedral cierra a las 14:30: no alarguen tanto el almuerzo. El cerro se llena desde el mediodía, así que suban a las 10:00.",
    };
    let msg = msgs[dow] || "Buen día para el tour: todo funciona y la Catedral abre hasta las 18:00.";
    if (min > 15 * 60) msg += " Para hacerlo completo hoy ya es tarde: el recorrido parte a las 10:00.";
    const ico = { 0: "☀️", 6: "🛍️", 1: "⚠️" }[dow] || "✨";
    $("#today").innerHTML = `<span class="today-ico" aria-hidden="true">${ico}</span>
      <div><p><strong>Hoy ${DIAS[dow]}.</strong> ${esc(msg)}</p>
      <p class="clock">Son las ${hh} en Santiago. Los avisos de abierto o cerrado de cada parada usan esta hora.</p></div>`;
  }

  // ---------- Paradas ----------
  const list = $("#paradas");

  function badgeHTML(s) {
    const st = status(s.hours);
    return st ? `<span class="badge ${st.cls}" data-badge>${esc(st.text)}</span>` : "";
  }

  function spotHTML(sp) {
    const k = KINDS[sp.kind] || KINDS.comer;
    const map = mapsLink(sp.coord, `${sp.name}, ${sp.address}, Santiago`);
    return `
      <li class="spot" id="spot-${esc(sp.id)}">
        <span class="spot-ico" aria-hidden="true">${k.emoji}</span>
        <div>
          <p class="spot-name">${esc(sp.name)}</p>
          <p class="spot-kind">${esc(sp.type)}${sp.price ? ` · ${esc(sp.price)}` : ""}</p>
          ${sp.order ? `<p class="spot-order"><b>Pidan:</b> ${esc(sp.order)}</p>` : ""}
          ${sp.note ? `<p class="spot-note">${esc(sp.note)}</p>` : ""}
          <p class="spot-links"><a href="${map}" target="_blank" rel="noopener">${esc(sp.address)} ↗</a>${sp.url ? `<a href="${esc(sp.url)}" target="_blank" rel="noopener">Fuente</a>` : ""}</p>
        </div>
      </li>`;
  }

  function cardHTML(s0, reveal) {
    const s = stopData(s0);
    const leg = legInfo(s.n);
    const hours = s.hoursText.map((t) => `<span class="hours-line">${esc(t)}</span>`).join("")
      + (s.hoursNote ? `<span class="hours-note">${esc(s.hoursNote)}</span>` : "");
    const sources = s.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(" · ");
    const tickets = s.modes ? `<a class="go ghost" href="${esc(window.TOUR.tickets.url)}" target="_blank" rel="noopener">${ICON.ticket}Tickets</a>` : "";
    const spots = spotsOf(s0.id);
    const isDone = done.has(s.n);
    return `
      <li class="stop${s.n === active ? " is-active" : ""}${isDone ? " is-done" : ""}" id="parada-${s.n}" data-n="${s.n}" style="--c:${s.color}">
        ${leg ? `<div class="leg" data-kind="${leg.kind}">${ICON[leg.kind]}<span>${esc(leg.text)}</span></div>` : ""}
        <article class="card${reveal ? " reveal" : ""}" aria-labelledby="t-${s.n}">
          <div class="card-top">
            <button class="num" type="button" aria-label="Ver la parada ${s.n} en el mapa">${isDone ? "✓" : s.n}</button>
            <p class="meta"><span>${esc(s.time)} · ${esc(s.stay)}</span>${badgeHTML(s)}</p>
            <button class="check" type="button" aria-pressed="${isDone}" aria-label="Marcar ${esc(s.name)} como visitada">${ICON.check}<span>${isDone ? "Lista" : "Listo"}</span></button>
          </div>
          <h3 id="t-${s.n}">${esc(s.name)}</h3>
          <p class="place">${esc(s.place)}</p>
          <p class="lede">${esc(s.lede)}</p>
          <p class="body">${esc(s.body)}</p>
          ${s.photo ? `<p class="photo"><span aria-hidden="true">📸</span><span><b>Foto obligada:</b> ${esc(s.photo)}</span></p>` : ""}
          <dl class="facts">
            <div><dt>Horario</dt><dd>${hours}</dd></div>
            <div><dt>Precio</dt><dd>${esc(s.price)}</dd></div>
            <div><dt>Acceso</dt><dd>${esc(s.access)}</dd></div>
          </dl>
          <p class="fact"><b>¿Sabían que?</b>${esc(s.fact)}</p>
          <p class="tip"><b>Ojo:</b> ${esc(s.tip)}</p>
          ${spots.length ? `<div class="spots"><h4>Dónde comer y brindar aquí</h4><ul class="spot-list">${spots.map(spotHTML).join("")}</ul></div>` : ""}
          <p class="links">
            <a class="go" href="${mapsLink(s.coord)}" target="_blank" rel="noopener">${ICON.nav}Cómo llegar a pie</a>
            ${tickets}
            <span class="sources">Fuentes: ${sources}</span>
          </p>
        </article>
      </li>`;
  }

  function renderStops(reveal = false) {
    list.innerHTML = STOPS.map((s) => cardHTML(s, reveal)).join("");
    if (reveal) observeReveal(list.querySelectorAll(".reveal"));
  }

  function refreshBadges() {
    list.querySelectorAll(".stop").forEach((li) => {
      const s = stopData(STOPS[+li.dataset.n - 1]);
      const old = li.querySelector("[data-badge]");
      if (old) old.outerHTML = badgeHTML(s) || "";
    });
  }

  list.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const li = e.target.closest(".stop");
    if (!li) return;
    const n = +li.dataset.n;
    const chk = e.target.closest(".check");
    if (chk) { toggleDone(n, chk); return; }
    go(n, { scroll: false });
  });

  // ---------- Checklist, confeti y aviso ----------
  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function confetti(x, y, n = 30, spread = 1) {
    if (reduceMotion.matches) return;
    const box = $("#confetti");
    const colors = ["#ff2d55", "#ff6b3d", "#ffb340", "#af52de", "#5e5ce6", "#34c759", "#30b0c7"];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.background = colors[i % colors.length];
      if (i % 3 === 0) el.style.borderRadius = "50%";
      box.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const v = (90 + Math.random() * 170) * spread;
      const dx = Math.cos(ang) * v;
      const dy = Math.sin(ang) * v * 0.7 - 140 * spread;
      const rot = Math.random() * 900 - 450;
      el.animate([
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx * 1.25}px), calc(-50% + ${dy + 320}px)) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 700, easing: "cubic-bezier(.15,.7,.35,1)" }).onfinish = () => el.remove();
    }
  }

  function toggleDone(n, btn) {
    const s = stopData(STOPS[n - 1]);
    if (done.has(n)) done.delete(n); else done.add(n);
    saveDone();
    const li = document.getElementById(`parada-${n}`);
    const isDone = done.has(n);
    li.classList.toggle("is-done", isDone);
    btn.setAttribute("aria-pressed", String(isDone));
    btn.querySelector("span").textContent = isDone ? "Lista" : "Listo";
    li.querySelector(".num").textContent = isDone ? "✓" : n;
    updateChrome();
    if (isDone) {
      const r = btn.getBoundingClientRect();
      if (done.size === TOTAL) {
        confetti(innerWidth / 2, innerHeight * 0.45, 140, 2.2);
        toast("¡Tour completo! Se ganaron un brindis 🥂");
      } else {
        confetti(r.left + r.width / 2, r.top + r.height / 2);
        toast(`${s.name} ✓ · llevan ${done.size} de ${TOTAL}`);
      }
    }
  }

  // ---------- Barra de pasos ----------
  const prevBtn = $("#btn-prev");
  const nextBtn = $("#btn-next");
  const overviewBtn = $("#btn-overview");
  const stepLabel = $("#step-label");
  const dotsEl = $("#dots");
  const progressPill = $("#progress-pill");

  dotsEl.innerHTML = STOPS.map((s) => `<button type="button" class="dot" data-n="${s.n}" style="--c:${s.color}" aria-label="Ir a la parada ${s.n}"></button>`).join("");
  dotsEl.addEventListener("click", (e) => { const d = e.target.closest(".dot"); if (d) go(+d.dataset.n); });

  function updateChrome() {
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === TOTAL;
    overviewBtn.setAttribute("aria-pressed", String(active === 0));
    if (active === 0) {
      stepLabel.innerHTML = `<small>${TOTAL} paradas</small>Ruta completa`;
    } else {
      const s = stopData(STOPS[active - 1]);
      stepLabel.innerHTML = `<small>${active}/${TOTAL}</small>${esc(s.name)}`;
    }
    dotsEl.querySelectorAll(".dot").forEach((d) => {
      const n = +d.dataset.n;
      d.classList.toggle("is-active", n === active);
      d.classList.toggle("is-done", done.has(n));
    });
    const C = 2 * Math.PI * 7;
    progressPill.innerHTML = `<svg class="ring" viewBox="0 0 18 18" aria-hidden="true"><circle class="bgc" cx="9" cy="9" r="7"/><circle class="fg" cx="9" cy="9" r="7" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done.size / TOTAL)}"/></svg>${done.size} de ${TOTAL} listas`;
    list.querySelectorAll(".stop").forEach((li) => li.classList.toggle("is-active", +li.dataset.n === active));
    markers.forEach(({ n, pin, wrap }) => {
      pin.classList.toggle("is-active", n === active);
      pin.classList.toggle("is-done", done.has(n));
      wrap.style.zIndex = n === active ? "3" : "1";
    });
  }

  // Mientras la página hace scroll por código, el scroll no cambia la parada activa.
  let lockUntil = 0;
  let lockTimer = 0;
  function lockScroll() {
    lockUntil = Infinity;
    clearTimeout(lockTimer);
    const release = () => { clearTimeout(lockTimer); lockTimer = setTimeout(() => { lockUntil = 0; }, 120); };
    if ("onscrollend" in window) addEventListener("scrollend", release, { once: true });
    lockTimer = setTimeout(() => { lockUntil = 0; }, 1800);
  }
  function scrollToEl(el, block = "start", smooth = true) {
    if (!el) return;
    lockScroll();
    el.scrollIntoView({ behavior: smooth && !reduceMotion.matches ? "smooth" : "instant", block });
  }

  function go(n, { scroll = true, fromScroll = false } = {}) {
    n = Math.max(0, Math.min(TOTAL, n));
    if (n === active && fromScroll) return;
    active = n;
    updateChrome();
    updateHighlight();
    renderSpotPins();
    focusMap();
    history.replaceState(null, "", `${location.pathname}${location.search}${active ? `#parada-${active}` : ""}`);
    if (scroll && active) scrollToEl(document.getElementById(`parada-${active}`));
  }

  prevBtn.addEventListener("click", () => go(active - 1));
  nextBtn.addEventListener("click", () => go(active + 1));
  overviewBtn.addEventListener("click", () => go(0, { scroll: false }));

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && (t.closest("input, textarea, select, [contenteditable]") || t.closest("#map"))) return;
    if (e.key === "ArrowRight" && active < TOTAL) { e.preventDefault(); go(active + 1); }
    if (e.key === "ArrowLeft" && active > 0) { e.preventDefault(); go(active - 1); }
  });

  // La parada que cruza la "línea de foco" se activa sola al hacer scroll.
  let ticking = false;
  function onScroll() {
    ticking = false;
    if (performance.now() < lockUntil) return;
    const y = mobileMq.matches ? $(".mapcol").getBoundingClientRect().bottom + 40 : innerHeight * 0.42;
    let pick = 0;
    for (const li of list.children) if (li.getBoundingClientRect().top <= y) pick = +li.dataset.n;
    const last = list.lastElementChild;
    if (last && last.getBoundingClientRect().bottom < y - 200) return; // ya pasaron la ruta: no tocar el mapa
    if (pick !== active) go(pick, { scroll: false, fromScroll: true });
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // ---------- Modo ----------
  const seg = $("#seg");
  seg.dataset.mode = mode;
  document.querySelectorAll('input[name="modo"]').forEach((r) => {
    r.checked = r.value === mode;
    r.addEventListener("change", () => {
      if (!r.checked) return;
      mode = r.value;
      seg.dataset.mode = mode;
      const p = new URLSearchParams(location.search);
      if (mode === "teleferico") p.set("modo", "teleferico"); else p.delete("modo");
      const qs = p.toString();
      history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
      renderStops();
      renderStats();
      if (map && map.getSource("route")) map.getSource("route").setData(routeData());
      renderMarkers();
      updateChrome();
      updateHighlight();
      renderSpotPins();
      focusMap();
      toast(mode === "teleferico" ? "Suben en el teleférico nuevo 🚠" : "Suben en el funicular de 1925 🚞");
    });
  });

  // ---------- Dónde comer ----------
  let filter = "todo";
  function renderEat() {
    const kinds = ["todo", ...Object.keys(KINDS).filter((k) => SPOTS.some((s) => s.kind === k))];
    $("#filters").innerHTML = kinds.map((k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === filter}">${k === "todo" ? "Todo" : `${KINDS[k].emoji} ${KINDS[k].label}`}</button>`).join("");
    $("#eat-grid").innerHTML = SPOTS.map((sp, i) => {
      const st = STOPS.find((s) => s.id === sp.stop);
      const name = stopData(st).name;
      const k = KINDS[sp.kind] || KINDS.comer;
      const map = mapsLink(sp.coord, `${sp.name}, ${sp.address}, Santiago`);
      return `<article class="eat-card reveal" data-k="${sp.kind}" style="--c:${st.color}; --d:${(i % 3) * 80}ms">
        <div class="eat-top"><span class="eat-ico" aria-hidden="true">${k.emoji}</span><button type="button" class="eat-stop" data-n="${st.n}" data-spot="${esc(sp.id)}">Parada ${st.n} · ${esc(name)}</button></div>
        <h3>${esc(sp.name)}</h3>
        <p class="eat-kind">${esc(sp.type)}${sp.price ? ` · ${esc(sp.price)}` : ""}</p>
        ${sp.order ? `<p class="eat-order"><b>Pidan:</b> ${esc(sp.order)}</p>` : ""}
        ${sp.note ? `<p class="eat-note">${esc(sp.note)}</p>` : ""}
        <p class="eat-links"><a href="${map}" target="_blank" rel="noopener">${esc(sp.address)} ↗</a></p>
      </article>`;
    }).join("");
    observeReveal($("#eat-grid").querySelectorAll(".reveal"));
  }
  $("#filters").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    filter = c.dataset.k;
    $("#filters").querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === filter)));
    $("#eat-grid").querySelectorAll(".eat-card").forEach((card) => { card.hidden = filter !== "todo" && card.dataset.k !== filter; });
  });
  $("#eat-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".eat-stop");
    if (!b) return;
    go(+b.dataset.n);
    flashSpot(b.dataset.spot);
  });
  function flashSpot(id) {
    const el = document.getElementById(`spot-${id}`);
    if (!el) return;
    setTimeout(() => { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); }, 700);
  }

  // ---------- Aparición al hacer scroll ----------
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll?.("[data-count]").forEach(countUp);
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function observeReveal(nodes) {
    nodes.forEach((n) => (io ? io.observe(n) : n.classList.add("in")));
  }

  // ---------- Mapa ----------
  let map = null;
  const markers = [];
  let poiMarkers = [];
  let spotMarkers = [];
  let popup = null;

  function routeData() {
    const features = [];
    for (const [n, parts] of Object.entries(LEGS[mode])) {
      for (const [id, kind] of parts) {
        features.push({ type: "Feature", properties: { stop: +n, kind }, geometry: { type: "LineString", coordinates: ROUTES[id].coords } });
      }
    }
    return { type: "FeatureCollection", features };
  }

  const isActiveLeg = () => ["==", ["get", "stop"], active];
  const opacityExpr = () => (active === 0 ? 1 : ["case", isActiveLeg(), 1, 0.3]);
  const widthExpr = (lo, hi) => (active === 0
    ? ["interpolate", ["linear"], ["zoom"], 12, lo, 16, hi]
    : ["interpolate", ["linear"], ["zoom"], 12, ["case", isActiveLeg(), lo * 1.6, lo], 16, ["case", isActiveLeg(), hi * 1.5, hi]]);

  function tintBasemap() {
    const set = (id, prop, val) => { if (map.getLayer(id)) { try { map.setPaintProperty(id, prop, val); } catch (_) { /* capa distinta */ } } };
    set("background", "background-color", "#f7f7f8");
    set("landuse_residential", "fill-color", "#f2f2f4");
    set("water", "fill-color", "#a9d9f2");
    set("waterway", "line-color", "#a9d9f2");
    set("park", "fill-color", "#d4efcf");
    set("landcover_wood", "fill-color", "#c8eac0");
    set("building", "fill-color", "#ebebee");
  }

  function addOverlays() {
    if (!map || map.getSource("route")) return;
    tintBasemap();
    map.addSource("route", { type: "geojson", data: routeData(), lineMetrics: true });
    const round = { "line-cap": "round", "line-join": "round" };
    map.addLayer({ id: "route-casing", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round,
      paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 12, 6, 16, 13], "line-opacity": 0.95 } });
    map.addLayer({ id: "route-walk", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round,
      paint: {
        "line-width": widthExpr(2.6, 5.5), "line-opacity": opacityExpr(),
        "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#ff2d55", 0.5, "#ff6b3d", 1, "#ff9f0a"],
      } });
    map.addLayer({ id: "route-funicular", type: "line", source: "route", filter: ["==", ["get", "kind"], "funicular"], layout: { "line-join": "round" },
      paint: { "line-color": "#af52de", "line-width": widthExpr(3.4, 7), "line-dasharray": [1.4, 0.7], "line-opacity": opacityExpr() } });
    map.addLayer({ id: "route-cable", type: "line", source: "route", filter: ["==", ["get", "kind"], "cable"], layout: { "line-join": "round" },
      paint: { "line-color": "#5e5ce6", "line-width": widthExpr(3.2, 6.5), "line-dasharray": [0.5, 1.1], "line-opacity": opacityExpr() } });
  }

  function updateHighlight() {
    if (!map || !map.getLayer("route-walk")) return;
    for (const [id, lo, hi] of [["route-walk", 2.6, 5.5], ["route-funicular", 3.4, 7], ["route-cable", 3.2, 6.5]]) {
      map.setPaintProperty(id, "line-opacity", opacityExpr());
      map.setPaintProperty(id, "line-width", widthExpr(lo, hi));
    }
  }

  function renderMarkers() {
    if (!map) return;
    markers.forEach((m) => m.marker.remove());
    markers.length = 0;
    STOPS.forEach((s0) => {
      const s = stopData(s0);
      const wrap = document.createElement("div");
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "pin";
      pin.style.setProperty("--c", s.color);
      pin.textContent = s.n;
      pin.title = s.name;
      pin.setAttribute("aria-label", `Parada ${s.n}: ${s.name}`);
      pin.addEventListener("click", (e) => { e.stopPropagation(); go(s.n); });
      wrap.appendChild(pin);
      const marker = new maplibregl.Marker({ element: wrap }).setLngLat(s.coord).addTo(map);
      markers.push({ n: s.n, marker, pin, wrap });
    });

    poiMarkers.forEach((m) => m.remove());
    const pois = mode === "funicular"
      ? [[[-70.63351, -33.42654], "Estación Cumbre del funicular", "funi", "right"]]
      : [[[-70.63108, -33.4227], "Estación Plaza México", "cable", "right"]];
    pois.push([[-70.64474, -33.44246], "Metro Santa Lucía", "metro", "top"]);
    pois.push([[-70.63341, -33.43722], "Metro Baquedano", "metro", "top"]);
    poiMarkers = pois.map(([coord, label, cls, anchor]) => {
      const el = document.createElement("div");
      el.className = `poi ${cls}`;
      el.textContent = label;
      el.setAttribute("aria-hidden", "true");
      return new maplibregl.Marker({ element: el, anchor, offset: anchor === "top" ? [0, 6] : [-8, 0] }).setLngLat(coord).addTo(map);
    });
  }

  function renderSpotPins() {
    if (!map) return;
    spotMarkers.forEach((m) => m.remove());
    spotMarkers = [];
    popup?.remove();
    if (!active) return;
    const st = STOPS[active - 1];
    spotsOf(st.id).filter((sp) => sp.coord).forEach((sp, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "spot-pin";
      b.style.animationDelay = `${200 + i * 90}ms`;
      b.textContent = (KINDS[sp.kind] || KINDS.comer).emoji;
      b.setAttribute("aria-label", sp.name);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        popup?.remove();
        popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setLngLat(sp.coord).setText(sp.name).addTo(map);
        const el = document.getElementById(`spot-${sp.id}`);
        if (el) {
          scrollToEl(el, "center");
          el.classList.add("flash");
          setTimeout(() => el.classList.remove("flash"), 1800);
        }
      });
      spotMarkers.push(new maplibregl.Marker({ element: b }).setLngLat(sp.coord).addTo(map));
    });
  }

  function padding() {
    return mobileMq.matches ? { top: 64, bottom: 104, left: 36, right: 36 } : { top: 80, bottom: 120, left: 70, right: 70 };
  }

  function focusMap() {
    if (!map) return;
    const duration = reduceMotion.matches ? 0 : 1400;
    let coords;
    if (active === 0) {
      coords = routeData().features.flatMap((f) => f.geometry.coordinates);
    } else {
      const s = stopData(STOPS[active - 1]);
      const near = spotsOf(STOPS[active - 1].id).filter((sp) => sp.coord).map((sp) => sp.coord);
      coords = [s.coord, ...(LEGS[mode][active] || []).flatMap(([id]) => ROUTES[id].coords), ...near];
      if (coords.length === 1) {
        map.flyTo({ center: s.coord, zoom: 16, duration, essential: true });
        return;
      }
    }
    const b = new maplibregl.LngLatBounds(coords[0], coords[0]);
    coords.forEach((c) => b.extend(c));
    map.fitBounds(b, { padding: padding(), duration, maxZoom: active === 0 ? 15 : 16.5, essential: true });
  }

  function drawIn() {
    const src = map.getSource("route");
    if (!src || reduceMotion.matches) return;
    const full = routeData();
    const total = full.features.reduce((a, f) => a + f.geometry.coordinates.length, 0);
    const t0 = performance.now();
    const D = 2200;
    const frame = (t) => {
      const p = Math.min(1, (t - t0) / D);
      let budget = Math.floor((1 - Math.pow(1 - p, 3)) * total);
      const features = [];
      for (const f of full.features) {
        if (budget < 2) break;
        const c = f.geometry.coordinates;
        const k = Math.min(c.length, budget);
        budget -= k;
        if (k >= 2) features.push({ ...f, geometry: { type: "LineString", coordinates: c.slice(0, k) } });
      }
      src.setData({ type: "FeatureCollection", features });
      if (p < 1) requestAnimationFrame(frame); else src.setData(routeData());
    };
    requestAnimationFrame(frame);
  }

  function initMap() {
    if (!window.maplibregl) throw new Error("MapLibre no cargó");
    map = new maplibregl.Map({
      container: "map",
      style: STYLE_URL,
      center: [-70.643, -33.434],
      zoom: 13.3,
      minZoom: 11,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: false,
      cooperativeGestures: false,
    });
    map.touchZoomRotate.disableRotation();
    map.scrollZoom.disable(); // la rueda hace scroll en la página; se hace zoom con los botones o con dos dedos
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    map.on("load", () => {
      addOverlays();
      renderMarkers();
      updateChrome();
      renderSpotPins();
      if (active === 0) drawIn();
      focusMap();
    });
  }

  // ---------- Arranque ----------
  $("#checked").textContent = window.TOUR.checked;
  renderStats();
  renderMarquee();
  renderToday();
  renderStops(true);
  renderEat();
  updateChrome();
  observeReveal(document.querySelectorAll(".hero .reveal, .section-head.reveal, .tile.reveal"));
  try {
    initMap();
  } catch (err) {
    console.warn("Mapa no disponible:", err);
    map = null;
    $("#map-fallback").hidden = false;
  }
  if (active) scrollToEl(document.getElementById(`parada-${active}`), "start", false);
  setInterval(() => { renderToday(); refreshBadges(); }, 60000);
})();
