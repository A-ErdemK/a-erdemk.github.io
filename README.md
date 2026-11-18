# a-erdemk.github.io

Mon portfolio, prévu sur https://a-erdemk.github.io.

Site statique fait main (HTML, CSS, JavaScript, sans framework ni étape de build), pour GitHub Pages. Il marche aussi en ouvrant `index.html` directement depuis le disque.

## Comment il est fait

- Une seule page : présentation, carte de stage, projets, parcours, contact.
- Le fond est une grille de points dessinée dans un `<canvas>` : elle s'éclaire autour de la souris, une vague la traverse et chaque clic lance une onde. Elle reste fixe sur téléphone et quand le système demande moins d'animations.
- Les projets sont des cartes. Un clic ouvre la fiche dans un panneau (`<dialog>`) qui glisse depuis la droite. Chaque fiche a sa propre adresse (`#portail`, `#echecs`…) et le bouton retour du navigateur la referme.
- Thème clair ou sombre selon l'ordinateur du visiteur, avec un bouton pour changer.

Quatre projets ont une démo qui marche dans la page :

- Portail Infra : changer de rôle, le mot de passe est vraiment chiffré en AES-256-CBC puis déchiffré à la demande, avec le journal d'audit.
- Échecs en réseau : jouer contre le « serveur », coups légaux grâce à chess.js, échange ECDH et messages chiffrés en AES-GCM dans les deux sens (WebCrypto).
- Chaîne CI/CD : replay accéléré de deux vrais runs GitHub Actions du 12 octobre 2026 (un réussi, un en échec au test de fumée).
- Parc du Jurassique : composition d'un échantillon d'ADN tiré au hasard ou d'un fichier du visiteur.

Le robot de trading a une courbe interactive des 301 trades du backtest.

## Données

`assets/js/data.js` contient les données réelles des démos : runs CI extraits de l'API GitHub, courbe du backtest extraite de `docs/img/equity_curve.svg` du dépôt du robot.

## Ajouter un projet

Dans `index.html` : une carte `<li class="grid__item" data-cats="..."><a class="card" data-project="id">` dans la grille, et un `<article id="id" class="detail" data-detail hidden>` dans le panneau. Ajouter ensuite `id` au tableau `ORDER` de `assets/js/main.js`.

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Crédits

chess.js (licence BSD-2, `assets/vendor/chess.js.LICENSE.txt`). Pièces d'échecs reprises du projet SAE 3.01. Polices Geist, Geist Mono et Unbounded (Google Fonts).
