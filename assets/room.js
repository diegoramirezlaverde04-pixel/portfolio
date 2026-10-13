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
  const SLOTS = ["model", "map", "monitor", "house", "blink", "board", "blueprints", "tree"];
  const bySlot = {};
  const free = [...SLOTS];
  D.projects.forEach((p) => { if (p.room && free.includes(p.room)) { bySlot[p.room] = p; free.splice(free.indexOf(p.room), 1); } });
  D.projects.forEach((p) => { if (!Object.values(bySlot).includes(p) && free.length) bySlot[free.shift()] = p; });
  const colorOf = (slot, fallback) => bySlot[slot]?.color || fallback;

  // Wrap a drawn object; if a project owns the slot it becomes interactive.
  const anchors = {};
  function obj(slot, inner, anchor) {
    const p = bySlot[slot];
    if (!p) return `<g class="obj">${inner}</g>`;
    anchors[p.id] = anchor;
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

  // ── Shell: floor slab, walls, baseboards ──────────────────
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
  s += poly([P(0, 0, 0), P(0, Y, 0), P(0, Y, 0.3), P(0, 0, 0.3)], "var(--base-l)");
  s += poly([P(0, 0, 0), P(X, 0, 0), P(X, 0, 0.3), P(0, 0, 0.3)], "var(--base-r)");
  s += `</g>`;

  // ── Pathway-integration map on the left wall (slot: map) ─
  {
    const y1 = 1.2, y2 = 5.8, z1 = 2.9, z2 = 6.2, w = (y2 - y1) * S, h = (z2 - z1) * S;
    let inner = poly([P(0.03, y1, z1), P(0.03, y2, z1), P(0.03, y2, z2), P(0.03, y1, z2)], "#f7f4ec");
    const blocks = [[10, 10, 22, 14], [36, 8, 16, 20], [58, 12, 26, 12], [92, 8, 18, 26], [118, 14, 14, 18], [12, 32, 14, 24], [40, 40, 30, 20], [76, 36, 12, 30], [100, 48, 24, 14], [20, 66, 26, 12], [60, 70, 18, 10], [96, 70, 30, 10]];
    inner += `<g transform="${onFaceX(0.04, y2, z2)}">
      <rect x="5" y="5" width="${w - 10}" height="${h - 24}" fill="#efebe1"/>
      ${blocks.map(([bx, by, bw, bh]) => `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#b9b6b0"/>`).join("")}
      <path d="M7 28 H${w - 8} M7 62 H${w - 8} M33 7 V${h - 22} M90 7 V${h - 22}" stroke="#2bb673" stroke-width="2.6" fill="none"/>
      <path d="M7 28 C 30 40, 50 52, 90 62" stroke="#f2c230" stroke-width="2.6" fill="none"/>
      <path d="M90 62 L130 48 M58 62 L58 84" stroke="#e5484d" stroke-width="2.6" fill="none"/>
      <path class="route" d="M33 7 V28 H90 V62" stroke="#ffffff" stroke-width="1" fill="none" opacity=".9"/>
      <circle cx="58" cy="84" r="3" fill="#e5484d"/><circle cx="130" cy="48" r="3" fill="#e5484d"/>
      <rect x="8" y="${h - 17}" width="5" height="5" fill="#2bb673"/><rect x="15" y="${h - 17}" width="5" height="5" fill="#f2c230"/><rect x="22" y="${h - 17}" width="5" height="5" fill="#e5484d"/>
      <text x="32" y="${h - 12}" class="map-text">PATHWAY INTEGRATION</text>
    </g>`;
    s += obj("map", inner, P(0, (y1 + y2) / 2, z2 + 0.4));
  }

  // ── Shelf with an accessible tiny-house model (slot: house) ─
  {
    const col = colorOf("house", "#5b8def");
    let inner = box(0, 6.4, 3.7, 0.85, 2.9, 0.12, "#a77650");
    const Zs = 3.82, hx = 0.15, hy = 6.75, hw = 0.55, hd = 1.3, hh = 0.55;
    inner += box(hx, hy, Zs, hw, hd, hh, "#f3efe6");
    // gable roof (ridge runs along y)
    const r = Zs + hh, peak = r + 0.38, mx = hx + hw / 2;
    inner += poly([P(hx + hw + 0.06, hy - 0.06, r), P(hx + hw + 0.06, hy + hd + 0.06, r), P(mx, hy + hd + 0.06, peak), P(mx, hy - 0.06, peak)], dark(col, 0.05));
    inner += poly([P(hx - 0.06, hy + hd + 0.06, r), P(hx + hw + 0.06, hy + hd + 0.06, r), P(mx, hy + hd + 0.06, peak)], light(col, 0.2));
    // door + window on the front (x = hx + hw) face, and a ramp up to the door
    inner += `<g transform="${onFaceX(hx + hw + 0.005, hy + hd, r)}"><rect x="8" y="5" width="9" height="${hh * S - 5}" fill="${col}"/><rect x="26" y="5" width="11" height="8" fill="#bfe3ff"/></g>`;
    inner += poly([P(hx + hw, hy + hd - 0.55, Zs), P(hx + hw, hy + hd - 0.25, Zs), P(hx + hw + 0.32, hy + hd - 0.25 + 0.6, Zs), P(hx + hw + 0.32, hy + hd - 0.55 + 0.6, Zs)], "#d9d4c8");
    // hard hat
    const [kx, ky] = P(0.4, 8.95, Zs);
    inner += `<ellipse cx="${kx}" cy="${ky}" rx="15" ry="6" fill="#f5c518"/><path d="M${kx - 11} ${ky - 1} a11 11 0 0 1 22 0 Z" fill="#ffd84a"/>`;
    s += obj("house", inner, P(0.4, 7.4, 5.15));
  }

  // ── Window with skyline on the right wall ─────────────────
  {
    const x1 = 5.7, x2 = 9.2, z1 = 3.5, z2 = 6.2, w = (x2 - x1) * S, h = (z2 - z1) * S;
    s += `<g class="window">`;
    s += poly([P(x1 - 0.15, 0, z1 - 0.15), P(x2 + 0.15, 0, z1 - 0.15), P(x2 + 0.15, 0, z2 + 0.15), P(x1 - 0.15, 0, z2 + 0.15)], "#8b6a4f");
    s += poly([P(x1, 0, z1), P(x2, 0, z1), P(x2, 0, z2), P(x1, 0, z2)], "url(#sky)");
    s += `<g transform="${onFaceY(x1, 0, z2)}">`;
    const stars = [[14, 14], [40, 26], [70, 10], [96, 34], [26, 44], [108, 16], [58, 38]];
    s += stars.map(([sx, sy], i) => `<circle class="star" cx="${sx}" cy="${sy}" r="${i % 3 ? 1 : 1.5}" style="animation-delay:${i * 0.4}s"/>`).join("");
    s += `<circle class="moon" cx="${w * 0.75}" cy="${h * 0.28}" r="9"/>`;
    s += `<path class="skyline" d="M0 ${h} V${h - 22} h9 v-10 h10 v18 h8 v-30 h4 v-6 h4 v6 h4 v30 h10 v-14 h12 v-8 h10 v26 h8 v-36 h12 v40 h10 v-18 h10 V${h} Z"/>`;
    s += [[22, h - 26], [35, h - 38], [35, h - 30], [72, h - 20], [92, h - 40], [96, h - 30], [108, h - 18]]
      .map(([wx, wy], i) => `<rect class="win-light" x="${wx}" y="${wy}" width="2.5" height="2.5" style="animation-delay:${i * 0.7}s"/>`).join("");
    s += `<rect x="${w / 2 - 1.5}" y="0" width="3" height="${h}" fill="#8b6a4f"/><rect x="0" y="${h / 2 - 1.5}" width="${w}" height="3" fill="#8b6a4f"/>`;
    s += `</g>`;
    s += box(x1 - 0.2, 0, z1 - 0.32, x2 - x1 + 0.4, 0.35, 0.17, "#9b7a5c");
    s += `</g>`;
  }

  // ── Community pinboard on the right wall (slot: board) ────
  {
    const x1 = 0.9, x2 = 4.6, z1 = 4.0, z2 = 6.3, w = (x2 - x1) * S, h = (z2 - z1) * S;
    let inner = box(x1, 0, z1, x2 - x1, 0.12, z2 - z1, "#9b6f45");
    inner += `<g transform="${onFaceY(x1 + 0.08, 0.125, z2 - 0.08)}">
      <rect width="${w - 5}" height="${h - 5}" fill="#d2a874"/>
      ${[[8, 8, "#fff27a", -4], [42, 12, "#ffb3c7", 3], [78, 6, "#a8e6ff", -2], [14, 40, "#b9f5a8", 2], [52, 44, "#fff27a", -3], [90, 38, "#ffb3c7", 4]]
        .map(([nx, ny, nc, r]) => `<g transform="rotate(${r} ${nx + 13} ${ny + 12})"><rect x="${nx}" y="${ny}" width="26" height="24" fill="${nc}"/>
          <rect x="${nx + 4}" y="${ny + 7}" width="16" height="2" fill="#0003"/><rect x="${nx + 4}" y="${ny + 12}" width="12" height="2" fill="#0003"/></g>`).join("")}
      <path d="M21 10 L55 14 L91 8 M27 42 L65 46 L103 40 M55 14 L65 46" stroke="#d64545" stroke-width="1" fill="none"/>
      ${[[21, 10], [55, 14], [91, 8], [27, 42], [65, 46], [103, 40]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="2.2" fill="#d64545"/>`).join("")}
    </g>`;
    s += obj("board", inner, P((x1 + x2) / 2, 0.1, z2 + 0.4));
  }

  // ── Desk ──────────────────────────────────────────────────
  const DZ = 2.5, DT = 0.2, TOP = DZ + DT;
  s += box(0.9, 0.35, 0, 0.2, 0.2, DZ, "#6e4a2f") + box(5.3, 0.35, 0, 0.2, 0.2, DZ, "#6e4a2f");
  s += box(0.9, 2.55, 0, 0.2, 0.2, DZ, "#7d5537") + box(5.3, 2.55, 0, 0.2, 0.2, DZ, "#7d5537");
  s += box(0.7, 0.2, DZ, 5.0, 2.7, DT, "#b98455");

  // Architect lamp (click to toggle)
  {
    const [bx, by] = P(1.35, 0.75, TOP + 0.12);
    const [jx, jy] = P(1.35, 0.75, TOP + 1.8);
    const [hx, hy] = P(2.0, 1.35, TOP + 2.2);
    s += `<g class="obj toggle" id="lamp" tabindex="0" role="button" aria-label="Toggle desk lamp">
      ${cyl(1.35, 0.75, TOP, 0.36, 0.12, "#3b3d4a")}
      <path d="M${bx} ${by} L${jx} ${jy} L${hx} ${hy}" stroke="#3b3d4a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="${jx}" cy="${jy}" r="4" fill="#4a4c5a"/>
      <path d="M${hx - 16} ${hy - 4} L${hx + 6} ${hy - 14} L${hx + 14} ${hy + 6} L${hx - 4} ${hy + 14} Z" fill="#ff7d41"/>
      <ellipse class="bulb" cx="${hx + 4}" cy="${hy + 9}" rx="7" ry="4" fill="#fff4d6"/>
    </g>`;
  }

  // Monitor with a SketchUp-style street render (slot: monitor)
  {
    const x = 2.3, y = 0.4, w = 2.8, d = 0.45, z = TOP + 0.5, h = 1.9;
    let inner = box(3.45, 0.5, TOP, 0.5, 0.3, 0.5, "#2f313d") + box(3.1, 0.35, TOP, 1.2, 0.7, 0.06, "#2f313d");
    inner += box(x, y, z, w, d, h, "#2b2d38");
    const sw = (w - 0.24) * S, sh = (h - 0.24) * S;
    inner += `<g transform="${onFaceY(x + 0.12, y + d + 0.01, z + h - 0.12)}">
      <rect width="${sw}" height="${sh}" rx="2" fill="#dfeefa"/>
      <rect x="0" y="0" width="${sw}" height="6" fill="#3b3d4a"/><circle cx="4" cy="3" r="1.3" fill="#e5484d"/><circle cx="8" cy="3" r="1.3" fill="#f2c230"/>
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

  // Plan sheet with scale ruler + coffee (decor)
  s += flat(1.1, 1.55, TOP + 0.005, 1.5, 1.05, "#e9f1f7");
  s += `<g transform="${onTop(1.18, 1.62, TOP + 0.01)}"><path d="M3 8 H44 M3 18 H44 M14 3 V32 M30 3 V32" stroke="#6fa3d1" stroke-width="1.2" fill="none"/><rect x="16" y="20" width="12" height="9" fill="none" stroke="#e07a50" stroke-width="1.2"/></g>`;
  s += box(2.8, 2.2, TOP, 1.6, 0.18, 0.06, "#e8e2d5");
  s += cyl(4.9, 1.9, TOP, 0.25, 0.45, "#e8664f");
  s += `<path class="steam" d="M${P(4.9, 1.9, TOP + 0.55)[0]} ${P(4.9, 1.9, TOP + 0.55)[1]} q-5 -8 0 -16 q5 -8 0 -16" />`;

  // ── Blueprint bin (slot: blueprints) ──────────────────────
  {
    const col = colorOf("blueprints", "#64b4ff");
    let inner = "";
    [[6.75, 0.85, 2.0], [7.05, 0.75, 2.4], [6.95, 1.15, 1.7], [7.25, 1.05, 2.15]].forEach(([cx, cy, hh]) => (inner += cyl(cx, cy, 0.4, 0.13, hh, col)));
    inner += cyl(7.0, 0.95, 0, 0.55, 1.2, "#3b3d4a");
    s += obj("blueprints", inner, P(7.0, 0.95, 3.4));
  }

  // ── Chair (decor) ─────────────────────────────────────────
  s += box(3.1, 3.8, 0, 0.16, 0.16, 1.4, "#3b3d4a");
  s += box(2.6, 3.3, 1.4, 1.2, 1.1, 0.2, "#4b5263");
  s += box(2.6, 4.25, 1.6, 1.2, 0.16, 1.5, "#5a6275");

  // ── 3D campus figure-ground model table (slot: model) ──────
  // Built from the same grid as the full 3D viewer (assets/campus3d.js).
  {
    const tx = 4.2, ty = 4.2, tw = 4.6, td = 3.6, tz = 1.6;
    let inner = box(tx + 0.1, ty + 0.1, 0, 0.2, 0.2, tz, "#5a4030") + box(tx + tw - 0.3, ty + 0.1, 0, 0.2, 0.2, tz, "#5a4030");
    inner += box(tx + 0.1, ty + td - 0.3, 0, 0.2, 0.2, tz, "#6b4b37") + box(tx + tw - 0.3, ty + td - 0.3, 0, 0.2, 0.2, tz, "#6b4b37");
    inner += box(tx, ty, tz, tw, td, 0.18, "#4a4d5c");
    const Z0 = tz + 0.18;
    inner += flat(tx + 0.12, ty + 0.12, Z0 + 0.01, tw - 0.24, td - 0.24, "#f7f6f2");
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
      cells.forEach(([gx, gy, m]) => (inner += box(ox + gx * cw, oy + gy * cd, Z0 + 0.02, cw, cd, 0.05 + (m / 255) * 0.38, "#77706d")));
    }
    s += obj("model", inner, P(tx + tw / 2, ty + td / 2, Z0 + 2.4));
  }

  // ── Street tree in a planter (slot: tree) ─────────────────
  {
    const col = colorOf("tree", "#50c878");
    let inner = box(0.6, 7.6, 0, 1.1, 1.1, 0.8, "#8d8f9c");
    inner += flat(0.68, 7.68, 0.81, 0.94, 0.94, "#5b3f2a");
    const [bx, by] = P(1.15, 8.15, 0.8);
    inner += `<rect x="${bx - 3}" y="${by - 58}" width="6" height="58" fill="#7a5a3c"/>
      <circle cx="${bx}" cy="${by - 72}" r="28" fill="${dark(col, 0.12)}"/>
      <circle cx="${bx - 16}" cy="${by - 62}" r="18" fill="${col}"/>
      <circle cx="${bx + 15}" cy="${by - 64}" r="19" fill="${col}"/>
      <circle cx="${bx - 4}" cy="${by - 86}" r="17" fill="${light(col, 0.18)}"/>`;
    s += obj("tree", inner, [bx, by - 116]);
  }

  // ── Traffic cone (decor) ──────────────────────────────────
  {
    s += box(3.0, 8.7, 0, 0.6, 0.6, 0.05, "#ff7d41");
    const [cx, cy] = P(3.3, 9.0, 0.05);
    s += `<path d="M${cx - 9} ${cy} L${cx - 2} ${cy - 34} L${cx + 2} ${cy - 34} L${cx + 9} ${cy} Z" fill="#ff7d41"/>
      <path d="M${cx - 6} ${cy - 12} L${cx + 6} ${cy - 12} L${cx + 4.5} ${cy - 20} L${cx - 4.5} ${cy - 20} Z" fill="#fff"/>`;
  }

  // ── BLINK "Future City" light sculpture (slot: blink) ──────
  // Stacked recycled-cardboard towers with LED windows that cycle colour.
  {
    const towers = [[8.55, 8.35, 0.55, 0.55, 1.5], [9.15, 8.35, 0.5, 0.5, 2.2], [8.55, 8.95, 0.5, 0.5, 1.0], [9.1, 8.9, 0.55, 0.6, 1.35]];
    let inner = box(8.4, 8.2, 0, 1.45, 1.45, 0.12, "#8a6a4a");
    towers.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).forEach(([x, y, w, d, h], ti) => {
      inner += box(x, y, 0.12, w, d, h, "#c99a63");
      const rows = Math.floor(h / 0.3);
      inner += `<g transform="${onFaceX(x + w + 0.005, y + d, 0.12 + h - 0.08)}">` +
        Array.from({ length: rows }, (_, r) => [0, 1].map((c) => `<rect class="led" x="${3 + c * 8}" y="${3 + r * 10}" width="5" height="5" style="animation-delay:${(ti * 3 + r + c) * 0.37}s"/>`).join("")).join("") + `</g>`;
      inner += `<g transform="${onFaceY(x, y + d + 0.005, 0.12 + h - 0.08)}">` +
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
