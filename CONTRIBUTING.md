# Contribuer à UQ Platform

Merci de vouloir aider ! Ce site est la vitrine publique de l'écosystème UQ (Ufundi · Quotidienne · Zando).

## Démarrer en 2 minutes

```bash
git clone https://github.com/CTT-U-FUNDI/uq-platform-site.git
cd uq-platform-site
git checkout -b ma-contribution
# ouvre index.html dans ton navigateur — c'est un site 100% statique, aucun build
```

## Structure

| Élément | Rôle |
|---|---|
| `index.html` | Page d'accueil (hero, produits, piliers, équipe) |
| `site.css` | **SEULE** feuille de style — toutes les pages |
| `site-light.css` | Thème clair (chargé par `theme.js`) |
| `theme.js` | Bascule sombre/clair |
| `*.html` | Pages produits : zando, borb, auth, chat, studio, trading, mail, contact + pages légales |
| `assets/` | Images et logos |

## Règles du projet

- **Site statique pur** : HTML + CSS + vanilla JS. Pas de framework, pas de build, pas de npm.
- **Un seul CSS** : tout nouveau style va dans `site.css` (ou `site-light.css` pour le thème clair).
- **Polices** : Inter + Space Grotesk (Google Fonts, déjà chargées).
- **Pas de secret dans le code** — aucune clé API côté client.
- **Ton** : français, vouvoiement, phrases courtes.

## Workflow

1. Fork le repo → branche `ma-contribution`
2. Commit avec un message clair : `fix: ...` / `feat: ...` / `style: ...`
3. Ouvre une **Pull Request** — décris ce que tu changes et pourquoi
4. On review ensemble avant merge sur `gh-pages`

## Idées de contributions

- Accessibilité (ARIA, contrastes, navigation clavier)
- Performance (lazy-loading, poids des images)
- Traductions / contenus des pages produits
- Tests des formulaires
- Toute amélioration que tu vois !

## Contact

Pas sûr de comment t'y prendre ? Écris à **contact@uqplatform.com** ou ouvre une issue sur le repo.
