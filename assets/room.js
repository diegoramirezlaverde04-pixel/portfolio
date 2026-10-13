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
  const SLOTS = ["model", "map", "gis", "board", "blueprints", "tree", "transit"];
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
    <radialGradient id="heat"><stop offset="0" stop-color="#ff5a28" stop-opacity=".9"/><stop offset=".5" stop-color="#f5c518" stop-opacity=".45"/><stop offset="1" stop-color="#f5c518" stop-opacity="0"/></radialGradient>
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

  // ── Zoning map on the left wall (slot: map) ───────────────
  {
    const y1 = 1.2, y2 = 5.8, z1 = 2.9, z2 = 6.2, w = (y2 - y1) * S, h = (z2 - z1) * S;
    const col = colorOf("map", "#7c5cff");
    let inner = poly([P(0.03, y1, z1), P(0.03, y2, z1), P(0.03, y2, z2), P(0.03, y1, z2)], "#f4efe4");
    inner += `<g transform="${onFaceX(0.04, y2, z2)}">
      <rect x="5" y="5" width="${w - 10}" height="${h - 24}" fill="#efe9d9"/>
      <rect x="8" y="8" width="38" height="30" fill="#f6d77b"/><rect x="50" y="8" width="30" height="22" fill="#f6d77b"/>
      <rect x="84" y="8" width="${w - 92}" height="40" fill="#c9b6ef"/>
      <rect x="8" y="42" width="30" height="${h - 64}" fill="#9fd89a"/>
      <rect x="42" y="42" width="46" height="26" fill="#f2a3a3"/><rect x="92" y="52" width="${w - 100}" height="${h - 74}" fill="#f6d77b"/>
      <rect x="42" y="72" width="46" height="${h - 94}" fill="#f2a3a3" opacity=".75"/>
      <path d="M5 ${h - 40} C 40 ${h - 60}, 70 ${h - 20}, ${w - 5} ${h - 50}" stroke="#6fb3e8" stroke-width="5" fill="none"/>
      <path d="M12 20 L60 50 L${w - 20} 60" stroke="${col}" stroke-width="3" fill="none"/>
      <path d="M40 ${h - 26} L65 30 L80 10" stroke="#e05d5d" stroke-width="3" fill="none"/>
      ${[[12, 20], [60, 50], [w - 20, 60], [65, 30]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#fff" stroke="#333" stroke-width="1.2"/>`).join("")}
      <text x="8" y="${h - 9}" class="map-text">ZONING · LAND USE</text>
      <path d="M${w - 14} ${h - 20} l5 12 l-5 -3 l-5 3 Z" fill="#333"/>
    </g>`;
    s += obj("map", inner, P(0, (y1 + y2) / 2, z2 + 0.4));
  }

  // ── Transit shelf on the left wall (slot: transit) ────────
  {
    const col = colorOf("transit", "#e05d5d");
    let inner = box(0, 6.4, 3.7, 0.75, 2.9, 0.12, "#a77650");
    inner += box(0.1, 6.65, 3.82, 0.5, 1.9, 0.48, col);
    inner += `<g transform="${onFaceX(0.61, 8.55, 4.24)}">` +
      Array.from({ length: 5 }, (_, i) => `<rect x="${4 + i * 12.5}" y="2" width="9" height="7" rx="1" fill="#dff3ff"/>`).join("") +
      `<rect x="0" y="12" width="${1.9 * S}" height="2" fill="${light(col, 0.5)}"/></g>`;
    inner += box(0.15, 6.55, 3.82, 0.4, 2.1, 0.03, "#5c5f6e"); // rail
    // hard hat
    const [hx, hy] = P(0.38, 8.95, 3.82);
    inner += `<ellipse cx="${hx}" cy="${hy}" rx="15" ry="6" fill="#f5c518"/><path d="M${hx - 11} ${hy - 1} a11 11 0 0 1 22 0 Z" fill="#ffd84a"/>`;
    s += obj("transit", inner, P(0.35, 7.6, 5.0));
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

  // GIS monitor (slot: gis): animated map with layers + heatmap
  {
    const x = 2.3, y = 0.4, w = 2.8, d = 0.45, z = TOP + 0.5, h = 1.9;
    const col = colorOf("gis", "#50c878");
    let inner = box(3.45, 0.5, TOP, 0.5, 0.3, 0.5, "#2f313d") + box(3.1, 0.35, TOP, 1.2, 0.7, 0.06, "#2f313d");
    inner += box(x, y, z, w, d, h, "#2b2d38");
    const sw = (w - 0.24) * S, sh = (h - 0.24) * S;
    inner += `<g transform="${onFaceY(x + 0.12, y + d + 0.01, z + h - 0.12)}">
      <rect width="${sw}" height="${sh}" rx="2" fill="#1d2a33"/>
      <rect x="0" y="0" width="22" height="${sh}" fill="#26343f"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="4" y="${6 + i * 9}" width="5" height="5" fill="${["#f6d77b", "#f2a3a3", col, "#6fb3e8"][i]}"/><rect x="11" y="${7 + i * 9}" width="8" height="2" fill="#7d8a96"/>`).join("")}
      ${Array.from({ length: 5 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${26 + c * 10.5}" y="${4 + r * 10.5}" width="8.5" height="8.5" fill="${(r * 7 + c * 3) % 5 === 0 ? col : (r + c) % 3 ? "#3b4b57" : "#4a5d6b"}"/>`).join("")).join("")}
      <circle class="heat" cx="${26 + 35}" cy="${4 + 26}" r="22" fill="url(#heat)"/>
      <path class="route" d="M28 50 L50 50 L50 18 L86 18" stroke="${col}" stroke-width="2.4" fill="none"/>
    </g>`;
    s += obj("gis", inner, P(x + w / 2, y + d / 2, z + h + 0.7));
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

  // ── City model table (slot: model) ────────────────────────
  {
    const tx = 4.2, ty = 4.2, tw = 4.6, td = 3.6, tz = 1.6;
    const col = colorOf("model", "#ff7d41");
    let inner = box(tx + 0.1, ty + 0.1, 0, 0.2, 0.2, tz, "#5a4030") + box(tx + tw - 0.3, ty + 0.1, 0, 0.2, 0.2, tz, "#5a4030");
    inner += box(tx + 0.1, ty + td - 0.3, 0, 0.2, 0.2, tz, "#6b4b37") + box(tx + tw - 0.3, ty + td - 0.3, 0, 0.2, 0.2, tz, "#6b4b37");
    inner += box(tx, ty, tz, tw, td, 0.18, "#4a4d5c");
    const Z0 = tz + 0.18;
    inner += flat(tx + 0.15, ty + 0.15, Z0 + 0.01, tw - 0.3, td - 0.3, "#d9dccf");
    // roads + river + park
    inner += flat(tx + 0.15, ty + 1.55, Z0 + 0.02, tw - 0.3, 0.35, "#6b6f7d");
    inner += flat(tx + 2.25, ty + 0.15, Z0 + 0.02, 0.35, td - 0.3, "#6b6f7d");
    inner += `<g transform="${onTop(tx + 0.15, ty + 1.715, Z0 + 0.025)}"><path d="M0 0 H${(tw - 0.3) * S}" stroke="#f5e9a8" stroke-width="1" stroke-dasharray="4 4"/></g>`;
    inner += flat(tx + 0.25, ty + 2.05, Z0 + 0.02, 1.9, 1.3, "#8fcf86");
    inner += flat(tx + 3.45, ty + 2.05, Z0 + 0.02, 0.95, 1.35, "#7cbfe8");
    // buildings, sorted back-to-front
    const B = [
      [tx + 0.3, ty + 0.3, 0.8, 0.55, 0.8, "#ece6da"], [tx + 1.2, ty + 0.3, 0.85, 0.55, 1.5, "#d7cdbd"],
      [tx + 0.3, ty + 0.95, 0.8, 0.45, 0.5, "#f2c48d"], [tx + 1.2, ty + 0.95, 0.85, 0.45, 0.7, "#ece6da"],
      [tx + 2.75, ty + 0.3, 0.6, 0.6, 2.3, col], [tx + 3.5, ty + 0.3, 0.9, 0.55, 0.9, "#c7b8e8"],
      [tx + 2.75, ty + 1.0, 1.65, 0.4, 0.45, "#ece6da"],
      [tx + 2.75, ty + 2.05, 0.6, 0.6, 0.65, "#9cc0e6"], [tx + 2.75, ty + 2.75, 0.6, 0.6, 1.0, "#f2c48d"],
    ].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    B.forEach(([bx, by, bw, bd, bh, bc]) => (inner += box(bx, by, Z0 + 0.02, bw, bd, bh, bc)));
    // park trees + tram on the road
    [[0.55, 2.4], [1.1, 2.3], [1.7, 2.5], [0.7, 3.0], [1.4, 3.05], [1.95, 2.95]].forEach(([dx, dy]) => (inner += tree(tx + dx, ty + dy, Z0 + 0.02, 7, "#4f9d55")));
    inner += `<g class="tram">${box(tx + 0.4, ty + 1.62, Z0 + 0.03, 0.9, 0.22, 0.2, "#e05d5d")}</g>`;
    s += obj("model", inner, P(tx + 3.05, ty + 0.6, Z0 + 3.0));
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
    s += box(8.9, 8.7, 0, 0.7, 0.7, 0.06, "#ff7d41");
    const [cx, cy] = P(9.25, 9.05, 0.06);
    s += `<path d="M${cx - 10} ${cy} L${cx - 2} ${cy - 38} L${cx + 2} ${cy - 38} L${cx + 10} ${cy} Z" fill="#ff7d41"/>
      <path d="M${cx - 6.5} ${cy - 14} L${cx + 6.5} ${cy - 14} L${cx + 5} ${cy - 22} L${cx - 5} ${cy - 22} Z" fill="#fff"/>`;
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
