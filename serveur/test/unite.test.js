// Tests sans base de données : contenu des e-mails écrits avec les saisies d'un visiteur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remplir, miseEnPage, lienSur } from '../src/notifier.js';
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
