// Interactive isometric urban-planning studio. Each "slot" object (city model,
// zoning map, GIS monitor…) is linked to a project from data.js; hover shows a
// label, click opens it. Everything is drawn as SVG from simple 3D shapes.
(() => {
  "use strict";

  const D = window.PORTFOLIO;
  const UI = window.PortfolioUI;
  const svg = document.getElementById("room");
  if (!svg || !D || !UI) return;
  const { esc } = UI;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Isometric helpers ─────────────────────────────────────
  const S = 34, C = Math.cos(Math.PI / 6), N = 0.5, OX = 318, OY = 262;
  const P = (x, y, z) => [OX + (x - y) * C * S, OY + (x + y) * N * S - z * S];
  const pts = (...ps) => ps.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const poly = (ps, fill, extra = "") => `<polygon points="${pts(...ps)}" style="fill:${fill}" ${extra}/>`;
  const flat = (x, y, z, w, d, fill, extra = "") => poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill, extra);

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (h, t, amt) => {
    const a = hex(h), b = hex(t);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * amt).toString(16).padStart(2, "0")).join("");
  };
  const light = (h, a) => mix(h, "#ffffff", a);
  const dark = (h, a) => mix(h, "#000000", a);

  // Axis-aligned box: top face + the two faces that point at the viewer.
  function box(x, y, z, w, d, h, color) {
    const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const fx = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    const fy = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    return `<g>${poly(fy, dark(color, 0.22))}${poly(fx, dark(color, 0.06))}${poly(top, light(color, 0.1))}</g>`;
  }

  // Vertical cylinder centred on (cx, cy).
  function cyl(cx, cy, z, r, h, color) {
    const rx = r * Math.SQRT2 * C * S, ry = r * Math.SQRT2 * N * S;
    const [bx, by] = P(cx, cy, z), [tx, ty] = P(cx, cy, z + h);
    return `<g>
      <path d="M${tx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${tx + rx},${ty} Z" style="fill:${dark(color, 0.15)}"/>
      <ellipse cx="${tx}" cy="${ty}" rx="${rx}" ry="${ry}" style="fill:${light(color, 0.1)}"/>
    </g>`;
  }

  // Tiny tree: trunk + round canopy (for the model and the street tree).
  function tree(cx, cy, z, size, color) {
    const [bx, by] = P(cx, cy, z);
    return `<g><rect x="${bx - size * 0.12}" y="${by - size * 0.9}" width="${size * 0.24}" height="${size * 0.9}" fill="#7a5a3c"/>
      <circle cx="${bx}" cy="${by - size * 1.25}" r="${size * 0.6}" fill="${color}"/>
      <circle cx="${bx - size * 0.18}" cy="${by - size * 1.4}" r="${size * 0.3}" fill="${light(color, 0.25)}"/></g>`;
  }

  // Affine transforms for drawing flat 2D content onto iso planes (px units).
  const onFaceY = (x, y, z) => { const [ex, ey] = P(x, y, z); return `matrix(${C} ${N} 0 1 ${ex} ${ey})`; }; // plane y=const, u→+x
  const onFaceX = (x, y, z) => { const [ex, ey] = P(x, y, z); return `matrix(${C} ${-N} 0 1 ${ex} ${ey})`; }; // plane x=const, u→-y
  const onTop = (x, y, z) => { const [ex, ey] = P(x, y, z); return `matrix(${C} ${N} ${-C} ${N} ${ex} ${ey})`; }; // plane z=const

  // ── Map projects onto room objects ────────────────────────
  const SLOTS = ["model", "pad", "map", "monitor", "house", "blink", "board", "blueprints", "tree"];
  const bySlot = {};
  const free = [...SLOTS];
  // `room` may be one slot or a list of slots (one project, several objects)
  D.projects.forEach((p) => [].concat(p.room || []).forEach((r) => { if (free.includes(r)) { bySlot[r] = p; free.splice(free.indexOf(r), 1); } }));
  D.projects.forEach((p) => { if (!Object.values(bySlot).includes(p) && free.length) bySlot[free.shift()] = p; });
  const colorOf = (slot, fallback) => bySlot[slot]?.color || fallback;

  // Wrap a drawn object; if a project owns the slot it becomes interactive.
  const anchors = {};
  function obj(slot, inner, anchor) {
    const p = bySlot[slot];
    if (!p) return `<g class="obj">${inner}</g>`;
    anchors[p.id] ||= anchor; // first object of a project anchors its label
    const [ax, ay] = anchor;
    return `<g class="obj project" data-id="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(p.title)}: ${esc(p.summary)}" style="--c:${esc(p.color || "#ff7d41")}">
      ${inner}
      <g class="beacon" transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)})"><circle r="9" class="ring"/><circle r="3.5" class="core"/></g>
    </g>`;
  }

  const X = 10, Y = 10, Z = 7, T = 0.3;
  let s = `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color:var(--sky-1)"/><stop offset="1" style="stop-color:var(--sky-2)"/>
    </linearGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd59a" stop-opacity=".7"/><stop offset=".45" stop-color="#ffb35c" stop-opacity=".22"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <radialGradient id="blinkGlow"><stop offset="0" stop-color="#d79bff" stop-opacity=".45"/><stop offset="1" stop-color="#d79bff" stop-opacity="0"/></radialGradient>
  </defs>`;

  // Modern palette: white walls, light oak, matte black details.
  const INK = "#262626", WHITE = "#f3f2ef", OAK = "#cfae82";

  // ── Shell: floor slab, walls, shadow-gap baseboards ────────
  s += `<g class="shell">`;
  s += poly([P(X, 0, 0), P(X, Y, 0), P(X, Y, -0.45), P(X, 0, -0.45)], "var(--slab-r)");
  s += poly([P(0, Y, 0), P(X, Y, 0), P(X, Y, -0.45), P(0, Y, -0.45)], "var(--slab-l)");
  s += flat(0, 0, 0, X, Y, "var(--floor)");
  for (let i = 1; i < 10; i++) s += `<line x1="${P(i, 0, 0)[0]}" y1="${P(i, 0, 0)[1]}" x2="${P(i, Y, 0)[0]}" y2="${P(i, Y, 0)[1]}" class="plank"/>`;
  s += poly([P(0, 0, 0), P(0, Y, 0), P(0, Y, Z), P(0, 0, Z)], "var(--wall-l)");
  s += poly([P(0, 0, 0), P(X, 0, 0), P(X, 0, Z), P(0, 0, Z)], "var(--wall-r)");
  s += poly([P(-T, -T, Z), P(0, 0, Z), P(0, Y, Z), P(-T, Y, Z)], "var(--wall-cap)");
  s += poly([P(-T, -T, Z), P(X, -T, Z), P(X, 0, Z), P(0, 0, Z)], "var(--wall-cap)");
  s += poly([P(-T, Y, -0.45), P(0, Y, -0.45), P(0, Y, Z), P(-T, Y, Z)], "var(--slab-l)");
  s += poly([P(X, -T, -0.45), P(X, 0, -0.45), P(X, 0, Z), P(X, -T, Z)], "var(--slab-r)");
  s += poly([P(0, 0, 0), P(0, Y, 0), P(0, Y, 0.12), P(0, 0, 0.12)], "var(--base-l)");
  s += poly([P(0, 0, 0), P(X, 0, 0), P(X, 0, 0.12), P(0, 0, 0.12)], "var(--base-r)");
  s += `</g>`;

  // ── Floor-to-ceiling window on the right wall ─────────────
  {
    const x1 = 5.5, x2 = 9.6, z1 = 0.12, z2 = 6.6, w = (x2 - x1) * S, h = (z2 - z1) * S;
    s += `<g class="window">`;
    s += poly([P(x1 - 0.08, 0, z1), P(x2 + 0.08, 0, z1), P(x2 + 0.08, 0, z2 + 0.08), P(x1 - 0.08, 0, z2 + 0.08)], INK);
    s += poly([P(x1, 0, z1), P(x2, 0, z1), P(x2, 0, z2), P(x1, 0, z2)], "url(#sky)");
    s += `<g transform="${onFaceY(x1, 0, z2)}">`;
    const stars = [[14, 14], [40, 26], [70, 10], [96, 34], [26, 44], [118, 16], [58, 38]];
    s += stars.map(([sx, sy], i) => `<circle class="star" cx="${sx}" cy="${sy}" r="${i % 3 ? 1 : 1.5}" style="animation-delay:${i * 0.4}s"/>`).join("");
    s += `<circle class="moon" cx="${w * 0.72}" cy="${h * 0.16}" r="10"/>`;
    const g = h * 0.62;
    s += `<path class="skyline" d="M0 ${h} V${g - 10} h12 v-22 h10 v30 h9 v-46 h5 v-8 h5 v8 h5 v46 h12 v-20 h14 v-12 h10 v38 h9 v-54 h14 v58 h12 v-26 h12 V${h} Z"/>`;
    s += [[16, g - 24], [38, g - 40], [38, g - 28], [80, g - 18], [104, g - 52], [108, g - 38], [124, g - 20]]
      .map(([wx, wy], i) => `<rect class="win-light" x="${wx}" y="${wy}" width="2.5" height="2.5" style="animation-delay:${i * 0.7}s"/>`).join("");
    s += `<rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.38}" class="window-reflect"/>`;
    s += [w / 3, (2 * w) / 3].map((mx) => `<rect x="${mx - 1.2}" y="0" width="2.4" height="${h}" fill="${INK}"/>`).join("");
    s += `<rect x="0" y="${h * 0.62 - 1.2}" width="${w}" height="2.4" fill="${INK}"/>`;
    s += `</g></g>`;
  }

  // ── Framed pathway-integration map on the left wall (slot: map)
  {
    const y1 = 1.2, y2 = 5.8, z1 = 3.0, z2 = 6.2, w = (y2 - y1) * S, h = (z2 - z1) * S;
    let inner = poly([P(0.02, y1 - 0.06, z1 - 0.06), P(0.02, y2 + 0.06, z1 - 0.06), P(0.02, y2 + 0.06, z2 + 0.06), P(0.02, y1 - 0.06, z2 + 0.06)], INK);
    inner += poly([P(0.03, y1, z1), P(0.03, y2, z1), P(0.03, y2, z2), P(0.03, y1, z2)], "#fbfaf7");
    const blocks = [[14, 12, 22, 14], [40, 10, 16, 20], [62, 14, 26, 12], [96, 10, 18, 26], [120, 16, 14, 18], [16, 34, 14, 22], [44, 40, 30, 18], [80, 36, 12, 28], [104, 48, 22, 14], [24, 64, 26, 10], [64, 68, 18, 8], [100, 68, 28, 8]];
    inner += `<g transform="${onFaceX(0.04, y2, z2)}">
      ${blocks.map(([bx, by, bw, bh]) => `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#c9c6c0"/>`).join("")}
      <path d="M10 30 H${w - 10} M10 62 H${w - 10} M37 8 V${h - 22} M94 8 V${h - 22}" stroke="#2bb673" stroke-width="2.4" fill="none"/>
      <path d="M10 30 C 32 42, 54 52, 94 62" stroke="#f2c230" stroke-width="2.4" fill="none"/>
      <path d="M94 62 L134 48 M62 62 L62 84" stroke="#e5484d" stroke-width="2.4" fill="none"/>
      <path class="route" d="M37 8 V30 H94 V62" stroke="#ffffff" stroke-width="1" fill="none" opacity=".9"/>
      <circle cx="62" cy="84" r="3" fill="#e5484d"/><circle cx="134" cy="48" r="3" fill="#e5484d"/>
      <rect x="12" y="${h - 16}" width="5" height="5" fill="#2bb673"/><rect x="19" y="${h - 16}" width="5" height="5" fill="#f2c230"/><rect x="26" y="${h - 16}" width="5" height="5" fill="#e5484d"/>
      <text x="36" y="${h - 11}" class="map-text">PATHWAY INTEGRATION</text>
    </g>`;
    s += obj("map", inner, P(0, (y1 + y2) / 2, z2 + 0.4));
  }

  // ── Street-name sign on the left wall (decor) ─────────────
  {
    const y1 = 6.5, y2 = 8.9, z1 = 5.55, z2 = 6.15, w = (y2 - y1) * S, h = (z2 - z1) * S;
    s += poly([P(0.03, y1, z1), P(0.03, y2, z1), P(0.03, y2, z2), P(0.03, y1, z2)], "#1f7a4d");
    s += `<g transform="${onFaceX(0.04, y2, z2)}"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="#fff" stroke-width="1.2" rx="2"/>
      <text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" class="sign-text">HOPKINS ST</text></g>`;
  }

  // ── Floating oak shelf with the tiny-house model (slot: house)
  {
    const col = colorOf("house", "#5b8def");
    let inner = box(0, 6.4, 3.72, 0.8, 2.9, 0.08, OAK);
    const Zs = 3.8, hx = 0.13, hy = 6.75, hw = 0.55, hd = 1.3, hh = 0.55;
    inner += box(hx, hy, Zs, hw, hd, hh, "#fbfaf7");
    const r = Zs + hh, peak = r + 0.38, mx = hx + hw / 2;
    inner += poly([P(hx + hw + 0.06, hy - 0.06, r), P(hx + hw + 0.06, hy + hd + 0.06, r), P(mx, hy + hd + 0.06, peak), P(mx, hy - 0.06, peak)], dark(col, 0.05));
    inner += poly([P(hx - 0.06, hy + hd + 0.06, r), P(hx + hw + 0.06, hy + hd + 0.06, r), P(mx, hy + hd + 0.06, peak)], light(col, 0.2));
    inner += `<g transform="${onFaceX(hx + hw + 0.005, hy + hd, r)}"><rect x="8" y="5" width="9" height="${hh * S - 5}" fill="${col}"/><rect x="26" y="5" width="11" height="8" fill="#bfe3ff"/></g>`;
    inner += poly([P(hx + hw, hy + hd - 0.55, Zs), P(hx + hw, hy + hd - 0.25, Zs), P(hx + hw + 0.32, hy + hd - 0.25 + 0.6, Zs), P(hx + hw + 0.32, hy + hd - 0.55 + 0.6, Zs)], "#d9d4c8");
    // mini traffic cone
    const [qx, qy] = P(0.4, 8.85, Zs);
    inner += `<path d="M${qx - 7} ${qy} L${qx - 1.5} ${qy - 24} L${qx + 1.5} ${qy - 24} L${qx + 7} ${qy} Z" fill="#ff7d41"/>
      <path d="M${qx - 4.6} ${qy - 8} L${qx + 4.6} ${qy - 8} L${qx + 3.4} ${qy - 14} L${qx - 3.4} ${qy - 14} Z" fill="#fff"/>
      <rect x="${qx - 9}" y="${qy - 1}" width="18" height="2.5" fill="#ff7d41"/>`;
    s += obj("house", inner, P(0.4, 7.4, 5.15));
  }

  // ── Minimal felt pinboard on the right wall (slot: board) ──
  {
    const x1 = 0.9, x2 = 4.6, z1 = 4.0, z2 = 6.3, w = (x2 - x1) * S, h = (z2 - z1) * S;
    let inner = box(x1, 0, z1, x2 - x1, 0.06, z2 - z1, INK);
    inner += `<g transform="${onFaceY(x1 + 0.05, 0.065, z2 - 0.05)}">
      <rect width="${w - 3}" height="${h - 3}" fill="#e2e0db"/>
      ${[[10, 10, "#fbfaf7"], [44, 10, "#d6efe3"], [78, 10, "#fbfaf7"], [10, 42, "#fdf1c9"], [44, 42, "#fbfaf7"], [78, 42, "#d6efe3"]]
        .map(([nx, ny, nc]) => `<rect x="${nx}" y="${ny}" width="26" height="24" fill="${nc}"/>
          <rect x="${nx + 4}" y="${ny + 7}" width="16" height="2" fill="#0002"/><rect x="${nx + 4}" y="${ny + 12}" width="11" height="2" fill="#0002"/>`).join("")}
      ${[[23, 10], [57, 10], [91, 10], [23, 42], [57, 42], [91, 42]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="1.8" fill="${INK}"/>`).join("")}
    </g>`;
    s += obj("board", inner, P((x1 + x2) / 2, 0.1, z2 + 0.4));
  }

  // ── Rug ───────────────────────────────────────────────────
  s += flat(3.4, 3.4, 0.005, 6.0, 5.6, "var(--rug)");

  // ── Desk: white top on slim black legs ────────────────────
  const DZ = 2.55, DT = 0.12, TOP = DZ + DT;
  s += box(0.85, 0.3, 0, 0.07, 0.07, DZ, INK) + box(5.45, 0.3, 0, 0.07, 0.07, DZ, INK);
  s += box(0.85, 2.7, 0, 0.07, 0.07, DZ, INK) + box(5.45, 2.7, 0, 0.07, 0.07, DZ, INK);
  s += box(0.7, 0.2, DZ, 5.0, 2.7, DT, WHITE);

  // Task lamp (click to toggle)
  {
    const [bx, by] = P(1.35, 0.75, TOP + 0.05);
    const [jx, jy] = P(1.35, 0.75, TOP + 1.9);
    const [hx, hy] = P(2.0, 1.35, TOP + 2.2);
    s += `<g class="obj toggle" id="lamp" tabindex="0" role="button" aria-label="Toggle desk lamp">
      ${cyl(1.35, 0.75, TOP, 0.3, 0.05, INK)}
      <path d="M${bx} ${by} L${jx} ${jy} L${hx} ${hy}" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M${hx - 13} ${hy + 3} A13 9 0 0 1 ${hx + 13} ${hy + 3} Z" fill="${INK}"/>
      <ellipse class="bulb" cx="${hx}" cy="${hy + 4}" rx="9" ry="3" fill="#fff4d6"/>
    </g>`;
  }

  // Thin-bezel monitor with a SketchUp-style street render (slot: monitor)
  {
    const x = 2.3, y = 0.45, w = 2.8, d = 0.12, z = TOP + 0.55, h = 1.75;
    let inner = box(3.15, 0.35, TOP, 1.1, 0.55, 0.03, "#3a3a3a") + box(3.6, 0.42, TOP, 0.2, 0.12, 0.6, "#3a3a3a");
    inner += box(x, y, z, w, d, h, "#1d1d1d");
    const sw = (w - 0.1) * S, sh = (h - 0.1) * S;
    inner += `<g transform="${onFaceY(x + 0.05, y + d + 0.005, z + h - 0.05)}">
      <rect width="${sw}" height="${sh}" fill="#e6f1fa"/>
      <rect x="0" y="0" width="${sw}" height="6" fill="#f4f4f4"/><circle cx="4" cy="3" r="1.3" fill="#e5484d"/><circle cx="8" cy="3" r="1.3" fill="#f2c230"/><circle cx="12" cy="3" r="1.3" fill="#2bb673"/>
      <path d="M${sw * 0.18} ${sh * 0.72} V${sh * 0.42} A${sw * 0.32} ${sh * 0.36} 0 0 1 ${sw * 0.82} ${sh * 0.42} V${sh * 0.72} Z" fill="#e8dcc6"/>
      ${[0.36, 0.45, 0.55, 0.64].map((f) => `<rect x="${sw * f - 2}" y="${sh * 0.36}" width="4" height="${sh * 0.3}" fill="#9fb7c9"/>`).join("")}
      <rect x="0" y="${sh * 0.72}" width="${sw}" height="${sh * 0.28}" fill="#8b8f99"/>
      <rect x="0" y="${sh * 0.72}" width="${sw}" height="3" fill="#6fbf4a"/>
      ${[0.3, 0.42, 0.54, 0.66].map((f) => `<rect x="${sw * f}" y="${sh * 0.85}" width="7" height="3" fill="#f2d231"/>`).join("")}
      <rect x="${sw * 0.12}" y="${sh * 0.6}" width="2" height="9" fill="#333"/><circle cx="${sw * 0.12 + 1}" cy="${sh * 0.59}" r="2" fill="#333"/>
      <rect x="${sw * 0.86}" y="${sh * 0.62}" width="2" height="8" fill="#333"/><circle cx="${sw * 0.86 + 1}" cy="${sh * 0.61}" r="2" fill="#333"/>
    </g>`;
    s += obj("monitor", inner, P(x + w / 2, y + d / 2, z + h + 0.7));
  }

  // Tracing pad with a perspective sketch of a ramp + stairs (slot: pad)
  {
    const x = 0.95, y = 1.3, w = 2.05, d = 1.3;
    let inner = flat(x + 0.08, y + 0.06, TOP + 0.004, w, d, "#ffffff");
    inner += flat(x, y, TOP + 0.008, w, d, "#fbf3d2");
    const pw = w * S, pd = d * S;
    inner += `<g transform="${onTop(x, y, TOP + 0.01)}" class="sketch">
      <path d="M4 ${pd - 6} L${pw * 0.5} ${pd * 0.3} L${pw - 4} ${pd - 6}" stroke="#8e8a80" stroke-width=".6" fill="none" stroke-dasharray="2 2"/>
      ${Array.from({ length: 7 }, (_, i) => { const t = i / 7, yy = pd - 8 - t * (pd * 0.55), half = (1 - t) * pw * 0.2 + 3; return `<path d="M${pw * 0.36 - half} ${yy} H${pw * 0.36 + half}" stroke="#4a4744" stroke-width=".9"/>`; }).join("")}
      <path d="M${pw * 0.56} ${pd - 6} L${pw * 0.52} ${pd * 0.34} M${pw * 0.86} ${pd - 6} L${pw * 0.6} ${pd * 0.34}" stroke="#4a4744" stroke-width="1" fill="none"/>
      <path d="M${pw * 0.6} ${pd - 16} L${pw * 0.82} ${pd - 16} M${pw * 0.57} ${pd - 28} L${pw * 0.74} ${pd - 28}" stroke="#2bb673" stroke-width="1.1"/>
      <path d="M8 10 q4 -6 8 0 q4 -6 8 0 M${pw - 22} 10 q4 -6 8 0 q4 -6 8 0" stroke="#7d7a72" stroke-width=".8" fill="none"/>
      <path d="M6 ${pd - 3} H${pw * 0.3}" stroke="#4a4744" stroke-width=".5"/>
    </g>`;
    // pencil
    inner += box(x + 0.35, y + d + 0.08, TOP, 1.25, 0.07, 0.07, "#f2c230");
    inner += poly([P(x + 0.35, y + d + 0.08, TOP + 0.035), P(x + 0.35, y + d + 0.15, TOP + 0.035), P(x + 0.2, y + d + 0.115, TOP + 0.035)], "#e8cfa5");
    s += obj("pad", inner, P(x + w / 2, y + d / 2, TOP + 1.3));
  }

  // Keyboard, ceramic mug (decor)
  s += box(3.2, 2.15, TOP, 1.45, 0.45, 0.04, "#e4e2dd");
  s += cyl(4.9, 1.9, TOP, 0.22, 0.4, "#fbfaf7");
  s += `<path class="steam" d="M${P(4.9, 1.9, TOP + 0.5)[0]} ${P(4.9, 1.9, TOP + 0.5)[1]} q-5 -8 0 -16 q5 -8 0 -16" />`;

  // ── Drawing tube holder (slot: blueprints) ────────────────
  {
    const col = colorOf("blueprints", "#9cc7ef");
    let inner = "";
    [[6.35, 0.85, 2.0], [6.65, 0.75, 2.35], [6.55, 1.15, 1.7], [6.85, 1.05, 2.1]].forEach(([cx, cy, hh]) => (inner += cyl(cx, cy, 0.4, 0.12, hh, col)));
    inner += cyl(6.6, 0.95, 0, 0.5, 1.15, INK);
    s += obj("blueprints", inner, P(6.6, 0.95, 3.3));
  }

  // ── Shell chair (decor) ───────────────────────────────────
  s += box(3.12, 3.82, 0, 0.06, 0.06, 1.4, INK) + box(2.7, 3.4, 0, 0.05, 0.05, 1.4, INK) + box(3.6, 3.4, 0, 0.05, 0.05, 1.4, INK);
  s += box(2.6, 3.3, 1.4, 1.15, 1.05, 0.12, WHITE);
  s += box(2.6, 4.25, 1.52, 1.15, 0.1, 1.25, WHITE);

  // ── 3D campus figure-ground model table (slot: model) ──────
  // Built from the same grid as the full 3D viewer (assets/campus3d.js).
  {
    const tx = 4.2, ty = 4.2, tw = 4.6, td = 3.6, tz = 1.65;
    let inner = box(tx + 0.15, ty + 0.15, 0, 0.07, 0.07, tz, INK) + box(tx + tw - 0.22, ty + 0.15, 0, 0.07, 0.07, tz, INK);
    inner += box(tx + 0.15, ty + td - 0.22, 0, 0.07, 0.07, tz, INK) + box(tx + tw - 0.22, ty + td - 0.22, 0, 0.07, 0.07, tz, INK);
    inner += box(tx, ty, tz, tw, td, 0.1, WHITE);
    const Z0 = tz + 0.1;
    inner += flat(tx + 0.15, ty + 0.15, Z0 + 0.005, tw - 0.3, td - 0.3, "#ffffff");
    const C3 = window.CAMPUS3D;
    if (C3) {
      const hts = Uint8Array.from(atob(C3.heights), (c) => c.charCodeAt(0));
      const F = 6, gw = Math.floor(C3.w / F), gh = Math.floor(C3.h / F);
      const cw = (tw - 0.4) / gw, cd = Math.min((td - 0.4) / gh, cw);
      const ox = tx + 0.2, oy = ty + (td - gh * cd) / 2;
      const cells = [];
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
        let m = 0, n = 0;
        for (let yy = 0; yy < F; yy++) for (let xx = 0; xx < F; xx++) { const v = hts[(gy * F + yy) * C3.w + gx * F + xx]; if (v) { n++; m = Math.max(m, v); } }
        if (n > F * F * 0.4) cells.push([gx, gy, m]);
      }
      // painter's order: back (small x+y) to front
      cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
      cells.forEach(([gx, gy, m]) => (inner += box(ox + gx * cw, oy + gy * cd, Z0 + 0.01, cw, cd, 0.05 + (m / 255) * 0.38, "#9a948f")));
    }
    // scale figure standing at the model's front corner
    const [px, py] = P(tx + tw - 0.35, ty + td - 0.35, Z0);
    inner += `<g class="scale-fig"><circle cx="${px}" cy="${py - 13}" r="2.6" fill="#2bb673"/><rect x="${px - 2}" y="${py - 10.5}" width="4" height="10.5" rx="1.5" fill="#2bb673"/></g>`;
    s += obj("model", inner, P(tx + tw / 2, ty + td / 2, Z0 + 2.4));
  }

  // ── Plant in a white planter (slot: tree) ─────────────────
  {
    const col = colorOf("tree", "#3f9a5c");
    let inner = cyl(1.15, 8.15, 0, 0.55, 0.95, "#f1f0ec");
    const [bx, by] = P(1.15, 8.15, 0.95);
    const leaves = [[-22, -44, -30], [20, -50, 28], [-6, -70, -8], [-30, -24, -55], [28, -28, 52], [8, -38, 14], [-14, -58, -20], [16, -66, 18]];
    inner += leaves.map(([dx, dy, rot], i) => `<path d="M${bx} ${by} Q${bx + dx * 0.3} ${by + dy * 0.55} ${bx + dx} ${by + dy}" stroke="${dark(col, 0.3)}" stroke-width="1.6" fill="none"/>
      <ellipse cx="${bx + dx}" cy="${by + dy}" rx="13" ry="7.5" transform="rotate(${rot} ${bx + dx} ${by + dy})" fill="${i % 2 ? col : light(col, 0.18)}"/>`).join("");
    s += obj("tree", inner, [bx, by - 92]);
  }

  // ── Arc floor lamp (decor) ────────────────────────────────
  {
    const [fx, fy] = P(2.3, 9.0, 0.06), [ax, ay] = P(3.4, 7.0, 4.6);
    s += cyl(2.3, 9.0, 0, 0.32, 0.06, INK);
    s += `<path d="M${fx} ${fy} C ${fx - 6} ${fy - 150}, ${ax - 30} ${ay - 40}, ${ax} ${ay}" stroke="${INK}" stroke-width="2.2" fill="none"/>
      <path d="M${ax - 12} ${ay + 10} A12 10 0 0 1 ${ax + 12} ${ay + 10} Z" fill="${INK}"/>`;
  }

  // ── BLINK "Future City" light sculpture (slot: blink) ──────
  // Stacked recycled-cardboard towers with LED windows that cycle colour.
  {
    const towers = [[8.55, 8.35, 0.55, 0.55, 1.5], [9.15, 8.35, 0.5, 0.5, 2.2], [8.55, 8.95, 0.5, 0.5, 1.0], [9.1, 8.9, 0.55, 0.6, 1.35]];
    let inner = box(8.4, 8.2, 0, 1.45, 1.45, 0.1, INK);
    towers.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).forEach(([x, y, w, d, h], ti) => {
      inner += box(x, y, 0.1, w, d, h, "#c99a63");
      const rows = Math.floor(h / 0.3);
      inner += `<g transform="${onFaceX(x + w + 0.005, y + d, 0.1 + h - 0.08)}">` +
        Array.from({ length: rows }, (_, r) => [0, 1].map((c) => `<rect class="led" x="${3 + c * 8}" y="${3 + r * 10}" width="5" height="5" style="animation-delay:${(ti * 3 + r + c) * 0.37}s"/>`).join("")).join("") + `</g>`;
      inner += `<g transform="${onFaceY(x, y + d + 0.005, 0.1 + h - 0.08)}">` +
        Array.from({ length: rows }, (_, r) => [0, 1].map((c) => `<rect class="led" x="${3 + c * 8}" y="${3 + r * 10}" width="5" height="5" style="animation-delay:${(ti * 5 + r * 2 + c) * 0.29}s"/>`).join("")).join("") + `</g>`;
    });
    const [gx, gy] = P(9.1, 8.9, 1.2);
    inner += `<circle class="blink-glow" cx="${gx}" cy="${gy}" r="70"/>`;
    s += obj("blink", inner, P(9.1, 8.9, 3.3));
  }

  // ── Lighting overlays ─────────────────────────────────────
  {
    const [gx, gy] = P(2.2, 1.6, TOP);
    // Clip lighting to the room's silhouette so it never spills outside.
    const outline = pts(P(-T, -T, Z), P(X, -T, Z), P(X, -T, -0.45), P(X, Y, -0.45), P(-T, Y, -0.45), P(-T, Y, Z));
    s += `<clipPath id="roomClip"><polygon points="${outline}"/></clipPath>`;
    s += `<circle class="lamp-glow" cx="${gx}" cy="${gy}" r="170" fill="url(#lampGlow)" clip-path="url(#roomClip)"/>`;
    s += `<polygon class="dim-overlay" points="${outline}"/>`;
  }

  svg.innerHTML = s;

  // ── Interaction: label pill, chips, click/keyboard ────────
  const wrap = svg.parentElement;
  const label = document.getElementById("room-label");
  const chips = document.getElementById("room-chips");
  const project = (id) => D.projects.find((p) => p.id === id);

  chips.innerHTML = D.projects
    .map((p) => `<button class="room-chip" data-id="${esc(p.id)}" style="--c:${esc(p.color || "#ff7d41")}">${p.status === "live" ? "✓ " : ""}${esc(p.title)}</button>`)
    .join("");

  function showLabel(id) {
    const p = project(id);
    if (!p) return;
    const pt = svg.createSVGPoint();
    [pt.x, pt.y] = anchors[id];
    const sp = pt.matrixTransform(svg.getScreenCTM());
    const wr = wrap.getBoundingClientRect();
    label.innerHTML = `<span class="dot"></span>${esc(p.title.toUpperCase())} <span class="sep">—</span> ${esc(p.summary)}`;
    label.style.setProperty("--c", p.color || "#ff7d41");
    label.style.left = `${sp.x - wr.left}px`;
    label.style.top = `${sp.y - wr.top}px`;
    label.classList.add("on");
    // keep the pill inside the room frame
    const lr = label.getBoundingClientRect();
    const shift = lr.left < wr.left + 8 ? wr.left + 8 - lr.left : lr.right > wr.right - 8 ? wr.right - 8 - lr.right : 0;
    if (shift) label.style.left = `${sp.x - wr.left + shift}px`;
    svg.querySelectorAll(".obj.project").forEach((o) => o.classList.toggle("active", o.dataset.id === id));
    chips.querySelectorAll(".room-chip").forEach((c) => c.classList.toggle("active", c.dataset.id === id));
  }
  function hideLabel() {
    label.classList.remove("on");
    svg.querySelectorAll(".obj.project.active").forEach((o) => o.classList.remove("active"));
    chips.querySelectorAll(".room-chip.active").forEach((c) => c.classList.remove("active"));
  }

  svg.querySelectorAll(".obj.project").forEach((o) => {
    const id = o.dataset.id;
    o.addEventListener("pointerenter", () => showLabel(id));
    o.addEventListener("pointerleave", hideLabel);
    o.addEventListener("focus", () => showLabel(id));
    o.addEventListener("blur", hideLabel);
    o.addEventListener("click", () => UI.openProject(id));
    o.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); UI.openProject(id); } });
  });
  chips.querySelectorAll(".room-chip").forEach((c) => {
    const id = c.dataset.id;
    // Chips for projects without a room object still open the modal.
    if (anchors[id]) {
      c.addEventListener("pointerenter", () => showLabel(id));
      c.addEventListener("pointerleave", hideLabel);
      c.addEventListener("focus", () => showLabel(id));
      c.addEventListener("blur", hideLabel);
    }
    c.addEventListener("click", () => UI.openProject(id));
  });

  // Lamp toggle
  const lampEl = document.getElementById("lamp");
  function toggleLamp() {
    svg.classList.toggle("lamp-off");
    return svg.classList.contains("lamp-off") ? "off" : "on";
  }
  lampEl.addEventListener("click", toggleLamp);
  lampEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleLamp(); } });

  // Gentle parallax tilt following the cursor
  if (!reduceMotion) {
    wrap.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      svg.style.transform = `perspective(1200px) rotateX(${-dy * 4}deg) rotateY(${dx * 5}deg)`;
    });
    wrap.addEventListener("pointerleave", () => (svg.style.transform = ""));
  }

  window.PortfolioRoom = { toggleLamp };
})();
