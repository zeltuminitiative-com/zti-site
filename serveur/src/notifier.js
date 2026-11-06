// E-mails de ZTi, envoyés par Brevo (comme nos autres plateformes) : alertes à l'équipe, accusé de réception
// au client, e-mails écrits depuis la fiche d'un client. Sans clé Brevo, rien ne part (tout reste dans le back-office).
// Les données des visiteurs sont toujours échappées avant d'entrer dans le HTML.
import { config } from './config.js';
import { sql } from './db.js';
import { motSur, sansLien, limiter } from './securite.js';

export const echapper = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ——— Mise en page des e-mails, à la charte du site (src/styles/zti.css) ———
// Bleu du logo #02008A, bleu vif #1565FF (dégradé des boutons), bleu nuit #010038, blanc cassé #F7F8FC,
// texte ardoise #4A5568, titres Montserrat, texte Inter, boutons Poppins (Arial si la police manque).
// Tableaux et styles en ligne : c'est ce que Gmail, Outlook et les téléphones affichent le mieux.
// Le texte est TOUJOURS échappé ; seuls les boutons portent un lien, et seulement vers nos propres adresses.
const C = { logo: '#02008A', vif: '#1565FF', nuit: '#010038', ciel: '#9FD0FF', fond: '#EDF0F8', carte: '#F7F8FC',
  ardoise: '#4A5568', bord: '#D7DCF3', lavande: '#D7DCF3', gris: '#8993B8' };
const POLICE_TITRES = "Montserrat,'Segoe UI',Arial,sans-serif", POLICE_TEXTE = "Inter,'Segoe UI',Arial,sans-serif",
  POLICE_BOUTONS = "Poppins,'Segoe UI',Arial,sans-serif";
// coordonnées publiques de ZTi (les mêmes que contenu/reglages/site.yml)
const ZTI = { nomLegal: 'Zèl Tum Initiative SARL', ville: 'Yaoundé, Cameroun', signature: 'Votre partenaire de confiance, depuis 2008',
  whatsapp: '237699324689', whatsappAffiche: '+237 699 324 689' };

const nosAdresses = () => [config.adresse, config.sitePublic].filter(Boolean);
// un lien n'est accepté dans un bouton que s'il mène chez ZTi (back-office ou site public)
export const lienSur = lien => typeof lien === 'string' && nosAdresses().some(a => lien === a || lien.startsWith(a + '/'));

