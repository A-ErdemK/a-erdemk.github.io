# a-erdemk.github.io

Mon portfolio, prévu sur https://a-erdemk.github.io.

Site statique fait main (HTML, CSS, JavaScript, sans framework ni étape de build), pour GitHub Pages. Il marche aussi en ouvrant `index.html` directement depuis le disque.

## Idée

Le site ressemble à un bureau d'ordinateur : une barre en haut, des fenêtres qu'on déplace, un dock, et une recherche (Ctrl K ou ⌘ K). Chaque projet est une fenêtre d'application, et cinq d'entre eux ont une partie interactive :

- Portail Infra : changer de rôle, le mot de passe est vraiment chiffré en AES-256-CBC puis déchiffré à la demande, avec le journal d'audit.
- Échecs en réseau : jouer contre le « serveur », coups légaux grâce à chess.js, échange ECDH et messages chiffrés en AES-GCM dans les deux sens (WebCrypto).
- Chaîne CI/CD : replay accéléré de deux vrais runs GitHub Actions du 12 octobre 2026 (un réussi, un en échec au test de fumée).
- Parc du Jurassique : composition d'un échantillon d'ADN tiré au hasard ou d'un fichier du visiteur.
- Robot de trading : courbe interactive des 301 trades du backtest v1.8.

## Données

`assets/js/data.js` contient les données réelles des démos (runs CI extraits de l'API GitHub, courbe du backtest extraite de `docs/img/equity_curve.svg` du dépôt du robot).

## Thèmes et palettes

Le thème clair ou sombre suit l'ordinateur du visiteur, avec un bouton pour changer. Quatre palettes existent dans `assets/css/style.css` (`gulf`, `vert`, `graphite`, `lavande`) ; `choix.html` permet de les comparer. La palette retenue sera fixée dans l'attribut `data-palette` de `index.html`.

## Ajouter un projet

Copier un `<article class="app">` dans `index.html`, changer l'`id`, la barre de fenêtre (contexte et dates), le texte, la capture et `data-search` (mots trouvés par la recherche). Ajouter une icône dans le dock si besoin.

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Crédits

chess.js (licence BSD-2, `assets/vendor/chess.js.LICENSE.txt`). Pièces d'échecs reprises du projet SAE 3.01.
