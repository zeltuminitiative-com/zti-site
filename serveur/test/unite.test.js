// Tests sans base de données : contenu des e-mails écrits avec les saisies d'un visiteur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remplir, miseEnPage, lienSur, recapitulatif } from '../src/notifier.js';
import { config } from '../src/config.js';
import { motSur, sansLien } from '../src/securite.js';

test('e-mails : un visiteur ne peut pas glisser un lien ou une phrase dans un accusé signé ZTi', () => {
  const t = remplir('Bonjour {prenom}, merci {organisation}.', { nom: 'Jean https://arnaque.example/gain', organisation: 'Gagnez <b>1000</b> www.faux.cm' });
  assert.ok(!/https?:|www\.|<|\.example/.test(t), t);
  assert.equal(remplir('Bonjour {prenom}', { nom: 'Marie Ngono' }), 'Bonjour Ngono');
  assert.equal(motSur("Jean-Pierre O'Neil\nhttp://x"), "Jean-Pierre O'Neilhttpx");
  assert.ok(sansLien('Jean https://x.cm') && sansLien('a\nb') && !sansLien('Complexe scolaire Les Lauriers'));
});

test('mise en page des e-mails : texte échappé, boutons seulement vers ZTi, charte présente', () => {
  const h = miseEnPage({ titre: 'Essai <b>', texte: 'Bonjour <script>alert(1)</script>\n\nDeuxième paragraphe', bouton: { texte: 'Ouvrir', lien: config.adresse + '/admin/' } });
  assert.ok(!h.includes('<script>') && h.includes('&lt;script&gt;') && h.includes('Essai &lt;b&gt;'));
  assert.equal((h.match(/<p style="margin:0 0 16px/g) || []).length, 2);
  assert.ok(h.includes('#02008A') && h.includes('#1565FF') && h.includes('#010038') && h.includes('logo-blanc.png') && h.includes('Ouvrir'));
  assert.ok(!lienSur('https://arnaque.example/x') && !lienSur(config.adresse + '.arnaque.example/') && lienSur(config.adresse + '/espace/'));
  const piege = miseEnPage({ texte: 'x', bouton: { texte: 'Payer', lien: 'https://arnaque.example/' } });
  assert.ok(!piege.includes('arnaque') && !piege.includes('Payer'));
  assert.ok(miseEnPage({ texte: 'x', equipe: true }).includes('envoyé à l\'équipe') && !miseEnPage({ texte: 'x', equipe: true }).includes('wa.me'));
  assert.ok(!h.includes('—'), 'pas de tiret long dans la mise en page');
  const sig = miseEnPage({ texte: 'Bonjour\n\nCliquez.\n\nL\'équipe ZTi', bouton: { texte: 'Ouvrir', lien: config.adresse + '/x' } });
  assert.ok(sig.indexOf('Ouvrir') < sig.indexOf('équipe ZTi'), 'bouton avant la signature');
});

test('e-mails : récapitulatif, bouton WhatsApp et tableau sans aucun lien ni balise du visiteur', () => {
  const d = { nom: 'NGONO Marie', organisation: 'Collège https://piege.example/x', secteur: 'Collège', postes: '11 à 20',
    besoins: ['Pannes', 'www.faux.cm'], lieu: 'Messassi, Yaoundé <b>', tel: '+237 6 99 00 00 00', moment: 'Matin', sujet: 'Diagnostic offert (écoles)',
    email: 'autre@exemple.cm', message: 'voir https://piege.example' };
  const r = recapitulatif(d);
  assert.ok(!/https?:|www\.|\.example|\.cm|<|>|\/|@/.test(r), r);
  assert.match(r, /• Établissement : Collège/);
  assert.match(r, /• Ordinateurs : 11 à 20/);
  assert.match(r, /• Moment pour vous contacter : Matin/);
  const t = remplir('Bonjour {prenom},\n\n{demande}\n\n{lien_whatsapp}\n\nÀ très vite,\nL\'équipe ZTi', d);
  assert.match(t, /^Bonjour Marie,/);
  assert.match(t, new RegExp('\\n\\nhttps://wa\\.me/' + config.whatsapp + '\\?text='));
  const h = miseEnPage({ titre: 'Votre demande est bien reçue', texte: t });
  assert.match(h, />Écrire sur WhatsApp</);
  assert.match(h, />Votre demande</);
  assert.ok(h.includes('white-space:nowrap'), 'téléphone jamais coupé');
  assert.ok(!/piege\.example|www\.faux|<b>|autre@exemple/.test(h), 'aucune saisie dangereuse dans le HTML');
  assert.ok(h.includes('/confidentialite/') && h.includes('Zèl Tum Initiative<') && !h.includes('SARL'), 'pied de page à 4 lignes');
  // WhatsApp : seul le numéro de ZTi passe
  assert.ok(lienSur('https://wa.me/' + config.whatsapp) && lienSur('https://wa.me/' + config.whatsapp + '?text=Bonjour%20ZTi'));
  assert.ok(!lienSur('https://wa.me/237600000000') && !lienSur('https://wa.me/' + config.whatsapp + '0') && !lienSur('https://wa.me/' + config.whatsapp + '?text=a"onmouseover'));
  assert.ok(!miseEnPage({ texte: 'https://wa.me/237600000000' }).includes('Écrire sur WhatsApp'), 'pas de bouton vers un autre numéro');
  // alerte à l'équipe : téléphone du demandeur en lien WhatsApp, seulement là
  const a = miseEnPage({ equipe: true, titreRecap: 'Détails de la demande', telWhatsapp: true, texte: '• Responsable : Marie\n• Téléphone : 699 00 00 00' });
  assert.ok(a.includes('href="https://wa.me/237699000000"') && a.includes('>Détails de la demande<'));
  assert.ok(!h.includes('href="https://wa.me/237699000000"') && !h.includes('wa.me/23769900'), 'pas de lien vers le client dans l\'accusé');
});
