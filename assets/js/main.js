// Graphe Git du portfolio : la carte du haut et une branche par projet.
// Les projets sont lus dans le HTML (balises <article class="project">), rien à modifier ici pour en ajouter un.

const root = document.documentElement;
root.classList.add("js");

const SVG = "http://www.w3.org/2000/svg";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function cssNumber(name, fallback) {
  const v = parseFloat(getComputedStyle(root).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/* ---------- Thème clair / sombre ---------- */

const themeButton = document.querySelector("[data-theme-toggle]");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return root.dataset.theme || (prefersDark.matches ? "dark" : "light");
}

function updateThemeLabel() {
  const next = currentTheme() === "dark" ? "clair" : "sombre";
  themeButton.setAttribute("aria-label", `Passer en thème ${next}`);
}

themeButton.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) { /* stockage indisponible */ }
  updateThemeLabel();
});
prefersDark.addEventListener("change", updateThemeLabel);
updateThemeLabel();

/* ---------- Copier l'adresse e-mail ---------- */

const toast = document.querySelector("[data-toast]");
let toastTimer;

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      toast.textContent = `Adresse copiée : ${text}`;
    } catch (e) {
      toast.textContent = `Copie impossible ici. Mon adresse : ${text}`;
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 4000);
  });
});

/* ---------- Une branche par projet ---------- */

function centerY(child, article) {
  if (!child) return null;
  const a = article.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  return c.top - a.top + c.height / 2;
}

function drawProjectGraph(box) {
  const article = box.parentElement;
  const w = box.clientWidth;
  const h = box.clientHeight;
  const xm = cssNumber("--x-main", 12);
  const xb = cssNumber("--x-branch", 42);
  box.replaceChildren();
  const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, focusable: "false" }, box);

  // Branche ouverte à la fin : main continue en pointillés vers le contact
  if (box.classList.contains("project__graph--open")) {
    el("line", { x1: xm, y1: 0, x2: xm, y2: h * 0.45, class: "g-main" }, svg);
    el("line", { x1: xm, y1: h * 0.45, x2: xm, y2: h, class: "g-main g-dash" }, svg);
    return;
  }

  // Contact : une branche pas encore créée, en pointillés, qui part vers le titre
  if (box.classList.contains("project__graph--invite")) {
    const title = box.parentElement.querySelector(".contact__title");
    const yt = title ? title.offsetTop + Math.min(48, title.offsetHeight / 2) : 140;
    el("line", { x1: xm, y1: 0, x2: xm, y2: yt + 60, class: "g-main g-dash" }, svg);
    el("path", { d: `M${xm} ${yt - 40} C${xm} ${yt - 16} ${xb} ${yt - 28} ${xb} ${yt}`, class: "g-branch g-dash" }, svg);
    el("line", { x1: xb, y1: yt, x2: w, y2: yt, class: "g-tick" }, svg);
    el("circle", { cx: xm, cy: yt - 40, r: 5, class: "g-node" }, svg);
    el("circle", { cx: xb, cy: yt, r: 7, class: "g-open" }, svg);
    return;
  }

  el("line", { x1: xm, y1: 0, x2: xm, y2: h, class: "g-main" }, svg);

  const yFork = centerY(article.querySelector(".project__ref"), article) ?? 100;
  const yMerge = centerY(article.querySelector(".project__merge"), article);
  const open = yMerge === null;
  const yEnd = open ? h - 56 : yMerge;
  const bend = Math.min(36, (yEnd - yFork) / 3);

  let d = `M${xm} ${yFork} C${xm} ${yFork + bend * 0.8} ${xb} ${yFork + bend * 0.2} ${xb} ${yFork + bend}`;
  if (open) {
    d += ` L${xb} ${yEnd}`;
  } else {
    d += ` L${xb} ${yEnd - bend} C${xb} ${yEnd - bend * 0.2} ${xm} ${yEnd - bend * 0.8} ${xm} ${yEnd}`;
  }
  el("path", { d, class: "g-branch" }, svg);

  // Traits fins entre la branche et ses étiquettes
  el("line", { x1: xb, y1: yFork, x2: w, y2: yFork, class: "g-tick" }, svg);
  el("circle", { cx: xm, cy: yFork, r: 5, class: "g-node" }, svg);

  if (open) {
    el("circle", { cx: xb, cy: yEnd, r: 6, class: "g-open" }, svg);
  } else {
    el("line", { x1: xm, y1: yEnd, x2: w, y2: yEnd, class: "g-tick" }, svg);
    el("circle", { cx: xm, cy: yEnd, r: 7.5, class: "g-merge" }, svg);
  }
}

/* ---------- Carte de toutes les branches (hero) ---------- */

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const mapBox = document.querySelector("[data-map]");
let mapDrawn = false;

