# a-erdemk.github.io

Mon portfolio, en ligne sur https://a-erdemk.github.io.

Site statique fait à la main (HTML, CSS, JavaScript, sans framework ni étape de build), hébergé par GitHub Pages.

## Idée

Chaque projet est une branche Git qui part de `main` et y revient une fois rendu. La carte du haut et les branches à gauche de chaque projet sont dessinées en SVG par `assets/js/main.js`, à partir des projets présents dans `index.html`.

## Ajouter un projet

1. Ajouter une capture dans `assets/img/` (WebP, 1200 px de large).
2. Dans `index.html`, copier un `<article class="project">` et changer :
   - `id` (ancre de la page),
   - `data-name`, `data-start` et `data-end` (dates `AAAA-MM-JJ`, utilisées par la carte),
   - la couleur `--c` (ajouter une variable `--c-…` dans `assets/css/style.css`, en clair et en sombre),
   - le texte, la capture, et le message de fusion (`project__merge`). Sans ce message, la branche reste ouverte.
3. Ajouter le lien dans la liste `map__list` du haut (utilisée sur mobile et par les lecteurs d'écran).

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Accessibilité

Thème clair et sombre (suivi du système, bouton pour forcer), navigation au clavier, animation de la carte désactivée si le système demande moins de mouvements, texte de remplacement sur chaque image.
