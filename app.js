(() => {
  "use strict";

  const STOPS = window.STOPS;
  const ROUTES = window.ROUTES;
  const LEGS = window.LEGS;
  const TOTAL = STOPS.length;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const darkMq = matchMedia("(prefers-color-scheme: dark)");
  const mobileMq = matchMedia("(max-width: 899px)");
  const STYLE = {
    light: "https://tiles.openfreemap.org/styles/positron",
    dark: "https://tiles.openfreemap.org/styles/dark",
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Estado ----------
  const params = new URLSearchParams(location.search);
  let mode = params.get("modo") === "teleferico" ? "teleferico" : "funicular";
  let active = 0; // 0 = ruta completa
  const fromHash = location.hash.match(/^#parada-(\d+)$/);
  if (fromHash && +fromHash[1] >= 1 && +fromHash[1] <= TOTAL) active = +fromHash[1];

  const stopData = (s) => (s.modes ? { ...s, ...s.modes[mode] } : s);

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

  // ---------- Formato ----------
  const nf1 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const fmtDist = (m) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${nf1.format(m / 1000)} km`);

  const ICON = {
    walk: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M9 21l2.5-6.5L14 17v4M8 12l3-4 3 1 2 3 2 1M11 8l.5 6.5"/></svg>',
    funicular: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20L22 8"/><path d="M7 9.5l8-1.5 1.5 6.5-8 1.6z"/><path d="M9.5 12.5h4"/></svg>',
    cable: '<svg class="mode-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5l20-2.5"/><path d="M12 4v4"/><rect x="6.5" y="8" width="11" height="10" rx="2.5"/><path d="M6.5 13h11"/></svg>',
    nav: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
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
    const verb = n === 3 ? "Baja en" : "Sube en";
    const ride = transit === "cable" ? `${TRANSIT_NAME[transit]}, unos 7 min` : TRANSIT_NAME[transit];
    return { kind: transit, text: `${verb} ${ride} + ${min} min a pie${m > 950 ? ` · ${fmtDist(m)}` : ""}` };
  }

  const walkTotal = () => {
    let m = 0;
    for (const parts of Object.values(LEGS[mode])) for (const [id, kind] of parts) if (kind === "walk") m += ROUTES[id].m;
    return m;
  };

  // ---------- Panel ----------
  const list = $("#paradas");

  function renderStats() {
    const last = STOPS[TOTAL - 1];
    const [h, mm] = last.time.split(":").map(Number);
    const end = h * 60 + mm + 60;
    $("#stats").innerHTML = `
      <div><dt>A pie</dt><dd>${fmtDist(walkTotal())}</dd></div>
      <div><dt>Horario</dt><dd>${STOPS[0].time}–${Math.floor(end / 60)}:${String(end % 60).padStart(2, "0")}</dd></div>
      <div><dt>Paradas</dt><dd>${TOTAL}</dd></div>`;
  }

  function renderToday() {
    const { dow, hh, min } = nowSantiago();
    const msgs = {
      1: "Los lunes no funcionan los teleféricos y el funicular cierra por lo menos el primer lunes del mes. Si puedes, cambia de día.",
      0: "El domingo la Catedral cierra a las 13:00: pasa antes del almuerzo, está a 9 minutos del Mercado.",
      6: "El sábado la Catedral cierra a las 14:30: no alargues el almuerzo. El cerro se llena desde el mediodía, así que sube a las 10:00.",
    };
    let msg = msgs[dow] || "Buen día para el tour: todo funciona y la Catedral abre hasta las 18:00.";
    if (min > 15 * 60) msg += " Para hacerlo completo hoy ya es tarde: el recorrido parte a las 10:00.";
    $("#today").innerHTML = `<p><strong>Hoy ${DIAS[dow]}.</strong> ${esc(msg)}</p>
      <p class="clock">Hora en Santiago: ${hh}. Los avisos de abierto o cerrado de cada parada usan esta hora.</p>`;
  }

  function badgeHTML(s) {
    const st = status(s.hours);
    return st ? `<span class="badge ${st.cls}" data-badge>${esc(st.text)}</span>` : "";
  }

  function cardHTML(s0) {
    const s = stopData(s0);
    const leg = legInfo(s.n);
    const [lng, lat] = s.coord;
    const maps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    const hours = s.hoursText.map((t) => `<span class="hours-line">${esc(t)}</span>`).join("")
      + (s.hoursNote ? `<span class="hours-note">${esc(s.hoursNote)}</span>` : "");
    const sources = s.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(" · ");
    const tickets = s.modes ? `<a class="go ghost" href="${esc(window.TOUR.tickets.url)}" target="_blank" rel="noopener">${ICON.ticket}Tickets</a>` : "";
    return `
      <li class="stop${s.n === active ? " is-active" : ""}" id="parada-${s.n}" data-n="${s.n}">
        ${leg ? `<div class="leg" data-kind="${leg.kind}">${ICON[leg.kind]}<span>${esc(leg.text)}</span></div>` : ""}
        <article class="card" aria-labelledby="t-${s.n}">
          <div class="stop-head">
            <button class="num" type="button" aria-label="Ver la parada ${s.n} en el mapa">${s.n}</button>
            <div>
              <p class="meta"><span>${esc(s.time)} · ${esc(s.stay)}</span>${badgeHTML(s)}</p>
              <h3 id="t-${s.n}">${esc(s.name)}</h3>
              <p class="place">${esc(s.place)}</p>
            </div>
          </div>
          <p class="lede">${esc(s.lede)}</p>
          <p class="body">${esc(s.body)}</p>
          <dl class="facts">
            <div><dt>Horario</dt><dd>${hours}</dd></div>
            <div><dt>Precio</dt><dd>${esc(s.price)}</dd></div>
            <div><dt>Acceso</dt><dd>${esc(s.access)}</dd></div>
          </dl>
          <aside class="fact"><b>Dato</b>${esc(s.fact)}</aside>
          <p class="tip"><b>Ojo:</b> ${esc(s.tip)}</p>
          <p class="links">
            <a class="go" href="${maps}" target="_blank" rel="noopener">${ICON.nav}Cómo llegar a pie</a>
            ${tickets}
            <span class="sources">Fuentes: ${sources}</span>
          </p>
        </article>
      </li>`;
  }

  function renderStops() {
    list.innerHTML = STOPS.map(cardHTML).join("");
  }

  function refreshBadges() {
    list.querySelectorAll(".stop").forEach((li) => {
      const s = stopData(STOPS[+li.dataset.n - 1]);
      const old = li.querySelector("[data-badge]");
      const html = badgeHTML(s);
      if (old) old.outerHTML = html || "";
    });
  }

  list.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const li = e.target.closest(".stop");
    if (li) go(+li.dataset.n, { scroll: false });
  });

  // ---------- Stepper ----------
  const prevBtn = $("#btn-prev");
  const nextBtn = $("#btn-next");
  const overviewBtn = $("#btn-overview");
  const stepLabel = $("#step-label");

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
    list.querySelectorAll(".stop").forEach((li) => li.classList.toggle("is-active", +li.dataset.n === active));
    markers.forEach(({ n, pin, wrap }) => {
      pin.classList.toggle("is-active", n === active);
      wrap.style.zIndex = n === active ? "3" : "1";
    });
  }

  function go(n, { scroll = true } = {}) {
    active = Math.max(0, Math.min(TOTAL, n));
    updateChrome();
    updateHighlight();
    focusMap();
    const url = `${location.pathname}${location.search}${active ? `#parada-${active}` : ""}`;
    history.replaceState(null, "", url);
    if (scroll && active) {
      document.getElementById(`parada-${active}`)?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    }
  }

  prevBtn.addEventListener("click", () => go(active - 1));
  nextBtn.addEventListener("click", () => go(active + 1));
  overviewBtn.addEventListener("click", () => go(0, { scroll: false }));

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && (t.closest("input, textarea, select, [contenteditable]") || t.closest("#map"))) return;
    if (e.key === "ArrowRight") { e.preventDefault(); if (active < TOTAL) go(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); if (active > 0) go(active - 1); }
  });

  // ---------- Modo ----------
  document.querySelectorAll('input[name="modo"]').forEach((r) => {
    r.checked = r.value === mode;
    r.addEventListener("change", () => {
      if (!r.checked) return;
      mode = r.value;
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
      focusMap();
    });
  });

  // ---------- Mapa ----------
  let map = null;
  const markers = [];
  let poiMarkers = [];

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

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
  const opacityExpr = () => (active === 0 ? 1 : ["case", isActiveLeg(), 1, 0.38]);
  const widthExpr = (lo, hi) => (active === 0
    ? ["interpolate", ["linear"], ["zoom"], 12, lo, 16, hi]
    : ["interpolate", ["linear"], ["zoom"], 12, ["case", isActiveLeg(), lo * 1.5, lo], 16, ["case", isActiveLeg(), hi * 1.4, hi]]);

  function tintBasemap() {
    const set = (id, prop, val) => { if (map.getLayer(id)) { try { map.setPaintProperty(id, prop, val); } catch (_) { /* capa distinta */ } } };
    if (darkMq.matches) {
      set("background", "background-color", "#15130f");
      set("water", "fill-color", "#1d2a33");
      set("park", "fill-color", "#18211a");
      set("landcover_wood", "fill-color", "#18211a");
    } else {
      set("background", "background-color", "#efe7da");
      set("landuse_residential", "fill-color", "#ebe2d3");
      set("water", "fill-color", "#b9cdd6");
      set("park", "fill-color", "#d6dec4");
      set("landcover_wood", "fill-color", "#ccd8b9");
      set("building", "fill-color", "#e3d8c8");
    }
  }

  function addOverlays() {
    if (!map || map.getSource("route")) return;
    tintBasemap();
    map.addSource("route", { type: "geojson", data: routeData() });
    const round = { "line-cap": "round", "line-join": "round" };
    map.addLayer({ id: "route-casing", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round,
      paint: { "line-color": css("--surface"), "line-width": ["interpolate", ["linear"], ["zoom"], 12, 5, 16, 11], "line-opacity": 0.85 } });
    map.addLayer({ id: "route-walk", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round,
      paint: { "line-color": css("--brick"), "line-width": widthExpr(2.4, 5), "line-opacity": opacityExpr() } });
    map.addLayer({ id: "route-funicular", type: "line", source: "route", filter: ["==", ["get", "kind"], "funicular"], layout: { "line-join": "round" },
      paint: { "line-color": css("--cerro"), "line-width": widthExpr(3.2, 6.5), "line-dasharray": [1.4, 0.7], "line-opacity": opacityExpr() } });
    map.addLayer({ id: "route-cable", type: "line", source: "route", filter: ["==", ["get", "kind"], "cable"], layout: { "line-join": "round" },
      paint: { "line-color": css("--cordillera"), "line-width": widthExpr(3, 6), "line-dasharray": [0.5, 1.1], "line-opacity": opacityExpr() } });
  }

  function updateHighlight() {
    if (!map || !map.getLayer("route-walk")) return;
    map.setPaintProperty("route-walk", "line-opacity", opacityExpr());
    map.setPaintProperty("route-funicular", "line-opacity", opacityExpr());
    map.setPaintProperty("route-cable", "line-opacity", opacityExpr());
    map.setPaintProperty("route-walk", "line-width", widthExpr(2.4, 5));
    map.setPaintProperty("route-funicular", "line-width", widthExpr(3.2, 6.5));
    map.setPaintProperty("route-cable", "line-width", widthExpr(3, 6));
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
      return new maplibregl.Marker({ element: el, anchor, offset: anchor === "top" ? [0, 6] : [anchor === "left" ? 8 : -8, 0] }).setLngLat(coord).addTo(map);
    });
  }

  function padding() {
    return mobileMq.matches ? { top: 64, bottom: 100, left: 36, right: 36 } : { top: 80, bottom: 110, left: 80, right: 80 };
  }

  function focusMap() {
    if (!map) return;
    const duration = reduceMotion.matches ? 0 : 1300;
    let coords;
    if (active === 0) {
      coords = routeData().features.flatMap((f) => f.geometry.coordinates);
    } else {
      const s = stopData(STOPS[active - 1]);
      coords = [s.coord, ...(LEGS[mode][active] || []).flatMap(([id]) => ROUTES[id].coords)];
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
    const D = 1800;
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
      style: darkMq.matches ? STYLE.dark : STYLE.light,
      center: [-70.643, -33.434],
      zoom: 13.3,
      minZoom: 11,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "Ruta a pie: OSRM" }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showAccuracyCircle: true }), "top-right");

    map.on("load", () => {
      // Crédito compacto cerrado al inicio (se abre con la "i"); el pie de página también lo cita.
      const closeAttrib = () => document.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      closeAttrib();
      map.once("idle", closeAttrib);
      addOverlays();
      renderMarkers();
      updateChrome();
      if (active === 0) drawIn();
      focusMap();
    });

    darkMq.addEventListener("change", () => {
      map.setStyle(darkMq.matches ? STYLE.dark : STYLE.light);
      map.once("style.load", () => { addOverlays(); updateHighlight(); });
    });
  }

  // ---------- Arranque ----------
  $("#checked").textContent = window.TOUR.checked;
  renderStats();
  renderToday();
  renderStops();
  updateChrome();
  try {
    initMap();
  } catch (err) {
    console.warn("Mapa no disponible:", err);
    map = null;
    $("#map-fallback").hidden = false;
  }
  if (active) requestAnimationFrame(() => document.getElementById(`parada-${active}`)?.scrollIntoView({ block: "start" }));
  setInterval(() => { renderToday(); refreshBadges(); }, 60000);
})();
