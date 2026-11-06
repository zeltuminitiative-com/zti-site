// Mise en page des e-mails de ZTi (accusé de réception, alertes, e-mails écrits depuis la fiche d'un client).
// HTML « à l'ancienne » (tableaux, styles en ligne) pour s'afficher partout : Gmail, Outlook, téléphones.
// Replis : bandeau en dégradé avec un fond bleu uni dessous (Outlook ne montre pas les dégradés), logo en image avec un
// texte de remplacement « ZTi » blanc (images souvent bloquées), polices du site avec Arial en secours (Gmail).
// Le texte vient du back-office ou du visiteur : il est toujours échappé, puis les retours à la ligne deviennent des paragraphes.
export const echapper = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TITRES = "Montserrat,'Segoe UI',Arial,sans-serif";
const TEXTE = "Inter,'Segoe UI',Arial,sans-serif";

// site : adresse du site public (logo et lien) ; whatsapp : numéro international sans « + » ; titre : facultatif
export function gabaritEmail({ texte, titre = '', site = '', whatsapp = '' }) {
  const paragraphes = String(texte ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font:400 15px/1.6 ${TEXTE};color:#4A5568">${echapper(p).replace(/\n/g, '<br>')}</p>`).join('');
  const logo = site
    ? `<img src="${echapper(site)}/images/logo-blanc.png" width="96" alt="ZTi" style="display:block;width:96px;height:auto;border:0;color:#FFFFFF;font:700 26px ${TITRES}">`
    : `<span style="color:#FFFFFF;font:700 26px ${TITRES}">ZTi</span>`;
  const lienSite = site ? `<a href="${echapper(site)}" style="color:#FFFFFF;text-decoration:underline">${echapper(site.replace(/^https?:\/\//, ''))}</a> · ` : '';
  const lienWa = whatsapp ? `<a href="https://wa.me/${echapper(whatsapp)}" style="color:#FFFFFF;text-decoration:underline">Écrire sur WhatsApp</a><br>` : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${echapper(titre || 'ZTi')}</title></head>
<body style="margin:0;padding:0;background:#E7ECFA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#E7ECFA" style="background:#E7ECFA"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:18px;overflow:hidden;border:1px solid #D7DCF3">
<tr><td bgcolor="#02008A" style="background-color:#02008A;background-image:linear-gradient(120deg,#02008A 0%,#1565FF 100%);padding:26px 28px">${logo}</td></tr>
<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:30px 28px 14px">
${titre ? `<h1 style="margin:0 0 20px;font:700 24px/1.25 ${TITRES};color:#02008A">${echapper(titre)}</h1>` : ''}${paragraphes}
</td></tr>
<tr><td bgcolor="#010038" style="background:#010038;padding:24px 28px">
<p style="margin:0 0 6px;font:700 15px ${TITRES};color:#FFFFFF">Zèl Tum Initiative SARL</p>
<p style="margin:0 0 14px;font:400 13px ${TEXTE};color:#9FD0FF">Votre partenaire de confiance, depuis 2008</p>
<p style="margin:0;font:400 13px/1.7 ${TEXTE};color:#FFFFFF">${lienWa}${lienSite}Yaoundé, Cameroun</p>
</td></tr></table></td></tr></table></body></html>`;
}
