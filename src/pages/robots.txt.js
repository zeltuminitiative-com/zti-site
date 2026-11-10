// Consignes aux robots des moteurs de recherche (/robots.txt) : tout le site est ouvert, avec l'adresse du plan du site.
// L'aperçu de test n'est pas bloqué ici : ses pages portent « noindex » (voir Base.astro), que les moteurs doivent pouvoir lire.
import { lien } from '../lib/contenu';

export function GET({ site }) {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(lien('/sitemap.xml'), site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
