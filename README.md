# a-erdemk.github.io

Mon portfolio, prévu sur https://a-erdemk.github.io.

Site statique fait main (HTML, CSS, JavaScript, sans framework ni étape de build), pour GitHub Pages.

## Idée

Le site ressemble à un bureau d'ordinateur. Chaque projet est une fenêtre d'application, et trois d'entre eux ont une démo qui marche dans la page :

- Portail Infra : changer de rôle et voir ce que chacun a le droit de lire, avec le journal d'audit.
- Échecs en réseau : jouer un coup et voir le message chiffré (vrai ECDH et AES-GCM, via WebCrypto).
- Parc du Jurassique : importer un échantillon d'ADN tiré au hasard et voir sa composition.

## Styles

Trois palettes sont prévues dans `assets/css/style.css` (`data-style` sur `<html>` : `nuit`, `clair`, `ciel`). Le bandeau en haut de page sert à choisir ; il sera retiré avant la mise en ligne, avec le style retenu fixé dans `index.html`.

## Ajouter un projet

Copier un `<article class="app">` dans `index.html`, changer l'`id`, la barre de fenêtre (contexte et dates), le texte et la capture. Ajouter un lien dans le dock du haut si besoin.

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.
