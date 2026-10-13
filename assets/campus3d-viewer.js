// Interactive 3D figure-ground model of the UC campus.
// Building footprints come from the AutoCAD black-on-white map (assets/campus3d.js);
// heights are illustrative (scaled by footprint), not surveyed.
// three.js is loaded on demand the first time a viewer is mounted.
(() => {
  "use strict";

  // Bundled copy first (assets/vendor, three r160, MIT); the CDN is a fallback,
  // e.g. when the page is opened straight from disk where local modules are blocked.
  const SOURCES = [
    [new URL("vendor/three.module.min.js", document.currentScript.src).href, new URL("vendor/OrbitControls.js", document.currentScript.src).href],
    ["https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js", "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js"],
  ];
  let libs;
  const load = () =>
    (libs ||= SOURCES.reduce(
      (p, [three, controls]) => p.catch(() => Promise.all([import(three), import(controls)])),
      Promise.reject()
    ));

  const decode = (b64, Type) => {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Type(u8.buffer);
  };

  // Mounts a viewer into `host`; returns a cleanup function.
  window.mountCampus3D = function mountCampus3D(host) {
    const data = window.CAMPUS3D;
    if (!data) return () => {};
    host.innerHTML = `
      <div class="v3d-stage"><div class="v3d-loading mono">loading 3D model…</div></div>
      <div class="v3d-ui">
        <div class="v3d-seg" role="group" aria-label="View mode">
          <button class="v3d-btn" data-mode="flat">Figure-ground</button>
          <button class="v3d-btn on" data-mode="3d">3D massing</button>
        </div>
        <button class="v3d-btn" data-act="spin" aria-pressed="true">Auto-rotate</button>
        <button class="v3d-btn" data-act="reset">Reset view</button>
      </div>
      <div class="v3d-tip mono" aria-live="polite"></div>
      <p class="v3d-note mono">drag to orbit · scroll or pinch to zoom · hover a building · heights are illustrative</p>`;
    const stage = host.querySelector(".v3d-stage");
    const tip = host.querySelector(".v3d-tip");
    let disposed = false, cleanup = () => {};

    load().then(([THREE, { OrbitControls }]) => {
      if (disposed) return;
      stage.querySelector(".v3d-loading").remove();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dark = document.documentElement.dataset.theme !== "light";
      const W = data.w, H = data.h;
      const heights = decode(data.heights, Uint8Array);
      const ids = decode(data.ids, Uint16Array);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      stage.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.maxPolarAngle = Math.PI * 0.47;
      controls.minDistance = 60; controls.maxDistance = 520;
      controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.6;
      const HOME = new THREE.Vector3(150, 170, 210);
      camera.position.set(0, 330, 1); // start top-down: reads as the flat map
      controls.update();

      scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x3a3f4a : 0xd9d4c8, dark ? 0.9 : 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-120, 220, 90);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 10, far: 600 });
      scene.add(sun);

      // Ground: the original map as a texture (pathways + footprints).
      const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
      new THREE.TextureLoader().load("assets/img/campus-figure-ground.jpg", (t) => {
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        groundMat.map = t; groundMat.needsUpdate = true;
      });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, H), groundMat);
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
      scene.add(ground);
      const base = new THREE.Mesh(new THREE.BoxGeometry(W + 6, 4, H + 6), new THREE.MeshStandardMaterial({ color: dark ? 0x4a4d5c : 0x3a3536 }));
      base.position.y = -2.05; scene.add(base);

      // Buildings: merge grid cells into rectangles (row runs, then stacked
      // runs with the same span and building) so there are far fewer boxes.
      const rects = [], open = new Map();
      const area = new Map();
      for (let y = 0; y < H; y++) {
        const seen = new Set();
        for (let x = 0; x < W; ) {
          const b = ids[y * W + x];
          if (!b) { x++; continue; }
          let x2 = x; while (x2 + 1 < W && ids[y * W + x2 + 1] === b) x2++;
          const key = `${x},${x2},${b}`, prev = open.get(key);
          if (prev && prev.y + prev.d === y) prev.d++;
          else { const r = { x, y, w: x2 - x + 1, d: 1, b, h: heights[y * W + x] }; rects.push(r); open.set(key, r); }
          seen.add(key);
          area.set(b, (area.get(b) || 0) + (x2 - x + 1));
          x = x2 + 1;
        }
        for (const k of open.keys()) if (!seen.has(k)) open.delete(k);
      }
      const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
      const mesh = new THREE.InstancedMesh(geo, mat, rects.length);
      mesh.castShadow = true; mesh.receiveShadow = true;
      scene.add(mesh);

      const FG = new THREE.Color(0x231f20), MASS = new THREE.Color(dark ? 0xe9e6df : 0xf4f1ea), HI = new THREE.Color(0x2bb673);
      const m4 = new THREE.Matrix4(), col = new THREE.Color();
      let t = 0, target = 1, hovered = 0;
      function layout() {
        rects.forEach((r, k) => {
          const h = Math.max(0.25, t * (r.h / 255) * 34);
          m4.makeScale(r.w, h, r.d).setPosition(r.x + r.w / 2 - W / 2, 0.01, r.y + r.d / 2 - H / 2);
          mesh.setMatrixAt(k, m4);
          col.copy(FG).lerp(MASS, t);
          if (r.b === hovered) col.lerp(HI, 0.85);
          mesh.setColorAt(k, col);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true;
      }
      layout();

      // Fly from top-down map to the 3D view
      let fly = reduce ? 1 : 0;
      if (reduce) { t = 1; camera.position.copy(HOME); layout(); }

      // Hover: highlight a whole building
      const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
      let ptrIn = false;
      renderer.domElement.addEventListener("pointermove", (e) => {
        const r = renderer.domElement.getBoundingClientRect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ptrIn = true;
      });
      renderer.domElement.addEventListener("pointerleave", () => { ptrIn = false; });
      function pick() {
        let b = 0;
        if (ptrIn) {
          ray.setFromCamera(ptr, camera);
          const hit = ray.intersectObject(mesh)[0];
          if (hit) b = rects[hit.instanceId].b;
        }
        if (b !== hovered) {
          hovered = b;
          layout();
          tip.textContent = b ? `building ${b} of ${data.buildings} · footprint ${area.get(b)} cells` : "";
          tip.classList.toggle("on", !!b);
        }
      }

      // UI
      host.querySelectorAll("[data-mode]").forEach((btn) => btn.addEventListener("click", () => {
        target = btn.dataset.mode === "3d" ? 1 : 0;
        host.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b === btn));
        if (reduce) { t = target; layout(); }
      }));
      const spinBtn = host.querySelector('[data-act="spin"]');
      spinBtn.classList.toggle("on", controls.autoRotate);
      spinBtn.addEventListener("click", () => {
        controls.autoRotate = !controls.autoRotate;
        spinBtn.classList.toggle("on", controls.autoRotate);
        spinBtn.setAttribute("aria-pressed", controls.autoRotate);
      });
      host.querySelector('[data-act="reset"]').addEventListener("click", () => { camera.position.copy(HOME); controls.target.set(0, 0, 0); });
      controls.addEventListener("start", () => { fly = 1; });

      const resize = () => {
        const w = stage.clientWidth, h = stage.clientHeight;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(stage); resize();

      let raf = 0, frame = 0;
      const start = new THREE.Vector3().copy(camera.position);
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (fly < 1) {
          fly = Math.min(1, fly + 0.012);
          const e = 1 - Math.pow(1 - fly, 3);
          camera.position.lerpVectors(start, HOME, e);
        }
        if (Math.abs(target - t) > 0.001) {
          t += (target - t) * (reduce ? 1 : 0.08);
          if (Math.abs(target - t) < 0.002) t = target;
          layout();
        }
        if (++frame % 3 === 0) pick();
        controls.update();
        renderer.render(scene, camera);
      };
      // Delay the rise slightly so the flat map registers first
      t = 0; target = 0;
      setTimeout(() => { if (!disposed && host.querySelector('[data-mode="3d"]').classList.contains("on")) target = 1; }, reduce ? 0 : 500);
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
        geo.dispose(); mat.dispose(); groundMat.map?.dispose(); groundMat.dispose(); renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {
      if (disposed) return;
      stage.innerHTML = `<div class="v3d-loading mono">3D view unavailable (needs WebGL and an internet connection)</div>`;
    });

    return () => { disposed = true; cleanup(); };
  };
})();
