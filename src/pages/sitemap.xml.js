// Plan du site pour les moteurs de recherche (/sitemap.xml) : les pages publiques indexables du site.
// Pas la page Merci (réservée aux personnes qui viennent d'envoyer une demande) ni la page d'erreur.
import { getCollection } from 'astro:content';
import { lien } from '../lib/contenu';

export async function GET({ site }) {
  const pages = await getCollection('pages', p => p.id !== 'accueil');
  const campagnes = await getCollection('campagnes', c => c.data.en_ligne);
  const services = await getCollection('services', s => s.data.en_ligne);
  const chemins = ['/', '/services/', '/telechargements/',
    ...campagnes.map(c => `/offres/${c.id}/`), ...services.map(s => `/services/${s.id}/`), ...pages.map(p => `/${p.id}/`)];
  const urls = chemins.map(c => `  <url><loc>${new URL(lien(c), site).href}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