// texte → paragraphes : une ligne vide sépare deux paragraphes, un retour simple devient <br>
const blocs = texte => String(texte || '').trim().split(/\n\s*\n/).filter(Boolean);
const paragraphe = p => `<p style="margin:0 0 16px;font-family:${POLICE_TEXTE};font-size:15px;line-height:1.65;color:${C.ardoise}">${echapper(p).replace(/\n/g, '<br>')}</p>`;
// le bouton se place avant la signature (« L'équipe ZTi », « À très vite… ») si le texte en a une
const estSignature = p => /^(L['’]équipe|À très vite|Cordialement|Bien à vous)/i.test(p.trim());
function decouper(texte) {
  const b = blocs(texte);
  const i = b.length > 1 && estSignature(b.at(-1)) ? b.length - 1 : b.length;
  return [b.slice(0, i), b.slice(i)];
}

function bouton({ texte, lien }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr>
<td bgcolor="${C.logo}" style="border-radius:999px;background:${C.logo};background-image:linear-gradient(135deg,${C.logo} 0%,${C.vif} 100%)">
<a href="${echapper(lien)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${POLICE_BOUTONS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px">${echapper(texte)}</a>
</td></tr></table>`;
}

// equipe = alerte interne (pied de page court) ; client = e-mail reçu par un visiteur ou un ambassadeur
export function miseEnPage({ titre, texte, bouton: b, apercu, equipe = false }) {
  const logo = `${config.sitePublic}/images/logo-blanc.png`;
  const [avant, apres] = decouper(texte);
  const pied = equipe
    ? `<p style="margin:0;font-family:${POLICE_TEXTE};font-size:12px;line-height:1.6;color:${C.lavande}">Message automatique du site ZTi, envoyé à l'équipe.</p>`
    : `<p style="margin:0 0 6px;font-family:${POLICE_TITRES};font-size:14px;font-weight:700;color:#FFFFFF">${echapper(ZTI.nomLegal)}</p>
<p style="margin:0 0 14px;font-family:${POLICE_TEXTE};font-size:13px;line-height:1.6;color:${C.ciel}">${echapper(ZTI.signature)}</p>
<p style="margin:0;font-family:${POLICE_TEXTE};font-size:13px;line-height:1.8;color:${C.lavande}">
WhatsApp : <a href="https://wa.me/${ZTI.whatsapp}" style="color:#FFFFFF;text-decoration:underline">${ZTI.whatsappAffiche}</a><br>
<a href="${echapper(config.sitePublic)}/" style="color:#FFFFFF;text-decoration:underline">${echapper(config.sitePublic.replace(/^https?:\/\//, ''))}</a> · ${echapper(ZTI.ville)}</p>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;600&family=Poppins:wght@600&display=swap" rel="stylesheet">
<title>${echapper(titre || 'ZTi')}</title></head>
<body style="margin:0;padding:0;background:${C.fond}">
${apercu ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${echapper(apercu)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fond}" style="background:${C.fond}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:18px;overflow:hidden;border:1px solid ${C.bord}">
<tr><td bgcolor="${C.logo}" style="background:${C.logo};background-image:linear-gradient(135deg,${C.logo} 0%,${C.vif} 100%);padding:22px 28px">
<img src="${echapper(logo)}" width="96" alt="ZTi" style="display:block;width:96px;height:auto;border:0;color:#FFFFFF;font-family:${POLICE_TITRES};font-size:22px;font-weight:800">
</td></tr>
<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:32px 28px 16px">
${titre ? `<h1 style="margin:0 0 18px;font-family:${POLICE_TITRES};font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${C.logo}">${echapper(titre)}</h1>` : ''}
${avant.map(paragraphe).join('')}
${b && lienSur(b.lien) ? bouton(b) : ''}
${apres.map(paragraphe).join('')}
</td></tr>
<tr><td bgcolor="${C.nuit}" style="background:${C.nuit};padding:22px 28px">${pied}</td></tr>
</table></td></tr></table></body></html>`;
}

// version texte (lue par les messageries sans HTML) : le lien du bouton est écrit en clair
function versionTexte(texte, b) {
  if (!(b && lienSur(b.lien))) return String(texte || '').trim();
  const [avant, apres] = decouper(texte);
  return [...avant, `${b.texte} : ${b.lien}`, ...apres].join('\n\n');
}

export async function envoyer({ a, sujet, texte, repondreA, titre, bouton: b, apercu, equipe }) {
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
        textContent: versionTexte(texte, b),
        htmlContent: miseEnPage({ titre, texte, bouton: b, apercu, equipe }),
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
export async function alerter(genre, sujet, lignes, { titre, bouton } = {}) {
  const r = await reglage('alertes');
  if (!r || r[genre] === false) return;
  if (!limiter('alerte-global', 200, 3600_000)) return;
  const res = await envoyer({ a: r.destinataires || [], sujet, titre, bouton, equipe: true,
    texte: lignes.filter(x => typeof x === 'string').join('\n') });
  if (!res.ok && config.brevo) console.error('Alerte non envoyée :', res.raison);
}

// remplace {prenom}, {nom}, {organisation} dans un modèle
export function remplir(modele, d) {
  // seules des lettres passent : un visiteur ne peut pas glisser un lien ou une phrase dans un e-mail signé ZTi
  const nom = motSur(d.nom, 60), prenom = motSur(String(d.nom || '').trim().split(/\s+/).at(-1), 30) || nom.split(' ')[0] || '';
  return String(modele || '').replace(/\{(prenom|nom|organisation)\}/g, (_, k) => ({ prenom, nom, organisation: motSur(d.organisation, 60) }[k]));
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
  await envoyer({ a: d.email, sujet: remplir(m.sujet, d), titre: 'Votre demande est bien reçue', apercu: 'ZTi vous recontacte sous 48 heures ouvrables.',
    texte: remplir(m.texte, d), repondreA: alertes?.destinataires?.[0] });
}
