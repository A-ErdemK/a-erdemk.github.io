// Portfolio d'Erdem Kurac : choix du style, démos des projets, copie de l'e-mail.

const root = document.documentElement;
const pad = (n) => String(n).padStart(2, "0");
const now = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- Choix du style (provisoire, le temps de décider) ---------- */

const pickers = document.querySelectorAll("[data-pick]");
function setStyle(name) {
  root.dataset.style = name;
  pickers.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === name)));
  try { localStorage.setItem("style", name); } catch (e) { /* stockage indisponible */ }
}
pickers.forEach((b) => b.addEventListener("click", () => setStyle(b.dataset.pick)));
setStyle(root.dataset.style || "nuit");

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
    toastTimer = setTimeout(() => { toast.textContent = ""; }, 5000);
  });
});

/* ---------- Démo Portail Infra : rôles, mot de passe, journal d'audit ---------- */

const portail = document.querySelector(".demo--portail");
if (portail) {
  const roles = portail.querySelectorAll("[data-role]");
  const reveal = portail.querySelector("[data-reveal]");
  const pwd = portail.querySelector("[data-pwd]");
  const why = portail.querySelector("[data-why]");
  const audit = portail.querySelector("[data-audit]");
  const HIDDEN = "••••••••••••";
  let role = "Administrateur";

  const log = (text) => {
    const li = document.createElement("li");
    li.className = "is-new";
    const time = document.createElement("time");
    time.textContent = now();
    const span = document.createElement("span");
    span.textContent = text;
    li.append(time, span);
    audit.prepend(li);
    while (audit.children.length > 5) audit.lastElementChild.remove();
  };

  const hide = () => {
    pwd.textContent = HIDDEN;
    reveal.textContent = "Afficher le mot de passe";
    reveal.setAttribute("aria-pressed", "false");
  };

  roles.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.role === role) return;
    role = button.dataset.role;
    roles.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    hide();
    const reader = role === "Lecteur";
    reveal.disabled = reader;
    why.textContent = reader ? "Un lecteur voit la liste des comptes, jamais leurs mots de passe." : "";
    log(`${role} s'est connecté par LDAP`);
  }));

  reveal.addEventListener("click", () => {
    if (reveal.getAttribute("aria-pressed") === "true") { hide(); return; }
    pwd.textContent = "Demo-Sauvegarde-26";
    reveal.textContent = "Masquer";
    reveal.setAttribute("aria-pressed", "true");
    log(`${role} a affiché le mot de passe de svc_sauvegarde`);
  });
}

/* ---------- Démo Échecs : coup joué puis chiffré pour de vrai (ECDH + AES-GCM) ---------- */

const board = document.querySelector("[data-board]");
if (board) {
  const PIECES = { r: "rook", n: "knight", b: "bishop", q: "queen", k: "king", p: "pawn" };
  const NOMS = { r: "tour", n: "cavalier", b: "fou", q: "dame", k: "roi", p: "pion" };
  const START = ["rnbqkbnr", "pppppppp", "        ", "        ", "        ", "        ", "PPPPPPPP", "RNBQKBNR"];
  const FILES = "abcdefgh";
  const plain = document.querySelector("[data-plain]");
  const cipher = document.querySelector("[data-cipher]");
  const squares = [];
  let selected = null;

  const isWhite = (code) => code && code === code.toUpperCase();

  function place(square, code) {
    square.dataset.piece = code || "";
    square.replaceChildren();
    const name = square.dataset.sq;
    if (!code) { square.setAttribute("aria-label", `Case ${name}, vide`); return; }
    const color = isWhite(code) ? "white" : "black";
    const img = document.createElement("img");
    img.src = `assets/img/pieces/${color}-${PIECES[code.toLowerCase()]}.png`;
    img.alt = "";
    img.draggable = false;
    square.appendChild(img);
    square.setAttribute("aria-label", `Case ${name}, ${NOMS[code.toLowerCase()]} ${isWhite(code) ? "blanc" : "noir"}`);
  }

  function setup() {
    START.forEach((row, r) => [...row].forEach((code, c) => place(squares[r * 8 + c], code.trim())));
    if (selected) selected.classList.remove("is-selected");
    selected = null;
    plain.textContent = "Cliquez sur une pièce blanche, puis sur une case.";
    cipher.textContent = "Rien pour l'instant.";
  }

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement("button");
      square.type = "button";
      square.dataset.sq = FILES[c] + (8 - r);
      if ((r + c) % 2) square.classList.add("is-dark");
      board.appendChild(square);
      squares.push(square);
    }
  }
  setup();

  // Deux clés ECDH (vous et le serveur), puis une clé AES-GCM partagée
  const keyReady = (async () => {
    const curve = { name: "ECDH", namedCurve: "P-256" };
    const you = await crypto.subtle.generateKey(curve, false, ["deriveKey"]);
    const server = await crypto.subtle.generateKey(curve, false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "ECDH", public: server.publicKey }, you.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  })();

  const hex = (bytes) => [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, "0")).join("");

  async function send(from, to, code) {
    const message = JSON.stringify({ coup: `${from}-${to}`, piece: NOMS[code.toLowerCase()] });
    plain.textContent = message;
    try {
      const key = await keyReady;
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(message));
      cipher.textContent = hex(iv) + hex(data);
    } catch (e) {
      cipher.textContent = "Votre navigateur bloque le chiffrement sur cette page.";
    }
  }

  board.addEventListener("click", (event) => {
    const square = event.target.closest("button");
    if (!square) return;
    const code = square.dataset.piece;

    // Choisir (ou changer de) pièce blanche
    if (isWhite(code)) {
      if (selected) selected.classList.remove("is-selected");
      selected = selected === square ? null : square;
      if (selected) selected.classList.add("is-selected");
      return;
    }
    if (!selected) return;

    const moving = selected.dataset.piece;
    place(square, moving);
    place(selected, "");
    selected.classList.remove("is-selected");
    send(selected.dataset.sq, square.dataset.sq, moving);
    selected = null;
  });

  document.querySelector("[data-reset]").addEventListener("click", setup);
}

/* ---------- Démo Jurassique : composition d'un échantillon d'ADN ---------- */

const dnaButton = document.querySelector("[data-dna]");
if (dnaButton) {
  const bars = document.querySelectorAll("[data-dna-bars] > div");
  const seqOut = document.querySelector("[data-dna-seq]");
  const fileOut = document.querySelector("[data-dna-file]");
  let count = 0;

  dnaButton.addEventListener("click", () => {
    const bases = "ACGT";
    // Proportions légèrement différentes à chaque échantillon
    const weights = [...bases].map(() => 0.8 + Math.random() * 0.4);
    const total = weights.reduce((a, b) => a + b, 0);
    let seq = "";
    for (let i = 0; i < 1000; i++) {
      let x = Math.random() * total;
      let k = 0;
      while (x > weights[k]) { x -= weights[k]; k++; }
      seq += bases[k];
    }
    const counts = [...bases].map((b) => seq.split(b).length - 1);
    bars.forEach((row, i) => {
      row.querySelector("i").style.setProperty("--v", counts[i] / 1000);
      row.querySelector("b").textContent = counts[i];
    });
    count += 1;
    fileOut.textContent = `echantillon_${pad(count)}.adn, 1 000 bases`;
    seqOut.textContent = seq.slice(0, 240) + "…";
    dnaButton.textContent = "Importer un autre échantillon";
  });
}
