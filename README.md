# a-erdemk.github.io

Mon portfolio, prévu sur https://a-erdemk.github.io.

Site statique fait main (HTML, CSS, JavaScript, sans framework ni étape de build), pour GitHub Pages. Il marche aussi en ouvrant `index.html` directement depuis le disque.

## Idée

Tout tient sur un écran, comme une messagerie : ma présentation et mes contacts à gauche, la liste des projets au milieu, le détail du projet choisi à droite. Sur téléphone, on voit la liste, et toucher un projet ouvre son détail avec un bouton retour. Chaque projet a sa propre adresse (`#portail`, `#echecs`…) pour pouvoir l'envoyer directement.

Quatre projets ont une démo qui marche dans la page :

- Portail Infra : changer de rôle, le mot de passe est vraiment chiffré en AES-256-CBC puis déchiffré à la demande, avec le journal d'audit.
- Échecs en réseau : jouer contre le « serveur », coups légaux grâce à chess.js, échange ECDH et messages chiffrés en AES-GCM dans les deux sens (WebCrypto).
- Chaîne CI/CD : replay accéléré de deux vrais runs GitHub Actions du 12 octobre 2026 (un réussi, un en échec au test de fumée).
- Parc du Jurassique : composition d'un échantillon d'ADN tiré au hasard ou d'un fichier du visiteur.

Le robot de trading a aussi une courbe interactive des 301 trades du backtest v1.8.

## Données

`assets/js/data.js` contient les données réelles des démos (runs CI extraits de l'API GitHub, courbe du backtest extraite de `docs/img/equity_curve.svg` du dépôt du robot).

## Thèmes et palettes

Le thème clair ou sombre suit l'ordinateur du visiteur, avec un bouton pour changer. Quatre palettes existent dans `assets/css/style.css` (`gulf`, `vert`, `graphite`, `lavande`) ; `choix.html` permet de les comparer. La palette retenue sera fixée dans l'attribut `data-palette` de `index.html`.

## Ajouter un projet

Dans `index.html` : ajouter une ligne dans la liste (`<a class="list__item" data-project="...">`) et un `<article class="detail__item" data-detail id="...">` avec le même identifiant.

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Crédits

chess.js (licence BSD-2, `assets/vendor/chess.js.LICENSE.txt`). Pièces d'échecs reprises du projet SAE 3.01.
