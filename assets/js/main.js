// Portfolio d'Erdem Kurac : thème, copie de l'adresse et démos des projets.
// Tout fonctionne aussi en ouvrant index.html directement depuis le disque.

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad2 = (n) => String(n).padStart(2, "0");
  const nowHM = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const fmtInt = (n) => n.toLocaleString("fr-FR");
  const DATA = window.PORTFOLIO_DATA || {};

  // Adresse lue dans la page (elle n'est écrite qu'une fois, dans le HTML)
  const EMAIL = $("[data-copy]").dataset.copy;

  /* ---------- Message temporaire ---------- */

  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 3500);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast(`Adresse copiée : ${EMAIL}`);
    } catch (e) {
      toast(`Copie impossible ici. Mon adresse : ${EMAIL}`);
    }
  }
  $$("[data-copy]").forEach((b) => b.addEventListener("click", copyEmail));

  /* ---------- Thème clair / sombre ---------- */

  const themeBtn = $("[data-theme-toggle]");
  let onTheme = () => {};
  function syncThemeLabel() {
    themeBtn.setAttribute("aria-label", root.dataset.theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre");
  }
  function setTheme(theme, remember) {
    root.dataset.theme = theme;
    if (remember) {
      delete root.dataset.themeAuto;
      try { localStorage.setItem("theme", theme); } catch (e) { /* stockage indisponible */ }
    }
    syncThemeLabel();
    onTheme();
  }
  themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (root.dataset.themeAuto) setTheme(e.matches ? "light" : "dark", false);
  });
  syncThemeLabel();

  /* ---------- Fond animé : le jeu de la vie (thème sombre), un plan de métro (thème clair) ---------- */

  const canvas = $("[data-matrix]");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const live = !reduceMotion;
    let w = 0, h = 0, mx = -9999, my = -9999, raf = 0, dark = true;
    let ink = [0, 0, 0], hot = [0, 0, 0];
    const t0 = performance.now();
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function readColors() {
      const cs = getComputedStyle(root);
      const v = (name) => cs.getPropertyValue(name).trim().split(",").map(Number);
      ink = v("--dot"); hot = v("--dot-hi");
      dark = root.dataset.theme !== "light";
    }
    function size() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Jeu de la vie de Conway : chaque cellule vit ou meurt selon ses huit voisines.
    // La souris sème des cellules, un clic en lâche une poignée.
    const CELL = 14;
    let cols = 0, rows = 0, cells = null, next = null, ghost = null, lastStep = 0, lifeDirty = true;
    function lifeInit() {
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      cells = new Uint8Array(cols * rows); next = new Uint8Array(cols * rows); ghost = new Float32Array(cols * rows);
      for (let i = 0; i < cells.length; i++) cells[i] = Math.random() < 0.16 ? 1 : 0;
    }
    function seed(x, y, radius) {
      if (!cells) return;
      const c0 = Math.floor(x / CELL), r0 = Math.floor(y / CELL);
      for (let r = r0 - radius; r <= r0 + radius; r++) {
        for (let c = c0 - radius; c <= c0 + radius; c++) {
          if (c >= 0 && r >= 0 && c < cols && r < rows && Math.random() < 0.55) cells[r * cols + c] = 1;
        }
      }
      lifeDirty = true;
    }
    function lifeStep() {
      let population = 0;
      for (let r = 0; r < rows; r++) {
        const up = ((r - 1 + rows) % rows) * cols, mid = r * cols, down = ((r + 1) % rows) * cols;
        for (let c = 0; c < cols; c++) {
          const l = (c - 1 + cols) % cols, rr = (c + 1) % cols;
          const n = cells[up + l] + cells[up + c] + cells[up + rr] + cells[mid + l] + cells[mid + rr] + cells[down + l] + cells[down + c] + cells[down + rr];
          const i = mid + c, alive = cells[i] ? n === 2 || n === 3 : n === 3;
          next[i] = alive ? 1 : 0;
          if (cells[i] && !alive) ghost[i] = 1;
          population += next[i];
        }
      }
      [cells, next] = [next, cells];
      // Si la population s'éteint, on ressème quelques foyers
      if (population < cells.length * 0.03) for (let k = 0; k < 6; k++) seed(Math.random() * w, Math.random() * h, 3);
    }
    function drawLife(now) {
      if (!cells || cols !== Math.ceil(w / CELL) || rows !== Math.ceil(h / CELL)) lifeInit();
      if (live && now - lastStep > 110) {
        lastStep = now;
        if (mx > -999) seed(mx, my, 1);
        lifeStep();
        lifeDirty = true;
      }
      if (!lifeDirty) return;
      lifeDirty = false;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = rgba(hot, 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c, x = c * CELL, y = r * CELL;
          if (cells[i]) {
            const d = Math.hypot(x - mx, y - my);
            ctx.globalAlpha = d < 200 ? 0.62 - (d / 200) * 0.38 : 0.24;
            ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
          } else if (ghost[i] > 0.03) {
            ctx.globalAlpha = ghost[i] * 0.12;
            ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
            ghost[i] *= 0.88;
          }
        }
      }
    }

    // Plan de métro : six lignes, des rames qui circulent, des stations au nom des projets
    const LINES = [[227, 0, 27], [0, 85, 164], [0, 166, 81], [255, 190, 0], [155, 89, 182], [255, 120, 0]];
    const STOPS = ["Portail Infra", "Échecs", "CI/CD", "Jurassique", "Prestige Auto", "Pipeline", "Robot", "Orléans", "Gien", "Stage 2027", "BUT Info", "Vue 3", "Flask", "Docker"];
    let lines = null, linesFor = "";
    function buildLines() {
      linesFor = `${w}x${h}`;
      lines = [];
      let s = 11;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      let stop = 0;
      LINES.forEach((color, li) => {
        const across = li % 2 === 0;
        let x = across ? -20 : w * (0.12 + rnd() * 0.76), y = across ? h * (0.12 + rnd() * 0.76) : -20;
        const pts = [[x, y]];
        while (across ? x < w + 20 : y < h + 20) {
          const len = 90 + rnd() * 180;
          if (across) {
            if (rnd() < 0.55) x += len;
            else { const dir = y < h * 0.25 ? 1 : y > h * 0.75 ? -1 : rnd() < 0.5 ? 1 : -1; x += len * 0.7; y += dir * len * 0.7; }
          } else if (rnd() < 0.55) y += len;
          else { const dir = x < w * 0.25 ? 1 : x > w * 0.75 ? -1 : rnd() < 0.5 ? 1 : -1; x += dir * len * 0.7; y += len * 0.7; }
          pts.push([x, y]);
        }
        const dist = [0];
        for (let i = 1; i < pts.length; i++) dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        const stops = pts.slice(1, -1)
          .filter((p, i) => i % 2 === 0 && p[0] > 0 && p[0] < w && p[1] > 0 && p[1] < h)
          .map((p) => ({ x: p[0], y: p[1], name: STOPS[stop++ % STOPS.length] }));
        lines.push({ color, pts, dist, length: dist[dist.length - 1], stops, speed: 60 + rnd() * 50, offset: rnd() * 1000 });
      });
    }
    function pointOn(line, at) {
      let i = 1;
      while (i < line.dist.length - 1 && line.dist[i] < at) i++;
      const a = line.pts[i - 1], b = line.pts[i], k = (at - line.dist[i - 1]) / (line.dist[i] - line.dist[i - 1] || 1);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    function drawMetro(now) {
      if (linesFor !== `${w}x${h}`) buildLines();
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 7; ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (const line of lines) {
        ctx.strokeStyle = rgba(line.color, 1);
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        line.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      if (live) {
        for (const line of lines) {
          const run = (t * line.speed + line.offset) % (line.length * 2);
          const [x, y] = pointOn(line, run > line.length ? 2 * line.length - run : run);
          ctx.fillStyle = rgba(line.color, 1);
          ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.arc(x, y, 12, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 6.2832); ctx.fill();
        }
      }
      ctx.font = '600 12px "Geist", system-ui, sans-serif';
      ctx.lineWidth = 3;
      for (const line of lines) {
        for (const stop of line.stops) {
          const d = Math.hypot(stop.x - mx, stop.y - my), near = d < 150 ? 1 - d / 150 : 0;
          ctx.globalAlpha = 0.5 + near * 0.5;
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = rgba(line.color, 1);
          ctx.beginPath(); ctx.arc(stop.x, stop.y, 6 + near * 4, 0, 6.2832); ctx.fill(); ctx.stroke();
          if (near > 0.15) {
            ctx.fillStyle = rgba(ink, 1);
            ctx.globalAlpha = Math.min(1, near * 1.5);
            ctx.fillText(stop.name, stop.x + 14, stop.y - 10);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = "butt";
    }

    function frame(now) {
      raf = 0;
      if (dark) drawLife(now); else drawMetro(now);
      ctx.globalAlpha = 1;
      if (live && !document.hidden) raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const repaint = () => { lifeDirty = true; wake(); };

    readColors(); size(); wake();
    onTheme = () => { readColors(); repaint(); };
    addEventListener("resize", () => { size(); repaint(); });
    document.addEventListener("visibilitychange", wake);
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; if (!live) repaint(); }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { mx = my = -9999; repaint(); });
    addEventListener("pointerdown", (e) => {
      if (root.classList.contains("has-sheet") || !dark) return;
      seed(e.clientX, e.clientY, 4);
      wake();
    }, { passive: true });
  }

  // Un trait sous la barre du haut dès qu'on a fait défiler la page
  const top = $(".top");
  const stuck = () => top.classList.toggle("is-stuck", scrollY > 8);
  addEventListener("scroll", stuck, { passive: true });
  stuck();

  /* ---------- Cartes : la bordure suit le curseur ---------- */

  const grid = $("[data-grid]");
  grid.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  /* ---------- Fiche d'un projet : panneau qui glisse par-dessus la page ---------- */

  const sheet = $("[data-sheet]");
  const sheetScroll = $("[data-sheet-scroll]");
  const details = $$("[data-detail]");
  const ORDER = ["pipeline", "portail", "echecs", "cicd", "jurassique", "prestige", "bot"];
  const BASE_TITLE = document.title;
  const titleOf = (id) => $(`#${id} h2`).textContent;
  const projectInHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return ORDER.includes(id) ? id : null;
  };
  let lastCard = null;

  function openSheet(id) {
    details.forEach((d) => { d.hidden = d.id !== id; });
    $("[data-count]").textContent = `Projet ${ORDER.indexOf(id) + 1} sur ${ORDER.length}`;
    document.title = `${titleOf(id)}, Erdem Kurac`;
    lastCard = $(`[data-project="${id}"]`);
    sheetScroll.scrollTop = 0;
    if (!sheet.open) {
      root.classList.add("has-sheet");
      sheet.showModal();
    }
    $(`#${id} h2`).focus({ preventScroll: true });
  }

  function hideSheet() {
    if (sheet.open) sheet.close();
    if (!root.classList.contains("has-sheet")) return;
    root.classList.remove("has-sheet");
    document.title = BASE_TITLE;
    if (lastCard) lastCard.focus();
  }

  // Fermer : on revient en arrière si la fiche a été ouverte depuis la page, sinon on retire l'adresse du projet
  function closeSheet() {
    if (history.state && history.state.sheet) { history.back(); return; }
    if (projectInHash()) history.replaceState(null, "", "#projets");
    hideSheet();
  }

  $$("[data-project]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    history.pushState({ sheet: true }, "", `#${a.dataset.project}`);
    openSheet(a.dataset.project);
  }));
  $("[data-close]").addEventListener("click", closeSheet);
  sheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
  sheet.addEventListener("close", () => { if (projectInHash()) closeSheet(); else hideSheet(); });
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  [["[data-prev]", -1], ["[data-next]", 1]].forEach(([sel, step]) => $(sel).addEventListener("click", () => {
    const i = ORDER.indexOf(projectInHash());
    const id = ORDER[(i + step + ORDER.length) % ORDER.length];
    history.replaceState(history.state, "", `#${id}`);
    openSheet(id);
  }));
  addEventListener("popstate", () => {
    const id = projectInHash();
    if (id) openSheet(id); else hideSheet();
  });

  // Filtres des projets
  const filterBtns = $$("[data-filter]");
  const cardItems = $$("[data-cats]");
  const filterStatus = $("[data-filter-status]");
  filterBtns.forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.filter;
    filterBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    let n = 0;
    cardItems.forEach((li) => {
      const show = f === "tout" || li.dataset.cats.split(" ").includes(f);
      li.hidden = !show;
      li.classList.toggle("grid__item--wide", show && f === "tout" && li.dataset.wide === "1");
      if (show) n++;
    });
    filterStatus.textContent = `${n} projet${n > 1 ? "s" : ""} affiché${n > 1 ? "s" : ""}`;
  }));
  $$(".grid__item--wide").forEach((li) => { li.dataset.wide = "1"; });

  // Mini-courbe du robot sur sa carte (données réelles du backtest)
  const spark = $("[data-spark]");
  if (spark && DATA.bot) {
    const pts = DATA.bot.curve;
    const x = (t) => ((t - 2022) / 4.85) * 320;
    const y = (v) => 160 - ((v + 15) / 140) * 140;
    const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    spark.innerHTML = `<line class="spark-zero" x1="0" x2="320" y1="${y(0)}" y2="${y(0)}"/><path class="spark-area" d="${d} L320,${y(0)} L0,${y(0)} Z"/><path class="spark-line" d="${d}"/>`;
  }

  // Lien direct vers un projet (par exemple …/#echecs)
  if (projectInHash()) openSheet(projectInHash());


  /* ---------- Hors du code : le compte-tours ---------- */

  const tacho = $("[data-tacho]");
  if (tacho) {
    const svg = $("[data-tacho-svg]", tacho);
    const rev = $("[data-rev]");
    const NS = "http://www.w3.org/2000/svg";
    const CX = 120, CY = 110, R = 92, A0 = 210, A1 = -30, MAX = 8000, RED = 6500;
    const deg = (v) => A0 - ((A0 - A1) * v) / MAX;
    const pt = (v, r) => { const a = (deg(v) * Math.PI) / 180; return [CX + Math.cos(a) * r, CY - Math.sin(a) * r]; };
    const add = (name, attrs, text) => {
      const n = document.createElementNS(NS, name);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      if (text !== undefined) n.textContent = text;
      svg.appendChild(n);
      return n;
    };
    const arc = (from, to, r) => {
      const [x0, y0] = pt(from, r), [x1, y1] = pt(to, r);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${((to - from) / MAX) * 240 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    add("path", { d: arc(0, MAX, R), class: "tacho__track" });
    add("path", { d: arc(RED, MAX, R), class: "tacho__red" });
    for (let k = 0; k <= 16; k++) {
      const v = k * 500, major = k % 2 === 0;
      const [x0, y0] = pt(v, R - 8), [x1, y1] = pt(v, R - (major ? 20 : 14));
      add("line", { x1: x0, y1: y0, x2: x1, y2: y1, class: major ? "tacho__tick tacho__tick--major" : "tacho__tick" });
      if (major) { const [tx, ty] = pt(v, R - 34); add("text", { x: tx, y: ty + 4, class: "tacho__num" }, v / 1000); }
    }
    const needle = add("line", { x1: CX, y1: CY + 10, x2: CX, y2: CY - (R - 16), class: "tacho__needle" });
    add("circle", { cx: CX, cy: CY, r: 7, class: "tacho__hub" });
    const readout = add("text", { x: CX, y: CY + 56, class: "tacho__rpm" }, "0");
    add("text", { x: CX, y: CY + 72, class: "tacho__unit" }, "tr/min");

    if (matchMedia("(pointer: coarse)").matches) rev.textContent = "Restez appuyé pour accélérer";
    let rpm = 0, holding = false, started = false, raf = 0, last = 0;
    function render() {
      needle.setAttribute("transform", `rotate(${(90 - deg(rpm)).toFixed(2)} ${CX} ${CY})`);
      readout.textContent = (Math.round(rpm / 10) * 10).toLocaleString("fr-FR");
      tacho.classList.toggle("is-red", rpm > RED);
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const idle = started ? 850 : 0;
      if (holding) {
        rpm += (2400 + rpm * 0.7) * dt;
        // Le rupteur coupe l'allumage juste avant la zone rouge maximale
        if (rpm > 7600) rpm = 7600 - Math.random() * 500;
      } else {
        rpm += (idle - rpm) * Math.min(1, dt * 2.4);
      }
      render();
      if (holding || Math.abs(rpm - idle) > 4) { raf = requestAnimationFrame(tick); return; }
      rpm = idle; render(); raf = 0; last = 0;
    }
    const press = () => {
      holding = true; started = true;
      rev.classList.add("is-held");
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const release = () => { holding = false; rev.classList.remove("is-held"); };
    rev.addEventListener("pointerdown", (e) => { e.preventDefault(); try { rev.setPointerCapture(e.pointerId); } catch (err) { /* événement simulé */ } press(); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => rev.addEventListener(t, release));
    rev.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(); } });
    rev.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") release(); });
    rev.addEventListener("blur", release);
    rev.addEventListener("contextmenu", (e) => e.preventDefault());
    render();
  }

  /* ---------- Démo Portail Infra : rôles, AES-256-CBC, journal d'audit ---------- */

  const portail = $(".demo--portail");
  if (portail) {
    const roles = $$("[data-role]", portail);
    const reveal = $("[data-reveal]", portail);
    const pwd = $("[data-pwd]", portail);
    const cipherOut = $("[data-pwd-cipher]", portail);
    const why = $("[data-why]", portail);
    const audit = $("[data-audit]", portail);
    const HIDDEN = "••••••••••••";
    const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    let role = "Administrateur";
    let vault = null;

    // Le mot de passe de démo est chiffré pour de vrai au chargement, comme en base
    (async () => {
      try {
        const key = await crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, false, ["encrypt", "decrypt"]);
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const data = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, new TextEncoder().encode("Demo-Sauvegarde-26"));
        vault = { key, iv, data };
        cipherOut.textContent = `${b64(iv)}:${b64(data)}`;
      } catch (e) {
        cipherOut.textContent = "Chiffrement indisponible dans ce navigateur.";
      }
    })();

    const log = (text) => {
      const li = document.createElement("li");
      li.className = "is-new";
      const t = document.createElement("time");
      t.textContent = nowHM();
      const s = document.createElement("span");
      s.textContent = text;
      li.append(t, s);
      audit.prepend(li);
      while (audit.children.length > 5) audit.lastElementChild.remove();
    };

    const hide = () => {
      pwd.textContent = HIDDEN;
      reveal.textContent = "Afficher le mot de passe";
      reveal.setAttribute("aria-pressed", "false");
    };

    roles.forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.role === role) return;
      role = b.dataset.role;
      roles.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      hide();
      const reader = role === "Lecteur";
      reveal.disabled = reader;
      why.textContent = reader ? "Un lecteur voit la liste des comptes, jamais leurs mots de passe." : "";
      log(`${role} s'est connecté`);
    }));

    reveal.addEventListener("click", async () => {
      if (reveal.getAttribute("aria-pressed") === "true") { hide(); return; }
      if (!vault) return;
      try {
        const clear = await crypto.subtle.decrypt({ name: "AES-CBC", iv: vault.iv }, vault.key, vault.data);
        pwd.textContent = new TextDecoder().decode(clear);
        reveal.textContent = "Masquer";
        reveal.setAttribute("aria-pressed", "true");
        log(`${role} a déchiffré le mot de passe de svc_sauvegarde`);
      } catch (e) {
        why.textContent = "Le déchiffrement a échoué dans ce navigateur.";
      }
    });
  }

  /* ---------- Démo Échecs : contre le serveur, coups chiffrés dans les deux sens ---------- */

  const boardEl = $("[data-board]");
  if (boardEl && window.Chess) {
    const PIECES = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
    const NOMS = { p: "pion", r: "tour", n: "cavalier", b: "fou", q: "dame", k: "roi" };
    const plainOut = $("[data-plain]");
    const cipherOut = $("[data-cipher]");
    const replyOut = $("[data-reply]");
    let game = new window.Chess();
    let selected = null;
    let targets = [];
    let last = [];
    let waiting = false;
    let generation = 0;
    const squares = {};

    for (let r = 8; r >= 1; r--) {
      for (let c = 0; c < 8; c++) {
        const sq = "abcdefgh"[c] + r;
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.sq = sq;
        if ((r + c) % 2 === 0) b.classList.add("is-dark");
        boardEl.appendChild(b);
        squares[sq] = b;
      }
    }

    function render() {
      for (const [sq, b] of Object.entries(squares)) {
        const p = game.get(sq);
        const isTarget = targets.includes(sq);
        b.replaceChildren();
        b.classList.toggle("has-piece", Boolean(p));
        b.classList.toggle("is-selected", sq === selected);
        b.classList.toggle("is-target", isTarget);
        b.classList.toggle("is-last", last.includes(sq));
        if (p) {
          const img = document.createElement("img");
          img.src = `assets/img/pieces/${p.color === "w" ? "white" : "black"}-${PIECES[p.type]}.png`;
          img.alt = "";
          img.draggable = false;
          b.appendChild(img);
          b.setAttribute("aria-label", `${sq}, ${NOMS[p.type]} ${p.color === "w" ? "blanc" : "noir"}${isTarget ? ", prise possible" : ""}`);
        } else {
          b.setAttribute("aria-label", `${sq}${isTarget ? ", coup possible" : ", vide"}`);
        }
      }
      boardEl.classList.toggle("is-waiting", waiting);
    }

    // Une clé ECDH pour vous, une pour le serveur : chacun calcule la même clé AES-GCM
    const keys = (async () => {
      const curve = { name: "ECDH", namedCurve: "P-256" };
      const you = await crypto.subtle.generateKey(curve, false, ["deriveKey"]);
      const server = await crypto.subtle.generateKey(curve, false, ["deriveKey"]);
      const aes = { name: "AES-GCM", length: 256 };
      return {
        you: await crypto.subtle.deriveKey({ name: "ECDH", public: server.publicKey }, you.privateKey, aes, false, ["encrypt", "decrypt"]),
        server: await crypto.subtle.deriveKey({ name: "ECDH", public: you.publicKey }, server.privateKey, aes, false, ["encrypt", "decrypt"]),
      };
    })();
    const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
    async function seal(key, text) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
      return { iv, data };
    }
    async function unseal(key, box) {
      return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: box.iv }, key, box.data));
    }
    const message = (m) => JSON.stringify({ type: "coup", de: m.from, vers: m.to, piece: NOMS[m.piece] });

    function endText() {
      if (game.isCheckmate()) return game.turn() === "w" ? "Échec et mat, le serveur gagne. Une revanche ?" : "Échec et mat, vous avez gagné !";
      if (game.isDraw() || game.isStalemate()) return "Partie nulle.";
      return "";
    }

    async function serverTurn(gen) {
      replyOut.textContent = "Le serveur déchiffre votre coup, le valide et choisit sa réponse…";
      await new Promise((r) => setTimeout(r, reduceMotion ? 150 : 700));
      if (gen !== generation) return;
      const moves = game.moves({ verbose: true });
      const captures = moves.filter((m) => m.captured);
      const pool = captures.length && Math.random() < 0.7 ? captures : moves;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const move = game.move({ from: pick.from, to: pick.to, promotion: "q" });
      last = [move.from, move.to];
      try {
        const k = await keys;
        const box = await seal(k.server, message(move));
        const clear = await unseal(k.you, box);
        if (gen !== generation) return;
        replyOut.textContent = `Reçu chiffré : ${hex(box.iv)}${hex(box.data).slice(0, 24)}…\nDéchiffré : ${clear}`;
      } catch (err) {
        replyOut.textContent = `Coup du serveur : ${move.from} vers ${move.to}`;
      }
      waiting = false;
      render();
      const end = endText();
      if (end) plainOut.textContent = end;
      else if (game.inCheck()) plainOut.textContent = "Échec ! Protégez votre roi.";
    }

    boardEl.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b || waiting || game.isGameOver()) return;
      const sq = b.dataset.sq;
      const p = game.get(sq);

      if (selected && targets.includes(sq)) {
        const move = game.move({ from: selected, to: sq, promotion: "q" });
        selected = null; targets = []; last = [move.from, move.to];
        waiting = true;
        render();
        const gen = generation;
        const text = message(move);
        plainOut.textContent = text;
        try {
          const k = await keys;
          const box = await seal(k.you, text);
          await unseal(k.server, box);
          if (gen !== generation) return;
          cipherOut.textContent = hex(box.iv) + hex(box.data);
        } catch (err) {
          cipherOut.textContent = "Votre navigateur bloque le chiffrement sur cette page.";
        }
        if (game.isGameOver()) { waiting = false; render(); replyOut.textContent = endText(); return; }
        serverTurn(gen);
        return;
      }

      if (p && p.color === "w") {
        selected = selected === sq ? null : sq;
        targets = selected ? game.moves({ square: sq, verbose: true }).map((m) => m.to) : [];
        if (selected && !targets.length) plainOut.textContent = "Cette pièce ne peut pas bouger pour l'instant.";
      } else {
        selected = null; targets = [];
      }
      render();
    });

    $("[data-reset]").addEventListener("click", () => {
      generation++;
      game = new window.Chess();
      selected = null; targets = []; last = []; waiting = false;
      plainOut.textContent = "Choisissez une pièce blanche : les cases possibles s'allument.";
      cipherOut.textContent = "Rien pour l'instant.";
      replyOut.textContent = "En attente de votre coup.";
      render();
    });

    render();
  }

  /* ---------- Démo CI/CD : replay de vrais runs GitHub Actions ---------- */

  const flow = $("[data-flow]");
  if (flow && DATA.ci) {
    const log = $("[data-flow-log]");
    const clock = $("[data-flow-clock]");
    const totalOut = $("[data-flow-total]");
    const play = $("[data-run-play]");
    const picks = $$("[data-run-pick]");
    const COLS = [["securite", "api", "front"], ["publier"], ["deployer-test"], ["deployer-prod"]];
    const mmss = (s) => `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}`;
    const dur = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${pad2(s % 60)} s` : `${s} s`);
    const parisTime = (iso) => new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
    let runKey = "ok";
    let raf = 0;

    function build() {
      cancelAnimationFrame(raf);
      const run = DATA.ci[runKey];
      flow.replaceChildren();
      COLS.forEach((ids) => {
        const col = document.createElement("div");
        col.className = "flow__col";
        ids.forEach((id) => {
          const j = run.jobs.find((x) => x.id === id);
          const el = document.createElement("div");
          el.className = "job";
          el.dataset.job = id;
          el.innerHTML = `<span class="job__state"></span><span class="job__name"></span><span class="job__time"></span>`;
          el.querySelector(".job__name").textContent = j.name;
          el.querySelector(".job__time").textContent = dur(j.d);
          col.appendChild(el);
        });
        flow.appendChild(col);
      });
      totalOut.textContent = mmss(run.total);
      clock.textContent = "0:00";
      log.className = "flow__log";
      log.textContent = `Prêt à rejouer le run de ${parisTime(run.date)}, commit ${run.sha}.`;
      play.disabled = false;
      play.textContent = "Lancer le replay";
    }

    function frame(run, t) {
      const lines = [];
      run.jobs.forEach((j) => {
        const el = flow.querySelector(`[data-job="${j.id}"]`);
        const state = t < j.s ? "" : t < j.s + j.d ? "is-run" : j.ok ? "is-ok" : "is-ko";
        el.className = `job ${state}`;
        if (state === "is-run") {
          const step = j.steps.filter((s) => s.s <= t).pop();
          if (step) lines.push(`${j.name} › ${step.n}`);
        }
      });
      clock.textContent = mmss(Math.min(t, run.total));
      if (lines.length) log.textContent = lines.join("\n");
    }

    function start() {
      cancelAnimationFrame(raf);
      const run = DATA.ci[runKey];
      const speed = run.total / (reduceMotion ? 3 : 14);
      const t0 = performance.now();
      play.disabled = true;
      play.textContent = "Replay en cours…";
      log.className = "flow__log";
      const tick = (now) => {
        const t = ((now - t0) / 1000) * speed;
        frame(run, t);
        if (t < run.total) { raf = requestAnimationFrame(tick); return; }
        frame(run, run.total + 1);
        play.disabled = false;
        play.textContent = "Rejouer";
        if (run.ok) {
          log.className = "flow__log is-ok";
          log.textContent = `Déployé en production, commit ${run.sha}. Test de fumée réussi, ${dur(run.total)} au total.`;
        } else {
          log.className = "flow__log is-ko";
          log.textContent = `Test de fumée en échec en production :\n« ${run.error} ».\nLe run s'arrête en rouge. Le suivant est passé.`;
        }
      };
      raf = requestAnimationFrame(tick);
    }

    picks.forEach((b) => b.addEventListener("click", () => {
      runKey = b.dataset.runPick;
      picks.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      build();
    }));
    play.addEventListener("click", start);
    build();
  }

  /* ---------- Démo Jurassique : composition d'un échantillon d'ADN ---------- */

  const dnaBtn = $("[data-dna]");
  if (dnaBtn) {
    const bars = $$("[data-dna-bars] > div");
    const seqOut = $("[data-dna-seq]");
    const fileOut = $("[data-dna-file]");
    const msg = $("[data-dna-msg]");
    const input = $("[data-dna-input]");
    let n = 0;

    function show(name, seq, ignored) {
      const counts = ["A", "C", "G", "T"].map((b) => seq.split(b).length - 1);
      const total = counts.reduce((a, b) => a + b, 0);
      const max = Math.max(...counts, 1);
      bars.forEach((row, i) => {
        row.querySelector("i").style.setProperty("--v", counts[i] / max);
        row.querySelector("b").textContent = `${(counts[i] * 100 / total).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
        row.title = `${fmtInt(counts[i])} bases ${"ACGT"[i]}`;
      });
      fileOut.textContent = `${name}, ${fmtInt(total)} bases`;
      seqOut.textContent = seq.slice(0, 240) + (seq.length > 240 ? "…" : "");
      msg.textContent = ignored ? `${fmtInt(ignored)} caractères autres que A, C, G et T ont été ignorés.` : "";
    }

    dnaBtn.addEventListener("click", () => {
      const weights = [0, 1, 2, 3].map(() => 0.8 + Math.random() * 0.4);
      const sum = weights.reduce((a, b) => a + b, 0);
      let seq = "";
      for (let i = 0; i < 1000; i++) {
        let x = Math.random() * sum;
        let k = 0;
        while (x > weights[k] && k < 3) { x -= weights[k]; k++; }
        seq += "ACGT"[k];
      }
      n += 1;
      show(`echantillon_${pad2(n)}.adn`, seq, 0);
      dnaBtn.textContent = "Importer un autre échantillon";
    });

    input.addEventListener("change", async () => {
      const file = input.files[0];
      input.value = "";
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { msg.textContent = "Ce fichier dépasse 20 Mo. Essayez avec un fichier plus petit."; return; }
      const text = (await file.text()).split(/\r?\n/).filter((l) => !l.startsWith(">")).join("").toUpperCase();
      const clean = text.replace(/[^ACGT]/g, "");
      const ignored = text.replace(/\s/g, "").length - clean.length;
      if (!clean.length) { msg.textContent = "Aucune base A, C, G ou T dans ce fichier. Essayez avec un fichier de séquence."; return; }
      show(file.name, clean, ignored);
    });
  }

  /* ---------- Robot : graphique des backtests ---------- */

  const chartSvg = $("[data-chart-svg]");
  if (chartSvg && DATA.bot) {
    const SVGNS = "http://www.w3.org/2000/svg";
    const tip = $("[data-chart-tip]");
    const pts = DATA.bot.curve;
    const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const minY = -20, maxY = 125, x0 = 2022, x1 = 2026.85;
    const H = 300, L = 54, R = 10, T = 14, B = 186;
    const coarse = matchMedia("(pointer: coarse)").matches;
    $(".demo--bot .demo__note").textContent = coarse ? "Glissez le doigt sur la courbe" : "Survolez la courbe";
    chartSvg.setAttribute("tabindex", "0");
    let W = 600, X, Y, cursor, point;
    let idx = pts.length - 1;
    let visible = false;

    const el = (name, attrs) => {
      const n = document.createElementNS(SVGNS, name);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      chartSvg.appendChild(n);
      return n;
    };

    // Le graphique est dessiné à la taille réelle du cadre : 1 unité = 1 pixel, les textes restent lisibles
    function draw() {
      W = Math.max(280, Math.round(chartSvg.parentElement.clientWidth));
      X = (v) => L + ((v - x0) / (x1 - x0)) * (W - L - R);
      Y = (v) => T + (1 - (v - minY) / (maxY - minY)) * (B - T);
      chartSvg.replaceChildren();
      chartSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      chartSvg.setAttribute("height", H);
      [0, 40, 80, 120].forEach((v) => {
        el("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: "grid" });
        el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", class: "axis" }).textContent = `${v > 0 ? "+" : ""}${v} R`;
      });
      [2022, 2023, 2024, 2025, 2026].forEach((yr) => {
        el("text", { x: X(yr + 0.5), y: B + 20, "text-anchor": "middle", class: "axis" }).textContent = W < 380 ? `'${String(yr).slice(2)}` : yr;
      });
      const line = pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ");
      el("path", { d: `${line} L${X(pts[pts.length - 1][0]).toFixed(1)},${Y(0)} L${X(pts[0][0]).toFixed(1)},${Y(0)} Z`, class: "area" });
      el("path", { d: line, class: "line" });
      // Gain moyen par trade, année par année
      el("text", { x: L, y: 232, class: "axis" }).textContent = "Gain moyen par trade, par année";
      const bw = Math.min(40, (W - L - R) / 5 - 14);
      DATA.bot.years.forEach(([yr, v]) => {
        const cx = X(yr + 0.5);
        const h = Math.max(2, (v / 0.65) * 30);
        el("rect", { x: cx - bw / 2, y: 296 - h, width: bw, height: h, rx: 3, class: "bar" });
        el("text", { x: cx, y: 290 - h, "text-anchor": "middle", class: "bar-lbl" }).textContent = `+${v.toLocaleString("fr-FR")}`;
      });
      cursor = el("line", { y1: T, y2: B, class: "cursor", visibility: "hidden" });
      point = el("circle", { r: 4.5, class: "point", visibility: "hidden" });
      if (visible) showAt(idx);
    }

    function showAt(i) {
      visible = true;
      idx = Math.max(0, Math.min(pts.length - 1, i));
      const [t, v] = pts[idx];
      const x = X(t), y = Y(v);
      cursor.setAttribute("x1", x); cursor.setAttribute("x2", x); cursor.setAttribute("visibility", "visible");
      point.setAttribute("cx", x); point.setAttribute("cy", y); point.setAttribute("visibility", "visible");
      const year = Math.floor(t);
      const month = MOIS[Math.min(11, Math.floor((t - year) * 12))];
      tip.textContent = `Trade ${idx + 1} sur ${pts.length}, ${month} ${year} : ${v >= 0 ? "+" : ""}${Math.round(v)} R cumulés`;
      tip.hidden = false;
      const tw = tip.offsetWidth;
      tip.style.transform = `translate(${Math.min(Math.max(x - tw / 2, 0), W - tw)}px, ${Math.max(y - 46, 0)}px)`;
    }
    function hide() {
      visible = false;
      cursor.setAttribute("visibility", "hidden"); point.setAttribute("visibility", "hidden"); tip.hidden = true;
    }

    chartSvg.addEventListener("pointermove", (e) => {
      const box = chartSvg.getBoundingClientRect();
      const t = x0 + (((e.clientX - box.left) * (W / box.width) - L) / (W - L - R)) * (x1 - x0);
      let best = 0;
      pts.forEach((p, i) => { if (Math.abs(p[0] - t) < Math.abs(pts[best][0] - t)) best = i; });
      showAt(best);
    });
    chartSvg.addEventListener("pointerleave", hide);
    chartSvg.addEventListener("focus", () => showAt(idx));
    chartSvg.addEventListener("blur", hide);
    chartSvg.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowRight") { e.preventDefault(); showAt(idx + step); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); showAt(idx - step); }
      else if (e.key === "Home") { e.preventDefault(); showAt(0); }
      else if (e.key === "End") { e.preventDefault(); showAt(pts.length - 1); }
    });
    draw();
    new ResizeObserver(() => { if (Math.round(chartSvg.parentElement.clientWidth) !== W) draw(); }).observe(chartSvg.parentElement);
  }
})();