function drawMap() {
  if (!mapBox) return;
  const projects = [...document.querySelectorAll(".project[data-start]")];
  const w = mapBox.clientWidth;
  const narrow = w < 600;
  const h = narrow ? 150 : 230;
  const ym = h / 2 + (narrow ? 0 : -6);
  const lift = narrow ? 34 : 58;
  const padL = 6;
  const padR = narrow ? 30 : 120;

  const t0 = new Date("2025-09-01").getTime();
  const t1 = new Date("2026-12-31").getTime();
  const now = Math.min(Date.now(), t1);
  const x = (date) => padL + ((new Date(date).getTime() - t0) / (t1 - t0)) * (w - padL - padR);

  mapBox.replaceChildren();
  const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, focusable: "false" }, mapBox);
  if (!mapDrawn && !reduceMotion) svg.classList.add("is-drawing");

  // Repères d'années (masqués sur petit écran, faute de place)
  for (const year of narrow ? [] : [2026]) {
    const xy = x(`${year}-01-01`);
    el("line", { x1: xy, y1: ym - 22, x2: xy, y2: ym + 22, class: "m-year" }, svg);
    const t = el("text", { x: xy + 5, y: ym - 10, class: "lbl-date" }, svg);
    t.textContent = String(year);
  }
  if (!narrow) {
    const t25 = el("text", { x: padL, y: ym + 24, class: "lbl-date" }, svg);
    t25.textContent = "2025";
  }

  // main : trait plein jusqu'à aujourd'hui, pointillés ensuite
  const xNow = x(new Date(now).toISOString().slice(0, 10));
  el("path", { d: `M${padL} ${ym} L${xNow} ${ym}`, class: "m-main draw", pathLength: 1 }, svg);
  el("path", { d: `M${xNow} ${ym} L${w - 4} ${ym}`, class: "m-main m-future" }, svg);
  el("circle", { cx: padL, cy: ym, r: 5, class: "g-node" }, svg);
  if (!narrow) {
    const tFut = el("text", { x: w - 4, y: ym - 14, class: "lbl-date", "text-anchor": "end" }, svg);
    tFut.textContent = "prochain stage";
  }

  projects.forEach((article, i) => {
    const up = i % 2 === 0;
    const yb = up ? ym - lift : ym + lift;
    const xs = x(article.dataset.start);
    let xe = x(article.dataset.end);
    const merged = article.querySelector(".project__merge") !== null;
    const minLen = narrow ? 30 : 70;
    if (xe - xs < minLen) xe = xs + minLen;
    const k = Math.min(narrow ? 16 : 40, (xe - xs) / 2.4);
    const color = getComputedStyle(article).getPropertyValue("--c").trim();

    const link = el("a", { href: `#${article.id}`, tabindex: "-1" }, svg);
    let d = `M${xs} ${ym} C${xs + k * 0.6} ${ym} ${xs + k * 0.4} ${yb} ${xs + k} ${yb}`;
    d += merged
      ? ` L${xe - k} ${yb} C${xe - k * 0.4} ${yb} ${xe - k * 0.6} ${ym} ${xe} ${ym}`
      : ` L${xe} ${yb}`;
    const path = el("path", { d, class: "br draw", pathLength: 1, style: `stroke:${color}` }, link);
    path.style.animationDelay = `${0.55 + i * 0.16}s`;
    // Zone cliquable plus large que le trait
    el("path", { d, class: "br-hit" }, link);

    el("circle", { cx: xs, cy: ym, r: 4.5, class: "g-node" }, link);
    if (merged) el("circle", { cx: xe, cy: ym, r: 6, class: "g-merge", style: `stroke:${color}` }, link);
    else el("circle", { cx: xe, cy: yb, r: 5, class: "g-open", style: `stroke:${color}` }, link);

    if (!narrow) {
      const mid = (xs + xe) / 2;
      const ty = up ? yb - 30 : yb + 24;
      const name = el("text", { x: mid, y: ty, "text-anchor": "middle", class: "lbl" }, link);
      name.textContent = article.dataset.name;
      const s = new Date(article.dataset.start);
      const e = new Date(article.dataset.end);
      const span = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
        ? `${MOIS[s.getMonth()]} ${s.getFullYear()}`
        : `${MOIS[s.getMonth()]} → ${MOIS[e.getMonth()]} ${e.getFullYear()}`;
      const date = el("text", { x: mid, y: ty + 15, "text-anchor": "middle", class: "lbl-date" }, link);
      date.textContent = span;
      name.style.animationDelay = date.style.animationDelay = `${0.75 + i * 0.16}s`;
      name.classList.add("fade");
      date.classList.add("fade");
    }
  });

  mapDrawn = true;
}

/* ---------- Dessin et redessin ---------- */

const graphs = [...document.querySelectorAll(".project__graph")];

function drawAll() {
  graphs.forEach(drawProjectGraph);
  drawMap();
}

let resizeTimer;
const observer = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawAll, 60);
});

document.fonts.ready.then(() => {
  drawAll();
  observer.observe(document.querySelector(".projects"));
  if (mapBox) observer.observe(mapBox);
});
