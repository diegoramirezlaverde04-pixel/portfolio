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
    <radialGradient id="blinkGlow"><stop offset="0" stop-color="#ffb15c" stop-opacity=".4"/><stop offset="1" stop-color="#ffb15c" stop-opacity="0"/></radialGradient>
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
  // The actual map from the Inclusive vs. Compliant project, with its legend.
  {
    const pad = 6, mapW = 116, mapH = Math.round(mapW * 573 / 560), legH = 20;
    const w = mapW + pad * 2, h = mapH + pad * 2 + legH;
    const y1 = 1.5, y2 = y1 + w / S, z2 = 6.45, z1 = z2 - h / S;
    let inner = poly([P(0.02, y1 - 0.06, z1 - 0.06), P(0.02, y2 + 0.06, z1 - 0.06), P(0.02, y2 + 0.06, z2 + 0.06), P(0.02, y1 - 0.06, z2 + 0.06)], INK);
    inner += poly([P(0.03, y1, z1), P(0.03, y2, z1), P(0.03, y2, z2), P(0.03, y1, z2)], "#ffffff");
    inner += `<g transform="${onFaceX(0.04, y2, z2)}">
      <image href="assets/img/inclusive-map-wall.jpg" x="${pad}" y="${pad}" width="${mapW}" height="${mapH}" preserveAspectRatio="none"/>
      <defs><linearGradient id="integ" x1="0" x2="1"><stop offset="0" stop-color="#2bb673"/><stop offset=".5" stop-color="#f2d231"/><stop offset="1" stop-color="#e5484d"/></linearGradient></defs>
      <text x="${pad}" y="${pad + mapH + 7}" class="map-text">PATHWAY INTEGRATION</text>
      <rect x="${pad}" y="${pad + mapH + 10}" width="34" height="3" fill="url(#integ)"/>
      <text x="${pad}" y="${pad + mapH + 18}" class="map-legend">strong</text><text x="${pad + 34}" y="${pad + mapH + 18}" class="map-legend" text-anchor="end">poor</text>
      <rect x="${pad + 44}" y="${pad + mapH + 10}" width="10" height="3" fill="#2f5bd3"/><text x="${pad + 44}" y="${pad + mapH + 18}" class="map-legend">detour</text>
      <path d="M${pad + 72} ${pad + mapH + 14} l3 -5 M${pad + 75} ${pad + mapH + 14} l3 -5" stroke="#222" stroke-width="1"/><text x="${pad + 70}" y="${pad + mapH + 18}" class="map-legend">stairs</text>
    </g>`;
    s += obj("map", inner, P(0, (y1 + y2) / 2, z2 + 0.4));
  }

  // ── UC wall decor on the left wall: red felt pennant + bridge print ──
  {
    const UC_RED = "#e00122";
    // pennant: base on the left, point to the right
    const pw = 80, ph = 40, py2 = 9.0, pz2 = 6.4;
    s += `<g transform="${onFaceX(0.04, py2, pz2)}">
      <path d="M0 2 L${pw} ${ph / 2 + 1} L0 ${ph + 2} Z" fill="#000" opacity=".12"/>
      <path d="M0 0 L${pw} ${ph / 2} L0 ${ph} Z" fill="${UC_RED}"/>
      <rect x="0" y="0" width="7" height="${ph}" fill="#111"/>
      <circle cx="3.5" cy="5" r="1.2" fill="#d9d6cf"/><circle cx="3.5" cy="${ph - 5}" r="1.2" fill="#d9d6cf"/>
      <text x="11" y="${ph / 2 + 2.2}" class="pennant-text">CINCINNATI</text>
    </g>`;
    // framed print of the Roebling Suspension Bridge
    const fw = 1.05 * S, fh = 0.62 * S, fy2 = 9.25, fz2 = 5.0;
    s += `<g transform="${onFaceX(0.04, fy2, fz2)}">
      <rect x="-1.2" y="-1.2" width="${fw + 2.4}" height="${fh + 2.4}" fill="#111"/>
      <rect width="${fw}" height="${fh}" fill="#fbfaf7"/>
      <rect x="3" y="3" width="${fw - 6}" height="${fh - 6}" fill="#fff" stroke="#e5e2dc" stroke-width=".4"/>
      <path d="M4 ${fh - 7} H${fw - 4}" stroke="${UC_RED}" stroke-width="1.2"/>
      <path d="M${fw * 0.3} ${fh - 7} V6 M${fw * 0.7} ${fh - 7} V6" stroke="${UC_RED}" stroke-width="1.6"/>
      <path d="M4 ${fh - 9} Q${fw * 0.15} ${fh - 10} ${fw * 0.3} 6.5 Q${fw * 0.5} ${fh - 8} ${fw * 0.7} 6.5 Q${fw * 0.85} ${fh - 10} ${fw - 4} ${fh - 9}" stroke="${UC_RED}" stroke-width=".7" fill="none"/>
      <path d="M4 ${fh - 4.5} H${fw - 4}" stroke="#9fb7c9" stroke-width="1"/>
    </g>`;
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

  // ── Pinboard with the Union Park site plan pinned up (slot: board) ──
  {
    const x1 = 0.9, x2 = 4.6, z1 = 4.0, z2 = 6.3, w = (x2 - x1) * S, h = (z2 - z1) * S;
    let inner = box(x1, 0, z1, x2 - x1, 0.06, z2 - z1, INK);
    const pw = 62, ph = Math.round(pw * 804 / 832);
    inner += `<g transform="${onFaceY(x1 + 0.05, 0.065, z2 - 0.05)}">
      <rect width="${w - 3}" height="${h - 3}" fill="#e2e0db"/>
      <g transform="rotate(-2 ${8 + pw / 2} ${6 + ph / 2})">
        <rect x="7" y="6.5" width="${pw + 2}" height="${ph + 2}" fill="#0002"/>
        <rect x="6" y="5.5" width="${pw + 2}" height="${ph + 2}" fill="#fff"/>
        <image href="assets/img/union-park-site-plan.webp" x="7" y="6.5" width="${pw}" height="${ph}" preserveAspectRatio="none"/>
      </g>
      <rect x="${pw + 16}" y="8" width="34" height="13" fill="#3f78b5"/>
      <text x="${pw + 33}" y="16.4" text-anchor="middle" class="board-title">UNION PARK</text>
      ${[[pw + 16, 26, "#fbfaf7"], [pw + 34, 26, "#d6efe3"]].map(([nx, ny, nc]) => `<rect x="${nx}" y="${ny}" width="16" height="15" fill="${nc}"/>
        <rect x="${nx + 3}" y="${ny + 5}" width="10" height="1.4" fill="#0002"/><rect x="${nx + 3}" y="${ny + 8.5}" width="7" height="1.4" fill="#0002"/>`).join("")}
      ${[[8 + pw / 2, 6], [pw + 33, 8], [pw + 24, 26], [pw + 42, 26]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="1.8" fill="#e00122"/>`).join("")}
    </g>`;
    s += obj("board", inner, P((x1 + x2) / 2, 0.1, z2 + 0.4));
  }

  // ── Rug ───────────────────────────────────────────────────
  s += flat(3.0, 4.4, 0.005, 5.6, 4.6, "var(--rug)");

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
    // SketchUp-style window showing the actual Hopkins & Dalton render
    const tb = 5, tool = 4, pal = 6, st = 3.4;               // title bar, toolbar, tool palette, status bar
    const vx = pal + 0.6, vy = tb + tool + 0.6, vw = sw - vx - 0.6, vh = sh - vy - st - 0.6;
    const icons = ["#e5484d", "#f2a33a", "#f2d231", "#2bb673", "#5b8def", "#8a63d2", "#9aa3ad", "#5c6470", "#2bb673", "#e5484d", "#9aa3ad", "#5b8def"];
    inner += `<g transform="${onFaceY(x + 0.05, y + d + 0.005, z + h - 0.05)}">
      <defs><clipPath id="vp"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}"/></clipPath></defs>
      <rect width="${sw}" height="${sh}" fill="#ecebe8"/>
      <rect width="${sw}" height="${tb}" fill="#dcdad6"/>
      <circle cx="3" cy="2.5" r="1.1" fill="#e5484d"/><circle cx="6.2" cy="2.5" r="1.1" fill="#f2c230"/><circle cx="9.4" cy="2.5" r="1.1" fill="#2bb673"/>
      <text x="13" y="3.3" font-size="2.4" font-family="Inter, system-ui, sans-serif" fill="#4a4744">Hopkins_Dalton_Redevelopment.skp</text>
      ${icons.map((c, i) => `<rect x="${1.2 + i * 4.2}" y="${tb + 0.8}" width="3" height="2.4" rx=".5" fill="${c}" opacity=".85"/>`).join("")}
      <rect x="0" y="${tb + tool}" width="${pal}" height="${sh - tb - tool - st}" fill="#e2e0dc"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="1" y="${tb + tool + 1.2 + i * 4.3}" width="4" height="3.2" rx=".6" fill="${i === 2 ? "#5b8def" : "#b9b6b0"}"/>`).join("")}
      <image href="assets/img/hopkins-after-aerial.jpg" x="${vx}" y="${vy - vh * 0.09}" width="${vw}" height="${vh * 1.09}" preserveAspectRatio="xMidYMax slice" clip-path="url(#vp)"/>
      <path d="M${vx + vw * 0.62} ${vy + vh * 0.42} l0 5.5 l1.4 -1.3 l1.1 2.3 l.9 -.4 l-1.1 -2.3 l1.9 0 Z" fill="#fff" stroke="#222" stroke-width=".35"/>
      <rect x="0" y="${sh - st}" width="${sw}" height="${st}" fill="#dcdad6"/>
      <rect x="1.5" y="${sh - st + 1.2}" width="22" height="1" fill="#9a978f"/>
      <rect x="${sw - 22}" y="${sh - st + 0.6}" width="20" height="2.2" fill="#fbfaf7" stroke="#b9b6b0" stroke-width=".3"/>
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
    [[0.6, 5.55, 1.5], [0.9, 5.45, 1.8], [0.8, 5.85, 1.3], [1.1, 5.75, 1.6]].forEach(([cx, cy, hh]) => (inner += cyl(cx, cy, 0.4, 0.12, hh, col)));
    inner += cyl(0.85, 5.65, 0, 0.5, 1.15, INK);
    s += obj("blueprints", inner, P(0.85, 5.65, 2.75));
  }

  // ── Shell chair (decor) ───────────────────────────────────
  s += box(3.12, 3.82, 0, 0.06, 0.06, 1.4, INK) + box(2.7, 3.4, 0, 0.05, 0.05, 1.4, INK) + box(3.6, 3.4, 0, 0.05, 0.05, 1.4, INK);
  s += box(2.6, 3.3, 1.4, 1.15, 1.05, 0.12, WHITE);
  s += box(2.6, 4.25, 1.52, 1.15, 0.1, 1.25, WHITE);

  // ── UC campus model table (slot: model) ───────────────────
  // Footprints + streets from the AutoCAD figure-ground map (assets/campus3d.js
  // and the same map printed on the base), the same data as the 3D viewer.
  {
    const tx = 5.75, ty = 0.2, tw = 3.6, td = 2.7, tz = DZ; // beside the desk: same height, depth and front edge
    let inner = box(tx + 0.15, ty + 0.15, 0, 0.07, 0.07, tz, INK) + box(tx + tw - 0.22, ty + 0.15, 0, 0.07, 0.07, tz, INK);
    inner += box(tx + 0.15, ty + td - 0.22, 0, 0.07, 0.07, tz, INK) + box(tx + tw - 0.22, ty + td - 0.22, 0, 0.07, 0.07, tz, INK);
    inner += box(tx, ty, tz, tw, td, DT, WHITE);
    const Z0 = tz + DT;
    const C3 = window.CAMPUS3D;
    if (C3) {
      const hts = Uint8Array.from(atob(C3.heights), (c) => c.charCodeAt(0));
      const F = 4, gw = Math.floor(C3.w / F), gh = Math.floor(C3.h / F);
      const cw = Math.min((tw - 0.3) / gw, (td - 0.3) / gh);
      const mw = gw * cw, md = gh * cw;
      const ox = tx + (tw - mw) / 2, oy = ty + (td - md) / 2;
      // base plate with the printed map (streets and paths)
      inner += box(ox - 0.04, oy - 0.04, Z0, mw + 0.08, md + 0.08, 0.04, "#fbfaf7");
      const Zb = Z0 + 0.041;
      inner += `<g transform="${onTop(ox, oy, Zb)}"><image href="assets/img/campus-figure-ground.jpg" width="${mw * S}" height="${md * S}" preserveAspectRatio="none" opacity=".55"/></g>`;
      const cells = [];
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
        let m = 0, n = 0;
        for (let yy = 0; yy < F; yy++) for (let xx = 0; xx < F; xx++) { const v = hts[(gy * F + yy) * C3.w + gx * F + xx]; if (v) { n++; m = Math.max(m, v); } }
        if (n > F * F * 0.45) cells.push([gx, gy, m]);
      }
      // painter's order: back (small x+y) to front
      cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
      cells.forEach(([gx, gy, m]) => inner += box(ox + gx * cw, oy + gy * cw, Zb, cw, cw, 0.04 + (m / 255) * 0.42, "#d3cec6"));
    }
    // plaque on the table's front edge
    inner += `<g transform="${onFaceY(tx + 0.4, ty + td + 0.002, tz + 0.09)}"><rect width="${3.0 * S}" height="${0.08 * S}" fill="${INK}"/><text x="${1.5 * S}" y="${0.08 * S - 0.6}" text-anchor="middle" class="plaque-text">University of Cincinnati’s Campus – Figure Ground</text></g>`;
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

  // ── BLINK "Future City" leaf sculpture on a stand (slot: blink) ──
  // A mosaic of translucent red/orange/yellow/green panels with string lights,
  // after the real piece.
  {
    const cx = 8.7, cy = 6.7;
    const [fx, fy] = P(cx, cy, 0);
    const sx = fx, sy = fy - 60, L = 122, HW = 40;   // stem point, leaf length, half width
    const half = (v) => HW * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.9); // widest below the middle, pointed tip // width along the leaf
    let inner = cyl(cx, cy, 0, 0.3, 0.04, INK);
    inner += `<path d="M${fx} ${fy - 2} V${sy}" stroke="${INK}" stroke-width="2"/>`;
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const COLS = ["#e5484d", "#f06a2a", "#f5a524", "#f2d231", "#8cc63f", "#d93a3a"];
    let tiles = "", lights = [];
    for (let v = 0.03; v < 0.97; v += 0.06) {
      const w = half(v);
      for (let u = -w + 4; u < w - 3; u += 9) {
        const x = sx + u + (rnd() - 0.5) * 3, y = sy - v * L + (rnd() - 0.5) * 3, z = 8 + rnd() * 3.5;
        tiles += `<rect x="${(x - z / 2).toFixed(1)}" y="${(y - z / 2).toFixed(1)}" width="${z.toFixed(1)}" height="${z.toFixed(1)}" fill="${COLS[(rnd() * COLS.length) | 0]}" opacity=".88" transform="rotate(${((rnd() - 0.5) * 50).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
        if (rnd() < 0.5) lights.push([x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4]);
      }
    }
        inner += `<g transform="rotate(-12 ${sx} ${sy})">
      <path d="M${sx} ${sy + 2} C${sx - 52} ${sy - 30} ${sx - 40} ${sy - 86} ${sx} ${sy - L - 6} C${sx + 40} ${sy - 86} ${sx + 52} ${sy - 30} ${sx} ${sy + 2} Z" fill="#3f7d3a" opacity=".5"/>
      ${tiles}
      ${lights.map(([x, y], i) => `<circle class="fairy" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" style="animation-delay:-${((i * 0.37) % 2.4).toFixed(2)}s"/>`).join("")}
    </g>`;
    inner += `<circle class="blink-glow" cx="${sx}" cy="${sy - 50}" r="64"/>`;
    s += obj("blink", inner, [sx - 14, sy - 140]);
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
    label.innerHTML = `<b><span class="dot"></span>${esc(p.title.toUpperCase())}</b><span class="desc">${esc(p.hover || p.summary)}</span>`;
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
