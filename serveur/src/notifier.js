// E-mails de ZTi, envoyés par Brevo (comme nos autres plateformes) : alertes à l'équipe, accusé de réception
// au client, e-mails écrits depuis la fiche d'un client. Sans clé Brevo, rien ne part (tout reste dans le back-office).
// Les données des visiteurs sont toujours échappées avant d'entrer dans le HTML.
import { config } from './config.js';
import { sql } from './db.js';
import { motSur, sansLien, limiter } from './securite.js';
import { echapper, gabaritEmail } from './gabarit-email.js';

export { echapper };

// mise en page aux couleurs de ZTi (logo, titre, texte, pied de page) : voir gabarit-email.js
const html = (texte, titre, titreRecap) => gabaritEmail({ texte, titre, titreRecap, site: config.sitePublic });

export async function envoyer({ a, sujet, texte, repondreA, titre, titreRecap }) {
  const destinataires = (Array.isArray(a) ? a : [a]).filter(Boolean);
  if (!config.brevo || !config.expediteurEmail || !destinataires.length) return { ok: false, raison: 'E-mails non configurés' };
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': config.brevo, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: config.expediteurEmail, name: config.expediteurNom },
        to: destinataires.map(email => ({ email })),
        ...(repondreA ? { replyTo: { email: repondreA } } : {}),
        subject: String(sujet).replace(/[\r\n]+/g, ' ').slice(0, 180),
        textContent: texte,
        htmlContent: html(texte, titre, titreRecap),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return { ok: false, raison: `Brevo ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, raison: e.message };
  }
}

export async function reglage(cle) {
  const [r] = await sql`select valeur from reglages where cle = ${cle}`;
  return r?.valeur ?? null;
}

// alerte à l'équipe ZTi (nouvelle demande, nouvel avis)
export async function alerter(genre, sujet, lignes, titre) {
  const r = await reglage('alertes');
  if (!r || r[genre] === false) return;
  if (!limiter('alerte-global', 200, 3600_000)) return;
  const res = await envoyer({ a: r.destinataires || [], sujet, titre, titreRecap: 'Détails de la demande', texte: lignes.filter(x => typeof x === 'string').join('\n') });
  if (!res.ok && config.brevo) console.error('Alerte non envoyée :', res.raison);
}

// valeur d'un visiteur reprise dans le récapitulatif : lettres, chiffres, espaces et « ' , + ( ) - . » seulement
// (ni barre, ni deux-points, ni @, et un point seulement en fin de mot comme « M. » : aucun lien ni adresse ne peut passer)
const valeurSure = (v, max = 80) => String(v || '').normalize('NFC').replace(/[^\p{L}\p{N}' ,+().-]/gu, '').replace(/\.(?=\S)/g, '')
  .replace(/\s+/g, ' ').trim().slice(0, max);

// récapitulatif de la demande (lignes « • Libellé : valeur ») — seulement les réponses courtes, jamais le message libre
export function recapitulatif(d) {
  const besoins = (Array.isArray(d.besoins) ? d.besoins : []).map(b => valeurSure(b, 60)).filter(Boolean).join(', ');
  const nom = valeurSure(d.nom, 60), fonction = valeurSure(d.fonction, 60);
  return [
    ['Établissement', valeurSure(d.organisation, 80)], ['Type', valeurSure(d.secteur, 60)], ['Ordinateurs', valeurSure(d.postes, 30)],
    ['Préoccupations', besoins], ['Lieu', valeurSure(d.lieu, 80)], ['Nom', nom && (fonction ? `${nom} (${fonction})` : nom)],
    ['Téléphone', valeurSure(d.tel, 20)], ['Moment pour vous contacter', valeurSure(d.moment, 30)],
  ].filter(([, v]) => v).map(([l, v]) => `• ${l} : ${v}`).join('\n');
}

// lien WhatsApp vers ZTi, avec la demande déjà rédigée (le client écrit le premier, sans rien ressaisir)
export function lienWhatsapp(d) {
  if (!config.whatsapp) return '';
  const sujet = valeurSure(d.sujet, 60);
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Bonjour ZTi, voici ma demande${sujet ? ` (${sujet})` : ''} :\n${recapitulatif(d)}`)}`;
}

// remplace {prenom}, {nom}, {organisation}, {demande} (récapitulatif) et {lien_whatsapp} dans un modèle
export function remplir(modele, d) {
  // seules des lettres passent : un visiteur ne peut pas glisser un lien ou une phrase dans un e-mail signé ZTi
  const nom = motSur(d.nom, 60), prenom = motSur(String(d.nom || '').trim().split(/\s+/).at(-1), 30) || nom.split(' ')[0] || '';
  const valeurs = { prenom, nom, organisation: motSur(d.organisation, 60), demande: recapitulatif(d), lien_whatsapp: lienWhatsapp(d) };
  return String(modele || '').replace(/\{(prenom|nom|organisation|demande|lien_whatsapp)\}/g, (_, k) => valeurs[k]);
}

// accusé de réception automatique au client (s'il a donné son e-mail)
export async function accuserReception(d) {
  if (!d.email) return;
  // un nom ou une organisation qui contient un lien : pas d'accusé (tentative d'utiliser ZTi pour envoyer un message piégé)
  if (sansLien(d.nom) || sansLien(d.organisation)) return;
  // un seul accusé par adresse et par 24 h, et 60 au plus par heure pour tout le site
  if (!limiter('accuse:' + d.email.toLowerCase(), 1, 24 * 3600_000) || !limiter('accuse-global', 60, 3600_000)) return;
  const m = await reglage('accuse_demande');
  if (!m?.actif) return;
  const alertes = await reglage('alertes');
  await envoyer({ a: d.email, sujet: remplir(m.sujet, d), texte: remplir(m.texte, d), repondreA: alertes?.destinataires?.[0], titre: 'Votre demande est bien reçue' });
}
