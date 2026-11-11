// Site de ZTi : pages fixes publiées sur GitHub Pages.
// L'adresse est donnée par la publication (.github/workflows/publier.yml) : https://<compte>.github.io/ pour le dépôt
// <compte>.github.io, https://<compte>.github.io/<dépôt>/ pour un autre dépôt. En local : http://localhost.
import { defineConfig } from 'astro/config';

export default defineConfig({
  // adresse principale du site pour Google (choix de ZTi du 11/11/2026) : zti-sarl.pages.dev, même quand la page est servie
  // par zti-site.pages.dev ou l'aperçu de test — adresse canonique, plan du site, robots.txt et données Google
  site: process.env.SITE_PRINCIPAL || 'https://zti-sarl.pages.dev',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
