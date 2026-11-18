// Portfolio d'Erdem Kurac : thème, recherche, bureau et démos des projets.
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

  // Coordonnées lues dans la page (elles ne sont écrites qu'une fois, dans le HTML)
  const MAILTO = $(".menubar__mail").href;
  const EMAIL = $("[data-copy]").dataset.copy;
  const LINKEDIN = $('a[href*="linkedin.com"]').href;
  const GITHUB = $('a[href*="github.com"]').href;

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
  }
  themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (root.dataset.themeAuto) setTheme(e.matches ? "light" : "dark", false);
  });
  syncThemeLabel();

  // Raccourci affiché selon l'ordinateur
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$("[data-shortcut]").forEach((k) => { k.textContent = isMac ? "⌘ K" : "Ctrl K"; });

  // Navigateurs sans l'API popover : le bouton mène au contact
  const statusBtn = $(".menubar__status");
  if (!("popover" in HTMLElement.prototype)) {
    statusBtn.removeAttribute("popovertarget");
    statusBtn.addEventListener("click", () => goTo("#contact"));
  }

  function goTo(hash) {
    const target = $(hash);
    if (!target) return;
    history.replaceState(null, "", hash);
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  /* ---------- Recherche (Ctrl K) ---------- */

  const spot = $("[data-spotlight]");
  const spotInput = $("[data-spot-input]");
  const spotList = $("[data-spot-list]");
  const spotEmpty = $("[data-spot-empty]");
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const entries = [];
  $$("article.app[id]").forEach((a) => {
    const icon = $(".app__icon", a);
    entries.push({
      group: "Projets", title: $("h3", a).textContent, sub: $(".app__name", a).textContent,
      icon: icon ? icon.className.replace("app__icon", "").trim() : "", mono: icon ? icon.textContent : "",
      keys: norm(`${$("h3", a).textContent} ${a.dataset.search || ""}`), run: () => goTo(`#${a.id}`),
    });
  });
  entries.push(
    { group: "Sections", title: "Parcours et compétences", sub: "BUT, stage, technologies", icon: "ico--bot", mono: "§", keys: norm("parcours formation but iut competences stage technologies python flask django c# .net java vue react javascript typescript flutter mysql postgresql oracle sqlite docker git github actions tests"), run: () => goTo("#parcours") },
    { group: "Sections", title: "Me contacter", sub: "E-mail, LinkedIn", icon: "ico--contact", mono: "@", keys: norm("contact email mail linkedin stage ecrire"), run: () => goTo("#contact") },
    { group: "Actions", title: "Écrire un e-mail", sub: EMAIL, icon: "ico--contact", mono: "@", keys: norm("ecrire email mail contacter message"), run: () => { location.href = MAILTO; } },
    { group: "Actions", title: "Copier mon adresse e-mail", sub: "Pour l'ajouter à vos contacts", icon: "ico--contact", mono: "@", keys: norm("copier adresse email mail"), run: copyEmail },
    { group: "Actions", title: "Ouvrir mon LinkedIn", sub: "Profil et parcours", icon: "ico--portail", mono: "in", keys: norm("linkedin profil reseau"), run: () => { location.href = LINKEDIN; } },
    { group: "Actions", title: "Voir mon GitHub", sub: "Profil et activité", icon: "ico--cicd", mono: "gh", keys: norm("github code depots"), run: () => { location.href = GITHUB; } },
    { group: "Actions", title: "Changer de thème", sub: "Clair ou sombre", icon: "ico--bot", mono: "◐", keys: norm("theme clair sombre dark light mode nuit"), run: () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true) },
  );

  let shown = [];
  let active = 0;

  function renderSpot() {
    const words = norm(spotInput.value.trim()).split(/\s+/).filter(Boolean);
    shown = words.length
      ? entries.filter((e) => words.every((w) => e.keys.includes(w)))
          .sort((a, b) => Number(norm(b.title).includes(words[0])) - Number(norm(a.title).includes(words[0])))
      : entries;
    spotList.replaceChildren();
    let group = "";
    shown.forEach((e, i) => {
      if (e.group !== group) {
        group = e.group;
        const g = document.createElement("li");
        g.className = "spot__group"; g.setAttribute("role", "presentation"); g.textContent = group;
        spotList.appendChild(g);
      }
      const li = document.createElement("li");
      li.className = "spot__item"; li.id = `spot-${i}`; li.setAttribute("role", "option");
      li.innerHTML = `<span class="app__icon ${e.icon}" aria-hidden="true"></span><span><b></b><small></small></span>`;
      li.querySelector(".app__icon").textContent = e.mono;
      li.querySelector("b").textContent = e.title;
      li.querySelector("small").textContent = e.sub;
      li.addEventListener("mousemove", () => { if (active !== i) select(i); });
      li.addEventListener("click", () => activate(i));
      spotList.appendChild(li);
    });
    spotEmpty.hidden = shown.length > 0;
    if (!shown.length) spotEmpty.textContent = `Rien pour « ${spotInput.value.trim()} ». Essayez « Docker », « Vue » ou « sécurité ».`;
    select(0);
  }

  function select(i) {
    if (!shown.length) { spotInput.removeAttribute("aria-activedescendant"); return; }
    active = (i + shown.length) % shown.length;
    $$(".spot__item", spotList).forEach((li) => li.setAttribute("aria-selected", String(li.id === `spot-${active}`)));
    const el = $(`#spot-${active}`);
    spotInput.setAttribute("aria-activedescendant", el.id);
    el.scrollIntoView({ block: "nearest" });
  }

  function activate(i) {
    const e = shown[i];
    if (!e) return;
    spot.close();
    e.run();
  }

  function openSpot() {
    if (spot.open) return;
    spotInput.value = "";
    renderSpot();
    spot.showModal();
    spotInput.focus();
  }

  $$("[data-spotlight-open]").forEach((b) => b.addEventListener("click", openSpot));
  spotInput.addEventListener("input", renderSpot);
  spotInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); select(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); activate(active); }
  });
  spot.addEventListener("click", (e) => { if (e.target === spot) spot.close(); });
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); spot.open ? spot.close() : openSpot(); }
    else if (e.key === "/" && !typing && !spot.open) { e.preventDefault(); openSpot(); }
  });

  /* ---------- Le bureau : fenêtres déplaçables ---------- */

  const desk = $("[data-desk]");
  const tidy = $("[data-desk-tidy]");
  const canDrag = matchMedia("(pointer: fine) and (min-width: 961px)");
  let z = 3;

  function tidyDesk() {
    $$("[data-win]", desk).forEach((w) => w.removeAttribute("style"));
    tidy.hidden = true;
  }
  function syncDrag() { desk.classList.toggle("can-drag", canDrag.matches); if (!canDrag.matches) tidyDesk(); }
  canDrag.addEventListener("change", syncDrag);
  syncDrag();
  tidy.addEventListener("click", tidyDesk);
  addEventListener("resize", () => { if (!tidy.hidden) tidyDesk(); });

  $$("[data-win]", desk).forEach((win) => {
    let start = null;
    let moved = false;
    win.addEventListener("pointerdown", (e) => {
      if (!canDrag.matches || e.button !== 0) return;
      const d = desk.getBoundingClientRect();
      const r = win.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, left: r.left - d.left, top: r.top - d.top, w: d.width, h: d.height, ww: r.width, wh: r.height };
      moved = false;
      win.style.zIndex = ++z;
    });
    win.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) {
        moved = true;
        try { win.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
        win.classList.add("is-dragging");
      }
      const left = Math.min(Math.max(start.left + dx, -start.ww * 0.3), start.w - start.ww * 0.7);
      const top = Math.min(Math.max(start.top + dy, -10), start.h - start.wh * 0.5);
      Object.assign(win.style, { left: `${left}px`, top: `${top}px`, right: "auto", bottom: "auto", zIndex: z });
    });
    const end = () => {
      if (moved) { tidy.hidden = false; win.classList.remove("is-dragging"); }
      start = null;
    };
    win.addEventListener("pointerup", end);
    win.addEventListener("pointercancel", end);
    // Après un déplacement, le clic ne doit pas ouvrir le projet
    win.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } });
    win.addEventListener("dragstart", (e) => e.preventDefault());
  });

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
      log(`${role} s'est connecté par LDAP`);
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
