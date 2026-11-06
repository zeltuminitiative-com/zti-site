// Tests sans base de données : contenu des e-mails écrits avec les saisies d'un visiteur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remplir, recapitulatif } from '../src/notifier.js';
import { gabaritEmail } from '../src/gabarit-email.js';
import { motSur, sansLien } from '../src/securite.js';

test('e-mails : un visiteur ne peut pas glisser un lien ou une phrase dans un accusé signé ZTi', () => {
  const t = remplir('Bonjour {prenom}, merci {organisation}.', { nom: 'Jean https://arnaque.example/gain', organisation: 'Gagnez <b>1000</b> www.faux.cm' });
  assert.ok(!/https?:|www\.|<|\.example/.test(t), t);
  assert.equal(remplir('Bonjour {prenom}', { nom: 'Marie Ngono' }), 'Bonjour Ngono');
  assert.equal(motSur("Jean-Pierre O'Neil\nhttp://x"), "Jean-Pierre O'Neilhttpx");
  assert.ok(sansLien('Jean https://x.cm') && sansLien('a\nb') && !sansLien('Complexe scolaire Les Lauriers'));
});

test('e-mails : le récapitulatif et le lien WhatsApp ne laissent passer aucun lien ni balise', () => {
  const d = { nom: 'NGONO Marie', organisation: 'Collège https://piege.example/x', secteur: 'Collège', postes: '11 à 20',
    besoins: ['Pannes', 'www.faux.cm'], lieu: 'Messassi, Yaoundé <b>', tel: '+237 6 99 00 00 00', moment: 'Matin', sujet: 'Diagnostic offert (écoles)' };
  const r = recapitulatif(d);
  assert.ok(!/https?:|www\.|\.example|\.cm|<|>|\//.test(r), r);
  assert.match(r, /• Établissement : Collège/);
  assert.match(r, /• Ordinateurs : 11 à 20/);
  const t = remplir('Bonjour {prenom},\n\n{demande}\n\n{lien_whatsapp}', d);
  assert.match(t, /^Bonjour Marie,/);
  assert.match(t, /\n\nhttps:\/\/wa\.me\/\d+\?text=/);
  const html = gabaritEmail({ texte: t, titre: 'Votre demande est bien reçue' });
  assert.match(html, />Écrire sur WhatsApp</);
  assert.match(html, /Votre demande</);
  assert.ok(!/piege\.example|www\.faux|<b>/.test(html), 'aucune saisie dangereuse dans le HTML');
});
