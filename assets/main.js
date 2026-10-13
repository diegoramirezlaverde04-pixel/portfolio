(() => {
  "use strict";

  const D = window.PORTFOLIO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const linkList = () =>
    [
      ["email", D.links.email, "Email"],
      ["github", D.links.github, "GitHub"],
      ["linkedin", D.links.linkedin, "LinkedIn"],
      ["resume", D.links.resume, "Résumé"],
    ].filter(([, url]) => url);

  // ── Static content ────────────────────────────────────────
  document.title = `${D.name} — Portfolio`;
  $$("[data-name]").forEach((el) => (el.textContent = D.name));
  $$("[data-handle]").forEach((el) => (el.textContent = D.handle));
  $$("[data-role]").forEach((el) => (el.textContent = D.role));
  $("#headline").textContent = D.headline;
  $("#intro").textContent = D.intro;
  $("#about-text").textContent = D.about;
  $("#year").textContent = new Date().getFullYear();
  $("#skills").innerHTML = D.skills.map((s) => `<li>${esc(s)}</li>`).join("");
  $("#stats").innerHTML = D.stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
  ["#nav-cta", "#hero-linkedin"].forEach((sel) => {
    const a = $(sel);
    if (D.links.linkedin) a.href = D.links.linkedin;
    else a.remove();
  });
  const paras = (d) => (Array.isArray(d) ? d : [d]).map((t) => `<p>${esc(t)}</p>`).join("");

  // About: education + experience timeline
  if (D.education) {
    const e = D.education;
    $("#education").innerHTML = `<div class="tl-item"><b>${esc(e.degree)}</b><span>${esc(e.school)}</span><em>${esc(e.date)}</em>
      ${e.honors?.length ? `<ul>${e.honors.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}</div>`;
  }
  $("#experience").innerHTML = (D.experience || [])
    .map((x) => `<div class="tl-item"><b>${esc(x.role)}</b><span>${esc(x.org)} · ${esc(x.place)}</span><em>${esc(x.date)}</em></div>`)
    .join("");
  $("#contact-links").innerHTML = linkList()
    .map(([, url, label], i) => `<a class="btn magnetic ${i === 0 ? "primary" : ""}" href="${esc(url)}" ${url.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'}>${label}</a>`)
    .join("");

  // "build passed" card: one check line per project, revealed one by one.
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const statusText = { live: "complete", wip: "in progress", archived: "archived" };
  $("#check-count").textContent = `${D.projects.length} projects · 0 errors`;
  $("#check-list").innerHTML = D.projects
    .map((p) => `<li><span class="ok">✓</span>${esc(slug(p.title))} <span class="dim">—</span><span class="st ${esc(p.status)}">${esc(statusText[p.status] || p.status)}</span></li>`)
    .join("");

  // ── Rotating word (typewriter) ────────────────────────────
  const rw = $("#rotating-word");
  const words = D.rotatingWords;
  if (reduceMotion) rw.textContent = words[0];
  else {
    let i = 0, j = 0, deleting = false, timer;
    const tick = () => {
      const word = words[i];
      j += deleting ? -1 : 1;
      rw.textContent = word.slice(0, j);
      let delay = deleting ? 60 : 110;
      if (!deleting && j === word.length) { deleting = true; delay = 2200; }
      else if (deleting && j === 0) { deleting = false; i = (i + 1) % words.length; delay = 300; }
      timer = setTimeout(tick, delay);
    };
    tick();
    document.addEventListener("visibilitychange", () => { clearTimeout(timer); if (!document.hidden) timer = setTimeout(tick, 400); });
  }

  // ── Nav: scrolled state, progress bar, mobile menu ────────
  const nav = $("#nav"), progress = $("#scroll-progress");
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", scrollY > 30);
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const burger = $("#hamburger"), navLinks = $("#nav-links");
  const setMenu = (open) => { navLinks.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); };
  burger.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  // ── Projects: filters, cards, tilt, modal ─────────────────
  const grid = $("#project-grid");
  const tags = ["all", ...new Set(D.projects.flatMap((p) => p.tags))];
  $("#filters").innerHTML = tags
    .map((t) => `<button class="chip" role="tab" data-tag="${esc(t)}" aria-selected="${t === "all"}">${esc(t)}</button>`)
    .join("");

  grid.innerHTML = D.projects
    .map(
      (p) => `
    <button class="card reveal ${p.cover ? "has-cover" : ""}" data-id="${esc(p.id)}" data-tags="${esc(p.tags.join(" "))}" style="--c:${esc(p.color || "var(--accent)")}">
      ${p.cover ? `<div class="card-cover"><img src="${esc(p.cover)}" alt="" loading="lazy"/></div>` : `<div class="card-cover blank"><span>${esc(p.num || "")}</span></div>`}
      <div class="card-label"><span class="card-dot"></span>${esc(p.num ? p.num + " · " : "")}${esc(p.tags[0] || "project")}<span class="yr">${esc(p.context || p.year || "")}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      <ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <div class="card-foot"><span>${p.gallery?.length ? `${p.gallery.length} images · ` : ""}view project</span><span class="arrow" aria-hidden="true">↗</span></div>
    </button>`
    )
    .join("");

  const filterBy = (tag) => {
    $$(".chip").forEach((c) => c.setAttribute("aria-selected", c.dataset.tag === tag));
    $$(".card", grid).forEach((card) => card.classList.toggle("hide", tag !== "all" && !card.dataset.tags.split(" ").includes(tag)));
  };
  $("#filters").addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) filterBy(c.dataset.tag); });

  $$(".card", grid).forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      if (!reduceMotion) card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
    card.addEventListener("click", () => openProject(card.dataset.id));
  });

  const modal = $("#modal");
  function openProject(id) {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return false;
    const c = esc(p.color || "var(--accent)");
    const links = [
      p.links?.live && `<a class="btn primary" href="${esc(p.links.live)}" target="_blank" rel="noopener">View live ↗</a>`,
      p.links?.code && `<a class="btn" href="${esc(p.links.code)}" target="_blank" rel="noopener">Files ↗</a>`,
    ].filter(Boolean).join("");
    // Gallery grouped by `group`, in data order
    const groups = [];
    (p.gallery || []).forEach((g, i) => {
      let grp = groups.find((x) => x.name === (g.group || ""));
      if (!grp) groups.push((grp = { name: g.group || "", items: [] }));
      grp.items.push({ ...g, i });
    });
    const gallery = groups.map((g) => `
      ${g.name ? `<h4 class="gal-title mono">${esc(g.name)}</h4>` : ""}
      <div class="gallery">${g.items.map((it) => `
        <figure><button class="gal-img" data-i="${it.i}" aria-label="Enlarge: ${esc(it.caption)}"><img src="${esc(it.src)}" alt="${esc(it.caption)}" loading="lazy"/></button>
        <figcaption>${esc(it.caption)}</figcaption></figure>`).join("")}</div>`).join("");
    $("#modal-content").innerHTML = `
      <div class="modal-hero ${p.cover ? "img" : ""}" style="--c:${c}">${p.cover ? `<img src="${esc(p.cover)}" alt=""/>` : ""}
        <span class="modal-num">${esc(p.num || "")}</span></div>
      <div class="modal-body">
        <h3>${esc(p.title)}</h3>
        <div class="meta">${esc(p.context || p.year || "")} · ${p.tags.map(esc).join(", ")}</div>
        ${p.viewer3d && window.mountCampus3D ? `<div class="viewer3d" id="viewer3d"></div>` : ""}
        <div class="modal-text">${paras(p.description)}</div>
        <ul class="stack" style="--c:${c}">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        ${gallery}
        ${links ? `<div class="modal-links">${links}</div>` : ""}
      </div>`;
    $$(".gal-img", modal).forEach((b) => b.addEventListener("click", () => openLightbox(p, +b.dataset.i)));
    modal.showModal();
    modal.scrollTop = 0;
    const v = $("#viewer3d", modal);
    if (v) unmount3d = window.mountCampus3D(v);
    return true;
  }
  let unmount3d = null;
  modal.addEventListener("close", () => { if (unmount3d) { unmount3d(); unmount3d = null; } });
  $("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  // Lightbox for gallery images (← → to browse, Esc to close)
  const lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap");
  let lbProject = null, lbIndex = 0;
  function showLb() {
    const g = lbProject.gallery[lbIndex];
    lbImg.src = g.src; lbImg.alt = g.caption;
    lbCap.textContent = `${lbIndex + 1} / ${lbProject.gallery.length} · ${g.caption}`;
  }
  function openLightbox(p, i) { lbProject = p; lbIndex = i; showLb(); lb.showModal(); }
  const step = (d) => { lbIndex = (lbIndex + d + lbProject.gallery.length) % lbProject.gallery.length; showLb(); };
  $("#lb-prev").addEventListener("click", () => step(-1));
  $("#lb-next").addEventListener("click", () => step(1));
  $("#lb-close").addEventListener("click", () => lb.close());
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });

  // ── Scroll reveal ─────────────────────────────────────────
  const checkItems = $$("#check-list li");
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.id === "check-card") checkItems.forEach((li, i) => setTimeout(() => li.classList.add("in"), 250 + i * 220));
        io.unobserve(en.target);
      }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

  // ── Theme (light by default, like the print portfolio) ────
  const root = document.documentElement;
  const isDark = () => root.dataset.theme !== "light";
  function toggleTheme() {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    return root.dataset.theme;
  }
  $("#theme-toggle").addEventListener("click", toggleTheme);

  // ── Custom cursor + magnetic buttons ──────────────────────
  const cursor = $(".cursor");
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    if (e.pointerType === "mouse") {
      cursor.classList.add("on");
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      cursor.classList.toggle("hover", !!e.target.closest("a, button, .card, input, .obj.project, .obj.toggle"));
    }
  });
  document.addEventListener("pointerleave", () => { cursor.classList.remove("on"); mouse.active = false; });

  if (!reduceMotion) {
    document.addEventListener("pointermove", (e) => {
      $$(".magnetic").forEach((b) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = Math.hypot(dx, dy) < 90 ? `translate(${dx * 0.22}px, ${dy * 0.3}px)` : "";
      });
    });
  }

  // ── Background: subtle particle constellation ─────────────
  const canvas = $("#bg"), ctx = canvas.getContext("2d");
  let pts = [], W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr;
    const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dark = isDark();
    const link = 120 * dpr, mx = mouse.x * dpr, my = mouse.y * dpr;
    ctx.fillStyle = dark ? "rgba(255,255,255,0.35)" : "rgba(30,30,50,0.25)";
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      if (mouse.active) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 110 * dpr && d > 0) { p.x += (dx / d) * dpr; p.y += (dy / d) * dpr; }
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 * dpr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineWidth = dpr;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(43,182,115,${(1 - d / link) * (dark ? 0.2 : 0.16)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  resize(); addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });
  draw();

  // ── Terminal ──────────────────────────────────────────────
  const out = $("#term-out"), input = $("#term-in");
  const host = "portfolio";
  const promptText = `${D.handle}@${host}:~$`;
  $("#term-prompt").textContent = promptText;
  $("#term-title").textContent = `${D.handle}@${host} — zsh`;
  const history = []; let hIdx = 0;

  const print = (html, cls = "") => {
    const div = document.createElement("div");
    div.className = `line ${cls}`;
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  };

  const commands = {
    help: () => print(
      Object.entries(cmdHelp).map(([c, d]) => `  <span class="acc">${c.padEnd(16)}</span><span class="dim">${d}</span>`).join("\n")
    ),
    whoami: () => print(`${esc(D.name)} — ${esc(D.role)}\n<span class="dim">${esc(D.location)}</span>`),
    about: () => print(esc(D.about)),
    skills: () => print(D.skills.map((s) => `<span class="acc">▸</span> ${esc(s)}`).join("\n")),
    projects: () => print(
      D.projects.map((p, i) => `  <span class="acc">[${i + 1}]</span> ${esc(p.title.padEnd(18))} <span class="dim">${esc(p.summary)}</span>`).join("\n") +
      `\n\n<span class="dim">Type</span> open &lt;number&gt; <span class="dim">to see details.</span>`
    ),
    ls: () => commands.projects(),
    open: (arg) => {
      const n = parseInt(arg, 10);
      const p = D.projects[n - 1] || D.projects.find((x) => x.id === arg || x.title.toLowerCase() === String(arg).toLowerCase());
      if (!p) return print(`open: no such project: ${esc(arg || "")}`, "err");
      print(`Opening <span class="acc">${esc(p.title)}</span>…`);
      openProject(p.id);
    },
    contact: () => print(linkList().map(([k, url]) => `  ${k.padEnd(10)} <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url.replace("mailto:", ""))}</a>`).join("\n")),
    theme: () => print(`theme → ${toggleTheme()}`),
    lamp: () => print(`lamp → ${window.PortfolioRoom ? window.PortfolioRoom.toggleLamp() : "n/a"}`),
    filter: (tag) => {
      if (!tags.includes(tag)) return print(`filter: unknown tag. Try: ${tags.join(", ")}`, "err");
      filterBy(tag); $("#projects").scrollIntoView({ behavior: "smooth" });
      print(`Filtered projects by <span class="acc">${esc(tag)}</span>`);
    },
    goto: (sec) => {
      const el = sec && document.getElementById(sec);
      if (!el) return print("goto: try studio, projects, about, terminal or contact", "err");
      el.scrollIntoView({ behavior: "smooth" });
    },
    date: () => print(new Date().toString()),
    echo: (...a) => print(esc(a.join(" "))),
    history: () => print(history.map((h, i) => `  ${i + 1}  ${esc(h)}`).join("\n")),
    clear: () => (out.innerHTML = ""),
    sudo: () => print("Nice try. 😄 Permission denied.", "err"),
  };
  const cmdHelp = {
    help: "list commands", whoami: "who am I?", about: "a little about me", skills: "what I work with",
    projects: "list projects (alias: ls)", "open <n>": "open project details", "filter <tag>": "filter the project grid",
    "goto <section>": "scroll to a section", contact: "how to reach me", theme: "toggle light/dark", lamp: "flip the desk lamp in the room",
    history: "command history", clear: "clear the screen",
  };

  function run(raw) {
    const line = raw.trim();
    print(`<span class="p">${esc(promptText)}</span> ${esc(line)}`);
    if (!line) return;
    history.push(line); hIdx = history.length;
    const [cmd, ...args] = line.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];
    fn ? fn(...args) : print(`command not found: ${esc(cmd)}. Type <span class="acc">help</span>.`, "err");
  }

  $("#term-form").addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && hIdx > 0) { input.value = history[--hIdx]; e.preventDefault(); }
    else if (e.key === "ArrowDown") { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ""; e.preventDefault(); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const match = Object.keys(commands).filter((c) => c.startsWith(input.value));
      if (match.length === 1) input.value = match[0] + " ";
      else if (match.length > 1) print(match.join("  "), "dim");
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); commands.clear(); }
  });
  $("#term").addEventListener("click", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

  print(`Welcome! I'm <span class="acc">${esc(D.name)}</span>.`);
  print(`Type <span class="acc">help</span> to see what you can do. Try <span class="acc">projects</span> or <span class="acc">open 1</span>.\n`, "dim");

  // ── Command palette (Ctrl/⌘ + K) ──────────────────────────
  const palette = $("#palette"), pIn = $("#palette-in"), pList = $("#palette-list");
  const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: "smooth" });
  const actions = [
    ...D.projects.map((p) => ({ label: p.title, hint: "project", run: () => openProject(p.id) })),
    { label: "Go to the Room", hint: "section", run: go("studio") },
    { label: "Go to Projects", hint: "section", run: go("projects") },
    { label: "Go to About", hint: "section", run: go("about") },
    { label: "Open Terminal", hint: "section", run: () => { go("terminal")(); setTimeout(() => input.focus({ preventScroll: true }), 400); } },
    { label: "Contact me", hint: "section", run: go("contact") },
    { label: "Toggle theme", hint: "action", run: toggleTheme },
    { label: "Toggle desk lamp", hint: "action", run: () => window.PortfolioRoom && window.PortfolioRoom.toggleLamp() },
    ...linkList().map(([, url, label]) => ({ label: `Open ${label}`, hint: "link", run: () => window.open(url, "_blank", "noopener") })),
  ];
  let filtered = actions, sel = 0;
  function renderPalette() {
    const q = pIn.value.toLowerCase();
    filtered = actions.filter((a) => a.label.toLowerCase().includes(q) || a.hint.includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    pList.innerHTML = filtered.map((a, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}">${esc(a.label)} <small>${a.hint}</small></li>`).join("") ||
      `<li aria-disabled="true"><span class="dim">No results</span></li>`;
  }
  function openPalette() { pIn.value = ""; sel = 0; renderPalette(); palette.showModal(); pIn.focus(); }
  function choose(i) { const a = filtered[i]; if (!a) return; palette.close(); a.run(); }
  pIn.addEventListener("input", () => { sel = 0; renderPalette(); });
  pIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = (sel + 1) % Math.max(1, filtered.length); renderPalette(); e.preventDefault(); }
    if (e.key === "ArrowUp") { sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); renderPalette(); e.preventDefault(); }
    if (e.key === "Enter") { e.preventDefault(); choose(sel); }
  });
  pList.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) choose(+li.dataset.i); });
  palette.addEventListener("click", (e) => { if (e.target === palette) palette.close(); });
  $("#open-palette").addEventListener("click", openPalette);
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.open ? palette.close() : openPalette(); }
  });

  // Shared with room.js
  window.PortfolioUI = { openProject, isDark, esc, statusText };
})();
