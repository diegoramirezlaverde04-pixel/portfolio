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
  $("[data-role]").textContent = D.role;
  $("#about-text").textContent = D.about;
  $("#year").textContent = new Date().getFullYear();
  $("#skills").innerHTML = D.skills.map((s) => `<li>${esc(s)}</li>`).join("");
  $("#contact-links").innerHTML = linkList()
    .map(([, url, label], i) => `<a class="btn magnetic ${i === 0 ? "primary" : ""}" href="${esc(url)}" ${url.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'}>${label}</a>`)
    .join("");

  // Split hero name into letters that react to the cursor.
  const heroName = $(".hero-name");
  heroName.innerHTML = D.name
    .split(" ")
    .map((w) => `<span class="word">${[...w].map((c) => `<span class="ch">${esc(c)}</span>`).join("")}</span>`)
    .join(" ");
  if (!reduceMotion) {
    heroName.addEventListener("mousemove", (e) => {
      $$(".ch", heroName).forEach((ch) => {
        const r = ch.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dist = Math.abs(dx);
        const lift = Math.max(0, 1 - dist / 120);
        ch.style.transform = `translateY(${-lift * 14}px) rotate(${lift * Math.sign(dx) * -6}deg)`;
        ch.style.color = lift > 0.35 ? "var(--accent)" : "";
      });
    });
    heroName.addEventListener("mouseleave", () => $$(".ch", heroName).forEach((ch) => (ch.style.transform = ch.style.color = "")));
  }

  // ── Typewriter ────────────────────────────────────────────
  const tw = $("#typewriter");
  if (reduceMotion) tw.textContent = D.taglines[0];
  else {
    let i = 0, j = 0, deleting = false;
    const tick = () => {
      const word = D.taglines[i];
      tw.textContent = word.slice(0, j);
      if (!deleting && j === word.length) { deleting = true; return setTimeout(tick, 1800); }
      if (deleting && j === 0) { deleting = false; i = (i + 1) % D.taglines.length; }
      j += deleting ? -1 : 1;
      setTimeout(tick, deleting ? 30 : 60);
    };
    tick();
  }

  // ── Projects: filters, cards, tilt, modal ─────────────────
  const grid = $("#project-grid");
  const tags = ["all", ...new Set(D.projects.flatMap((p) => p.tags))];
  $("#filters").innerHTML = tags
    .map((t) => `<button class="chip" role="tab" data-tag="${esc(t)}" aria-selected="${t === "all"}">${esc(t)}</button>`)
    .join("");

  grid.innerHTML = D.projects
    .map(
      (p) => `
    <button class="card reveal" data-id="${esc(p.id)}" data-tags="${esc(p.tags.join(" "))}" style="--c:${esc(p.color || "var(--accent)")}">
      <div class="card-top">
        <span class="card-icon">${esc(p.title[0])}</span>
        <span class="status ${esc(p.status)}">${esc(p.status)} · ${esc(p.year)}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      <ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <span class="arrow" aria-hidden="true">↗</span>
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
      if (!reduceMotion) card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
    card.addEventListener("click", () => openProject(card.dataset.id));
  });

  const modal = $("#modal");
  function openProject(id) {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return false;
    const links = [
      p.links?.live && `<a class="btn primary" href="${esc(p.links.live)}" target="_blank" rel="noopener">Live demo ↗</a>`,
      p.links?.code && `<a class="btn" href="${esc(p.links.code)}" target="_blank" rel="noopener">Source code ↗</a>`,
    ].filter(Boolean).join("");
    $("#modal-content").innerHTML = `
      <div class="modal-hero" style="--c:${esc(p.color || "var(--accent)")}"></div>
      <div class="modal-body">
        <h3>${esc(p.title)}</h3>
        <div class="meta">${esc(p.year)} · ${esc(p.status)} · ${p.tags.map(esc).join(", ")}</div>
        <p>${esc(p.description)}</p>
        <ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        ${links ? `<div class="modal-links">${links}</div>` : ""}
      </div>`;
    modal.showModal();
    return true;
  }
  $("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  // ── Scroll reveal ─────────────────────────────────────────
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

  // ── Theme ─────────────────────────────────────────────────
  const root = document.documentElement;
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : !matchMedia("(prefers-color-scheme: light)").matches);
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
      cursor.classList.toggle("hover", !!e.target.closest("a, button, .card, input"));
    }
  });
  document.addEventListener("pointerleave", () => { cursor.classList.remove("on"); mouse.active = false; });

  if (!reduceMotion) {
    document.addEventListener("pointermove", (e) => {
      $$(".magnetic").forEach((b) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.hypot(dx, dy) < 90;
        b.style.transform = near ? `translate(${dx * 0.25}px, ${dy * 0.35}px)` : "";
      });
    });
  }

  // ── Background: interactive particle constellation ───────
  const canvas = $("#bg"), ctx = canvas.getContext("2d");
  let pts = [], W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr;
    const n = Math.min(110, Math.floor((innerWidth * innerHeight) / 14000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3 * dpr, vy: (Math.random() - 0.5) * 0.3 * dpr }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dark = isDark();
    const dotColor = dark ? "rgba(255,255,255,0.5)" : "rgba(20,20,40,0.35)";
    const link = 130 * dpr, mx = mouse.x * dpr, my = mouse.y * dpr;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      if (mouse.active) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 120 * dpr && d > 0) { p.x += (dx / d) * 1.2 * dpr; p.y += (dy / d) * 1.2 * dpr; }
      }
      ctx.fillStyle = dotColor;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.4 * dpr, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(124,92,255,${(1 - d / link) * (dark ? 0.35 : 0.25)})`;
          ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.active) {
        const a = pts[i], d = Math.hypot(a.x - mx, a.y - my);
        if (d < link * 1.4) {
          ctx.strokeStyle = `rgba(0,209,178,${(1 - d / (link * 1.4)) * 0.5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
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
    filter: (tag) => {
      if (!tags.includes(tag)) return print(`filter: unknown tag. Try: ${tags.join(", ")}`, "err");
      filterBy(tag); $("#projects").scrollIntoView({ behavior: "smooth" });
      print(`Filtered projects by <span class="acc">${esc(tag)}</span>`);
    },
    goto: (sec) => {
      const el = sec && document.getElementById(sec);
      if (!el) return print("goto: try projects, about, terminal or contact", "err");
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
    "goto <section>": "scroll to a section", contact: "how to reach me", theme: "toggle light/dark", history: "command history", clear: "clear the screen",
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
    { label: "Go to Projects", hint: "section", run: go("projects") },
    { label: "Go to About", hint: "section", run: go("about") },
    { label: "Open Terminal", hint: "section", run: () => { go("terminal")(); setTimeout(() => input.focus({ preventScroll: true }), 400); } },
    { label: "Contact me", hint: "section", run: go("contact") },
    { label: "Toggle theme", hint: "action", run: toggleTheme },
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
})();
