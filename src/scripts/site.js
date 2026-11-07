// Comportements du site ZTi : menu sur téléphone, apparitions, questions repliables, visionneuse des attestations,
// calculateur du coût réel, formulaires de demande (général, écoles, entreprises, particuliers), avis, page « Merci ».
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, '\u00a0');
const suivi = (ev, p) => { if (window.fbq) window.fbq('track', ev, p); };

/* ---------- menu sur téléphone ---------- */
const bMenu = $('.menu-mobile'), nav = $('#menu-principal');
if (bMenu && nav) {
  const fermer = () => { nav.classList.remove('ouvert'); bMenu.setAttribute('aria-expanded', 'false'); };
  bMenu.addEventListener('click', () => { const o = nav.classList.toggle('ouvert'); bMenu.setAttribute('aria-expanded', String(o)); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) fermer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
}

/* ---------- barre du haut façon modèle D (pages avec le héro plein écran) : transparente sur la photo, vitrée dès qu'on
   défile, bouton visible après le héro, cachée au pied de page ; barre de lecture ; sur téléphone, bouton fixe en bas ---------- */
{ const heroD = $('.accroche-d'), ent = $('.entete');
  if (heroD && ent) {
    document.body.classList.add('mode-d');
    // comme dans D : « Votre partenaire de confiance | Depuis 2008 » sur la ligne du logo
    const sig = $('.marque small', ent); if (sig) sig.innerHTML = sig.innerHTML.split(/<br\s*\/?>/i).map(t => `<span>${t.trim()}</span>`).join('');
    const barre = document.createElement('div'); barre.className = 'pbar'; document.body.prepend(barre);
    const form = $('#demande'); let formVisible = false;
    const maj = () => { const y = scrollY, H = document.documentElement;
      barre.style.transform = `scaleX(${y / Math.max(1, H.scrollHeight - H.clientHeight)})`;
      ent.classList.toggle('sc', y > 40);
      document.body.classList.toggle('apres-hero', y > heroD.offsetHeight - 90);
      document.body.classList.toggle('cta-on', y > heroD.offsetHeight * .7 && !formVisible); };
    if ('IntersectionObserver' in window) {
      if (form) new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; maj(); }, { threshold: .05 }).observe(form);
      const pied = $('.pied'); if (pied) new IntersectionObserver(([e]) => document.body.classList.toggle('fin', e.isIntersecting), { threshold: .15 }).observe(pied);
    }
    addEventListener('scroll', maj, { passive: true }); maj();
  } }

/* ---------- page Merci : « Votre partenaire de confiance | Depuis 2008 » sur la ligne du logo, comme sur la page école ---------- */
if ($('[data-merci-page]')) { const sig = $('.entete .marque small'); if (sig) sig.innerHTML = sig.innerHTML.split(/<br\s*\/?>/i).map(t => `<span>${t.trim()}</span>`).join(''); }

/* ---------- pied de page : animé quand il arrive à l'écran ---------- */
{ const pied = $('.pied'); if (pied) { if ('IntersectionObserver' in window) { const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { pied.classList.add('vu'); o.disconnect(); } }), { threshold: .12 }); o.observe(pied); } else pied.classList.add('vu'); } }

/* ---------- écran « Vos données » : le message s'écrit quand l'image arrive à l'écran, puis recommence après 3 secondes de pause ---------- */
$$('.ecran-anime').forEach(el => {
  const jouer = () => { el.classList.remove('joue'); void el.offsetWidth; el.classList.add('joue'); };
  if (!('IntersectionObserver' in window)) { el.classList.add('joue'); return; }
  // à la fin de l'écriture de la dernière ligne, pause de 3 s, puis le message recommence
  el.querySelector('.ecran-ligne:last-child')?.addEventListener('animationend', e => { if (e.animationName === 'tape-ecran') setTimeout(jouer, 3000); });
  const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { jouer(); o.disconnect(); } }), { threshold: .3 });
  o.observe(el);
});

/* ---------- apparition au défilement ---------- */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(e => io.observe(e));
} else $$('.rv').forEach(e => e.classList.add('vu'));

/* ---------- questions repliables ---------- */
$$('.question > button, .pack-zti .tout-voir, .q-zti > button').forEach(b => b.addEventListener('click', () => {
  const ouvert = b.getAttribute('aria-expanded') === 'true';
  b.setAttribute('aria-expanded', String(!ouvert));
  document.getElementById(b.getAttribute('aria-controls')).hidden = ouvert;
}));

/* ---------- visionneuse des attestations (fenêtre maison) ---------- */
const boutonsVision = $$('[data-visionneuse]');
if (boutonsVision.length) {
  const v = document.createElement('div');
  v.className = 'visionneuse'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Attestation');
  v.innerHTML = '<img alt="" oncontextmenu="return false"><button class="fermer" type="button" aria-label="Fermer">×</button><p class="aide-zoom">Cliquez sur le document pour zoomer, puis déplacez la souris. Cliquez à nouveau pour revenir.</p>';
  document.body.append(v);
  let retour = null;
  // zoom sur ordinateur (×2,5 à l'endroit cliqué, la souris déplace la vue) ; sur téléphone, le pincement suffit
  const img = $('img', v); let zoom = false, cadre = null;
  const origine = e => { const r = cadre; img.style.transformOrigin = `${Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100))}% ${Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100))}%`; };
  const dezoomer = () => { zoom = false; v.classList.remove('zoom'); img.style.transformOrigin = ''; };
  img.addEventListener('click', e => { e.stopPropagation(); if (!zoom) { cadre = img.getBoundingClientRect(); origine(e); } zoom = !zoom; v.classList.toggle('zoom', zoom); });
  img.addEventListener('mousemove', e => { if (zoom) origine(e); });
  const fermer = () => { dezoomer(); v.classList.remove('ouverte'); retour?.focus(); };
  boutonsVision.forEach(b => b.addEventListener('click', () => { retour = b; dezoomer(); img.src = b.dataset.visionneuse; v.classList.add('ouverte'); $('.fermer', v).focus(); }));
  v.addEventListener('click', e => { if (e.target === v || e.target.closest('.fermer')) fermer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && v.classList.contains('ouverte')) fermer(); });
}

/* ---------- calculateur du coût réel ---------- */
$$('[data-calculateur]').forEach(root => {
  const grille = JSON.parse(root.dataset.grille || '[]');
  const prix = $('[data-calc="prix"]', root), postes = $('[data-calc="postes"]', root);
  // nouveau chiffre affiché d'un coup, avec un léger fondu seulement sur ce qui a changé (pas de défilement)
  const out = (k, v, dec = 0) => $$(`[data-out="${k}"]`, root).forEach(e => {
    const texte = dec ? v.toFixed(dec).replace('.', ',') : fmt(v);
    if (e.textContent === texte) return;
    const premiere = !e.textContent;
    e.textContent = texte;
    if (!premiere) { e.classList.remove('change'); void e.offsetWidth; e.classList.add('change'); }
  });
  const lire = el => +String(el.value).replace(/\D/g, '') || 0;
  const maj = () => {
    const P = Math.max(0, lire(prix)), N = Math.max(1, Math.min(9999, lire(postes) || 1));
    out('m24', P / 24); out('a24', P / 2); out('m36', P / 36); out('m36b', P / 36); out('a36', P / 3); out('g1', P / 2 - P / 3);
    const T = P * N;
    $$('[data-out="n"]', root).forEach(e => { e.textContent = N; });
    out('total', T); out('sa24', T / 2); out('sm24', T / 24); out('sa36', T / 3); out('sm36', T / 36); out('g2', T / 2 - T / 3);
    if (grille.length) {
      const pp = (grille.find(([max]) => N <= max) || grille[grille.length - 1])[1];
      const mois = P > 0 ? pp / (P / 36) : 0;
      out('pp', pp); out('ps', pp * N); out('mois', mois, 1);
    }
  };
  prix.addEventListener('input', () => { const n = String(prix.value).replace(/\D/g, '').slice(0, 9); prix.value = n ? fmt(+n) : ''; maj(); });
  postes.addEventListener('input', () => { postes.value = String(postes.value).replace(/\D/g, '').slice(0, 4); maj(); });
  $$('[data-pas]', root).forEach(b => b.addEventListener('click', () => { postes.value = Math.max(1, Math.min(9999, (lire(postes) || 1) + +b.dataset.pas)); maj(); }));
  maj();
});

/* ---------- source de la visite (publicités) : gardée pendant la visite ---------- */
const SOURCE = 'zti-source';
const SERVEUR = document.documentElement.dataset.serveur || '';
// code d'ambassadeur (?ref=…) : gardé 60 jours sur cet appareil, envoyé avec les demandes
const PARRAIN = (() => {
  try {
    const q = new URLSearchParams(location.search).get('ref');
    if (q && /^[a-z0-9-]{2,40}$/i.test(q)) localStorage.setItem('zti-parrain', JSON.stringify({ code: q.toLowerCase(), le: Date.now() }));
    const p = JSON.parse(localStorage.getItem('zti-parrain') || 'null');
    if (p && Date.now() - p.le < 60 * 864e5) return p.code;
    localStorage.removeItem('zti-parrain');
  } catch (_) { /* stockage indisponible */ }
  return '';
})();
(() => {
  const q = new URLSearchParams(location.search);
  const champs = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'];
  if (champs.some(c => q.get(c))) {
    const s = {}; champs.forEach(c => { if (q.get(c)) s[c] = q.get(c).slice(0, 120); });
    sessionStorage.setItem(SOURCE, JSON.stringify(s));
  } else if (!sessionStorage.getItem(SOURCE) && document.referrer && !document.referrer.startsWith(location.origin)) {
    sessionStorage.setItem(SOURCE, JSON.stringify({ referent: document.referrer.slice(0, 200) }));
  }
})();

/* ---------- formulaire de demande (général, écoles, entreprises en 3 étapes, particuliers) ---------- */
$$('form[data-demande]').forEach(form => {
  // choix en boutons
  $$('[data-choix]', form).forEach(g => {
    const unique = g.hasAttribute('data-unique');
    $$('button', g).forEach(b => b.addEventListener('click', () => {
      if (unique) { $$('button', g).forEach(x => x.setAttribute('aria-checked', String(x === b))); }
      else b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      g.closest('.champ')?.classList.remove('invalide');
      if (g.dataset.choix === 'profil') majProfil();
    }));
    if (unique) g.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const bs = $$('button', g), i = bs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]; n.focus(); n.click();
    });
  });
  const caseAccord = $('[data-case="accord"]', form);
  caseAccord.addEventListener('click', () => { caseAccord.setAttribute('aria-checked', String(caseAccord.getAttribute('aria-checked') !== 'true')); caseAccord.closest('.champ').classList.remove('invalide'); });
  const valeur = n => $$(`[data-choix="${n}"] button`, form).filter(b => b.getAttribute('aria-checked') === 'true' || b.getAttribute('aria-pressed') === 'true').map(b => b.textContent.trim());
  const code = n => ($$(`[data-choix="${n}"] button[aria-checked="true"]`, form)[0] || {}).dataset?.valeur || '';
  const v = n => (form.elements[n]?.value || '').trim();
  const profil = () => valeur('profil').join('') || form.dataset.profil || '';
  const champOrg = $('[data-champ="organisation"]', form);
  function majProfil() { if (champOrg && $('[data-choix="profil"]', form)) champOrg.hidden = code('profil') === 'particulier'; }
  majProfil();
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => i.closest('.champ')?.classList.remove('invalide')));
  const tel = form.elements.tel;
  tel.addEventListener('input', () => { const c = tel.value.replace(/\D/g, '').replace(/^237/, '').slice(0, 9); tel.value = c.replace(/(\d)(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/, (m, a, b, c2, d, e) => [a + b, c2, d, e].filter(Boolean).join(' ')); });

  // contrôle d'un bloc (une étape, ou la fin du formulaire) : signale les champs à corriger
  // saisies fantaisistes refusées (« grdfug 2346 », « aaaa », « xkcdz ») : il faut des voyelles, pas de lettre répétée 4 fois,
  // pas de suite de 5 consonnes, pas de mot de 5 lettres ou plus presque sans voyelle ; chiffres selon le champ
  const VOY = /[aeiouyàâäéèêëîïôöùûü]/i, CONS = /[bcdfghjklmnpqrstvwxz]{5,}/i;
  const vraisemblable = (val, chiffres = 'non') => {
    const s = (val || '').trim().replace(/\s+/g, ' ');
    if (s.length < 2 || !VOY.test(s) || /(.)\1{3,}/.test(s)) return false;
    if (chiffres === 'non' && /\d/.test(s)) return false;
    if (chiffres === 'peu' && /\d{3,}/.test(s)) return false;
    return s.split(/[\s'’\-.,/()]+/).every(m => { const l = m.replace(/[^a-zà-öø-ÿ]/gi, ''); if (CONS.test(l)) return false;
      return l.length < 5 || (l.match(/[aeiouyàâäéèêëîïôöùûü]/gi) || []).length / l.length >= 0.2; });
  };
  const controler = bloc => {
    const erreurs = [];
    const marque = (champ, ok) => { if (!champ || champ.hidden) return; champ.classList.toggle('invalide', !ok); if (!ok) erreurs.push(champ); };
    const champ = n => $(`[data-champ="${n}"]`, bloc);
    $$('[data-requis]', bloc).forEach(c => marque(c, !!code(c.dataset.champ)));
    $$('[data-requis-plusieurs]', bloc).forEach(c => marque(c, valeur(c.dataset.champ).length > 0));
    $$('[data-texte-requis]', bloc).forEach(c => { const x = (c.querySelector('input, textarea')?.value || '').trim(); marque(c, x.length >= 3 && vraisemblable(x, 'oui')); });
    $$('[data-texte-facultatif]', bloc).forEach(c => { const x = (c.querySelector('input, textarea')?.value || '').trim(); marque(c, !x || (x.length >= 3 && vraisemblable(x, 'oui'))); });   // vide accepté, sinon de vrais mots
    $$('[data-si-autre]', bloc).forEach(c => marque(c, vraisemblable(c.querySelector('input')?.value)));   // « Autre » choisi : la précision est obligatoire
    marque(champ('organisation'), v('organisation').length >= 3 && vraisemblable(v('organisation'), 'peu'));
    if (champ('secteur') && form.typeCoherent && code('secteur')) marque(champ('secteur'), form.typeCoherent());
    marque(champ('nom'), vraisemblable(v('nom'))); marque(champ('prenom'), vraisemblable(v('prenom'))); marque(champ('quartier'), vraisemblable(v('quartier'), 'peu')); marque(champ('ville_nom'), vraisemblable(v('ville_nom')));   // école : quartier et ville obligatoires
    marque(champ('tel'), /^6\d{8}$/.test(v('tel').replace(/\D/g, '')));
    const ec = champ('email');
    if (ec) marque(ec, ec.hasAttribute('data-email-requis') ? /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v('email')) : !v('email') || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v('email')));
    marque(champ('accord'), caseAccord.getAttribute('aria-checked') === 'true');
    const msg = $(':scope > .message-erreur', bloc) || $(':scope > .message-erreur', fin);
    if (erreurs.length) {
      if (msg) { msg.textContent = 'Quelques informations manquent : elles sont signalées ci-dessus.'; msg.hidden = false; }
      erreurs[0].querySelector('input, textarea, button')?.focus();
      return false;
    }
    if (msg) msg.hidden = true;
    return true;
  };

  // « Autre » : une zone de saisie apparaît sous la question (et disparaît, vidée, si on choisit autre chose)
  const majAutre = () => $$('[data-si-autre]', form).forEach(c => { const autre = code(c.dataset.siAutre) === 'Autre'; c.hidden = !autre; if (!autre) { const i = c.querySelector('input'); if (i) i.value = ''; c.classList.remove('invalide'); } });
  form.addEventListener('click', e => { if (e.target.closest('[data-choix] button')) setTimeout(majAutre); });
  majAutre();
  // type d'établissement reconnu d'après le nom (modèle D) : choisi automatiquement ; un type contraire au nom est refusé
  const mot = x => new RegExp(`(?:^|[^\\p{L}\\d])(?:${x})(?![\\p{L}\\d])`, 'iu');
  const TYPES_NOM = [
    [mot('groupe\\s+scolaire|g\\.?\\s?s\\.?\\s?b?\\.?'), 'Groupe scolaire'],
    [mot('complexe\\s+scolaire|c\\.?\\s?s\\.?\\s?b?\\.?'), 'Complexe scolaire'],
    [mot('cit[ée]\\s+scolaire'), 'Cité scolaire'],
    [mot('campus'), 'Campus scolaire'],
    [mot('lyc[ée]e|l\\.?\\s?b\\.?|l\\.?\\s?t\\.?'), 'Lycée'],
    [mot('coll[èe]ge|c\\.?e\\.?s\\.?|c\\.?e\\.?g\\.?|c\\.?e\\.?t\\.?i\\.?c\\.?'), 'Collège'],
    [mot('[ée]cole\\s+maternelle|maternelle|e\\.?\\s?m\\.?'), 'École maternelle'],
    [mot('[ée]cole\\s+primaire|e\\.?\\s?p\\.?\\s?b?\\.?'), 'École primaire'],
    [mot('institut'), 'Institut'],
    [mot('centre\\s+(?:de\\s+)?formation'), 'Centre de formation'],
    [mot('centre\\s+[ée]ducatif'), 'Centre éducatif'],
  ];
  const typesDuNom = n => TYPES_NOM.filter(([re]) => re.test(n || '')).map(r => r[1]);
  const champType = $('[data-choix="secteur"]', form)?.closest('.champ');
  let typeAuto = '';
  if (champType && $('[data-choix="secteur"] .groupe-choix', form)) {
    const note = $('[data-note-type]', form), errType = $('[data-erreur-type]', form);
    const majType = () => {
      const ts = typesDuNom(v('organisation'));
      if (ts.length && (!code('secteur') || code('secteur') === typeAuto)) { const bt = $(`[data-choix="secteur"] button[data-valeur="${ts[0]}"]`, form); if (bt && code('secteur') !== ts[0]) bt.click(); typeAuto = ts[0]; }
      note.textContent = ts.length ? `✓ Type reconnu d'après le nom : ${ts.join(' et ')}` : '';
    };
    form.elements.organisation?.addEventListener('input', majType);
    $$('[data-choix="secteur"] button', form).forEach(bt => bt.addEventListener('click', e => { if (e.isTrusted) typeAuto = ''; }));
    form.typeCoherent = () => { const ts = typesDuNom(v('organisation')), c = code('secteur');
      const ok = !c || c === 'Autre' || !ts.length || ts.includes(c);
      errType.textContent = ok ? 'Choisissez le type.' : `Le nom « ${v('organisation')} » correspond à : ${ts.join(' ou ')}. Corrigez le type ou le nom.`;
      return ok; };
  }
  // position de l'établissement (facultatif, modèle D) : lien Google Maps ajouté à la demande
  $$('[data-geo]', form).forEach(bt => bt.addEventListener('click', () => {
    const etat = $('[data-geo-etat]', form), champPos = form.elements.position;
    if (!navigator.geolocation) { etat.textContent = 'Position non disponible sur cet appareil.'; return; }
    etat.textContent = 'Recherche de la position…';
    navigator.geolocation.getCurrentPosition(p => { const { latitude: la, longitude: lo } = p.coords; champPos.value = `https://maps.google.com/?q=${la.toFixed(6)},${lo.toFixed(6)}`; etat.textContent = '✓ Position enregistrée.'; },
      () => { etat.textContent = 'Position refusée : le quartier et la ville suffisent.'; }, { enableHighAccuracy: true, timeout: 12000 });
  }));

  // photo du problème (facultatif) : seulement une image ; le nom du fichier choisi est affiché
  const champPhoto = form.elements.photo;
  champPhoto?.addEventListener('change', () => {
    const f = champPhoto.files[0], etat = $('[data-photo-etat]', form), ok = !f || /^image\/(jpeg|png|webp)$/.test(f.type);
    champPhoto.closest('.champ').classList.toggle('invalide', !ok);
    if (!ok) { champPhoto.value = ''; return; }
    if (f && etat) etat.textContent = `✓ ${f.name}`;
  });

  // étapes (formulaire des entreprises) : la fin du formulaire n'apparaît qu'à la dernière
  const etapes = $$('[data-etape]', form), fin = $('[data-fin]', form), progression = $('[data-progression]', form);
  const titres = JSON.parse(progression?.dataset.titres || '[]');
  let courante = 0;
  const aller = n => {
    courante = n;
    etapes.forEach((x, i) => { x.hidden = i !== n; });
    fin.hidden = n !== etapes.length - 1;
    if (progression) progression.textContent = `Étape ${n + 1} sur ${etapes.length} · ${titres[n] || ''}`;
    const haut = form.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > haut) window.scrollTo({ top: haut, behavior: 'smooth' });
    $('input:not([type=hidden]), button:not(.retour)', etapes[n])?.focus({ preventScroll: true });
    if (n > 0) window.ztiMesurer?.('formulaire', { valeur: n + 1, cible: form.dataset.sujet });
  };
  $$('[data-suivant]', form).forEach(b => b.addEventListener('click', () => { if (controler(etapes[courante])) aller(courante + 1); }));
  $$('[data-retour]', form).forEach(b => b.addEventListener('click', () => aller(courante - 1)));

  let envoi = false;
  const ouverture = Date.now();   // sécurité (modèle D) : envoi en moins de 5 s ou champ piège rempli = robot, rien n'est transmis
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (envoi || form.elements.site_web.value || Date.now() - ouverture < 5000) return; // déjà en cours, ou robot
    for (let i = 0; i < etapes.length; i++) if (!controler(etapes[i])) { if (i !== courante) aller(i); else controler(fin) || controler(etapes[i]); return; }
    if (!controler(fin)) return;

    const chiffres = v('tel').replace(/\D/g, '');
    // civilité (modèle D) : la fonction s'accorde au féminin pour Mme et Mlle
    const civilite = valeur('civilite').join(''), FEM = { Fondateur: 'Fondatrice', Promoteur: 'Promotrice', Directeur: 'Directrice', Principal: 'Principale', Proviseur: 'Proviseure', Censeur: 'Censeure' };
    const fonctionBrute = v('fonction') || valeur('fonction_choix').join('');
    const fonction = /^M(me|lle)$/.test(civilite) ? (FEM[fonctionBrute] || fonctionBrute) : fonctionBrute;
    const d = {
      date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' }), accord: true,
      sujet: form.dataset.sujet, profil: profil(), organisation: v('organisation'), secteur: v('secteur_precis') || valeur('secteur').join(''), position: v('position'),
      civilite, nom: v('prenom') ? `${v('nom').toUpperCase()} ${v('prenom').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase())}` : v('nom'), fonction, tel: '+237 ' + chiffres.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'), email: v('email'),
      lieu: v('lieu') || [v('quartier'), v('ville_nom')].filter(Boolean).join(', ') || valeur('ville').join(''), postes: valeur('postes').join(''), situation: valeur('situation').join(''),
      besoins: valeur('besoins'), accompagnement: valeur('accompagnement').join(''), prestataire: valeur('prestataire').join(''),
      depenses: valeur('depenses').join(''), moment: valeur('moment').join(''), message: v('message'), connu: valeur('connu').join(''),
      page: form.dataset.page || location.pathname, campagne: form.dataset.campagne || '', adresse: location.href.split('#')[0],
      ...JSON.parse(sessionStorage.getItem(SOURCE) || '{}'), parrain: PARRAIN,
    };
    const bouton = $('button[type="submit"]', form); bouton.disabled = true; envoi = true;
    const fichierPhoto = form.elements.photo?.files?.[0];
    if (fichierPhoto && form.dataset.photos) {
      const etat = $('[data-photo-etat]', form); if (etat) etat.textContent = 'Envoi de la photo…';
      d.photo = await envoyerPhoto(form.dataset.photos, fichierPhoto, d) || 'non reçue (envoi impossible)';
    }
    // le serveur ne garde pas la civilité, la position ni la photo : elles passent en tête du message
    const enTete = [d.position && `Position : ${d.position}`, d.photo && `Photo : ${d.photo}`].filter(Boolean).join('\n');
    const pourServeur = { ...d, nom: d.civilite ? `${d.civilite} ${d.nom}` : d.nom, message: [enTete, d.message].filter(Boolean).join('\n\n') };
    let enregistree = false;
    if (form.dataset.endpoint) enregistree = await envoyerDemande(form.dataset.endpoint, pourServeur);
    suivi('Lead', { content_name: d.sujet, content_category: d.campagne || d.page });
    const lignes = [
      `Bonjour ZTi, voici ma demande (${d.sujet}) :`,
      `• Profil : ${d.profil}`, d.organisation && `• ${d.profil === 'Établissement scolaire' ? 'Établissement' : 'Entreprise / organisation'} : ${d.organisation}`,
      `• Nom : ${d.civilite ? d.civilite + ' ' : ''}${d.nom}${d.fonction ? ' (' + d.fonction + ')' : ''}`, `• Téléphone : ${d.tel}`, d.email && `• E-mail : ${d.email}`,
      d.secteur && `• ${d.profil === 'Établissement scolaire' ? 'Type' : 'Secteur'} : ${d.secteur}`, d.lieu && `• Lieu : ${d.lieu}`, d.position && `• Position : ${d.position}`,
      d.postes && `• ${d.profil === 'Particulier' ? 'Appareil' : 'Ordinateurs'} : ${d.postes}`,
      d.situation && `• Situation : ${d.situation}`, d.besoins.length && `• ${d.profil === 'Particulier' ? 'Problème' : 'Besoin'} : ${d.besoins.join(', ')}`,
      d.accompagnement && `• Accompagnement : ${d.accompagnement}`, d.prestataire && `• Prestataire actuel : ${d.prestataire}`,
      d.depenses && `• Dépenses actuelles : ${d.depenses}`, d.moment && `• Meilleur moment : ${d.moment}`,
      d.message && `• Message : ${d.message}`, d.photo && `• Photo : ${d.photo}`, d.connu && `• A connu ZTi par : ${d.connu}`,
    ].filter(Boolean).join('\n');
    sessionStorage.setItem('zti-demande', JSON.stringify({ enregistree, texte: lignes, sujet: d.sujet, wa: form.dataset.wa, mail: form.dataset.mail }));
    location.href = form.dataset.merci;
  });
});

// envoi au serveur de ZTi (réponse vérifiée) ; ancienne adresse de script Google : envoi « à l'aveugle »
async function envoyerDemande(adresse, d) {
  try {
    if (/script\.google\.com/.test(adresse)) {
      await fetch(adresse, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) });
      return true;
    }
    const r = await fetch(adresse.replace(/\/$/, '') + '/v1/demandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    return r.ok;
  } catch (_) { return false; } // réseau coupé : la demande part par WhatsApp
}

// photo jointe → script Google Drive de ZTi : réduite à 1600 px en JPEG avant l'envoi ; renvoie le lien, ou '' si échec
async function envoyerPhoto(adresse, fichier, d) {
  try {
    const image = await createImageBitmap(fichier);
    const k = Math.min(1, 1600 / Math.max(image.width, image.height));
    const toile = document.createElement('canvas'); toile.width = Math.round(image.width * k); toile.height = Math.round(image.height * k);
    toile.getContext('2d').drawImage(image, 0, 0, toile.width, toile.height);
    const donnees = toile.toDataURL('image/jpeg', .82).split(',')[1];
    const arret = new AbortController(); setTimeout(() => arret.abort(), 30000);
    const r = await fetch(adresse, { method: 'POST', signal: arret.signal, headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'image/jpeg', donnees, organisation: d.organisation, nom: d.nom }) });
    const j = await r.json();
    return j.ok && /^https:\/\/drive\.google\.com\//.test(j.url) ? j.url : '';
  } catch (_) { return ''; } // photo illisible ou réseau coupé : la demande part quand même
}

/* ---------- avis des clients ---------- */
$$('form[data-avis]').forEach(form => {
  const groupe = $('[data-choix="note"]', form), etoiles = $$('button', groupe);
  const noter = n => { etoiles.forEach((b, i) => { b.setAttribute('aria-checked', String(i + 1 === n)); b.classList.toggle('allumee', i < n); }); groupe.closest('.champ').classList.remove('invalide'); };
  etoiles.forEach((b, i) => b.addEventListener('click', () => noter(i + 1)));
  groupe.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const i = etoiles.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = (i + (e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : -1) + 5) % 5; etoiles[n].focus(); noter(n + 1);
  });
  const caseAccord = $('[data-case="accord"]', form);
  caseAccord.addEventListener('click', () => { caseAccord.setAttribute('aria-checked', String(caseAccord.getAttribute('aria-checked') !== 'true')); caseAccord.closest('.champ').classList.remove('invalide'); });
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => i.closest('.champ')?.classList.remove('invalide')));

  let envoye = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (envoye || form.elements.site_web.value) return; // déjà envoyé, ou robot
    const v = n => (form.elements[n]?.value || '').trim();
    const note = etoiles.findIndex(b => b.getAttribute('aria-checked') === 'true') + 1;
    const erreurs = [];
    const marque = (n, ok) => { const c = $(`[data-champ="${n}"]`, form); c?.classList.toggle('invalide', !ok); if (!ok) erreurs.push(c); };
    marque('note', note > 0);
    marque('nom', v('nom').length >= 2);
    marque('texte', v('texte').length >= 10);
    marque('accord', caseAccord.getAttribute('aria-checked') === 'true');
    const msg = $('.message-erreur', form);
    if (erreurs.length) { msg.textContent = 'Quelques informations manquent : elles sont signalées ci-dessus.'; msg.hidden = false; erreurs[0].querySelector('input, textarea, button')?.focus(); return; }
    msg.hidden = true;

    const d = {
      type: 'avis', date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' }),
      note, nom: v('nom'), organisation: v('organisation'), texte: v('texte'), tel: v('tel'),
      page: form.dataset.page || location.pathname, adresse: location.href.split('#')[0],
    };
    const bouton = $('button[type="submit"]', form); bouton.disabled = true; envoye = true;
    let enregistre = false;
    if (form.dataset.endpoint) {
      try {
        const r = await fetch(form.dataset.endpoint.replace(/\/$/, '') + '/v1/avis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, accord: true }) });
        enregistre = r.ok;
      } catch (_) { /* réseau coupé : l'avis part par WhatsApp */ }
    }
    const merci = $('.avis-merci', form.parentElement);
    const texteWa = [`Bonjour ZTi, voici mon avis (${note}/5) :`, d.texte, `— ${d.nom}${d.organisation ? ', ' + d.organisation : ''}`].join('\n');
    if (!enregistre) {
      $('[data-texte]', merci).textContent = 'Dernière étape : appuyez sur « Envoyer par WhatsApp », votre avis part déjà rédigé.';
      const wa = $('[data-wa]', merci);
      if (form.dataset.wa) { wa.href = `https://wa.me/${form.dataset.wa.replace(/\D/g, '')}?text=${encodeURIComponent(texteWa)}`; wa.hidden = false; }
    }
    form.hidden = true; merci.hidden = false; merci.focus?.();
  });
});

/* ---------- page « Merci » ---------- */
const merci = $('[data-merci-page]');
if (merci) {
  // aperçu de test (branche corrections-test) : la page s'ouvre directement avec une demande d'exemple, pour la valider
  // sans remplir le formulaire ; sur le vrai site, elle ne s'affiche qu'après l'envoi d'un formulaire
  const apercu = /^corrections-test\./.test(location.hostname);
  const d = JSON.parse(sessionStorage.getItem('zti-demande') || 'null') || (apercu ? { enregistree: !/[?&]echec/.test(location.search), sujet: 'Diagnostic offert — établissement scolaire',
    wa: '237699324689', mail: 'zeltuminitiative@gmail.com', texte: "Bonjour ZTi, voici ma demande (exemple de l'aperçu) :\n• Établissement : Collège Exemple\n• Nom : M. EXEMPLE Jean (Directeur)" } : null);
  if (!d) location.replace(merci.dataset.accueil || '/');
  $$('[data-communaute]').forEach(a => a.addEventListener('click', () => suivi('Contact', { method: a.dataset.communaute })));
  if (d) {
    if (!d.enregistree) {
      $('[data-etiquette]', merci).textContent = 'Dernière étape';
      $('[data-titre]', merci).textContent = 'Envoyez votre demande à ZTi.';
      $('[data-texte]', merci).textContent = 'Votre demande est prête. Appuyez sur « Écrire sur WhatsApp » : elle part déjà rédigée.';
      $('[data-envoi-texte]', merci).hidden = true;
    }
    // un seul bouton : WhatsApp (le visiteur écrit le premier, sa demande part déjà rédigée)
    const wa = $('[data-wa]', merci);
    if (d.wa) { wa.href = `https://wa.me/${d.wa.replace(/\D/g, '')}?text=${encodeURIComponent(d.texte)}`; wa.hidden = false; }
    wa.addEventListener('click', () => suivi('Contact', { method: 'whatsapp' }));
    $('[data-envoi]', merci).hidden = false;
    // pluie de pétales sur les félicitations (comme à l'entrée des mariés), une seule fois, aux couleurs de ZTi
    if (d.enregistree && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const heros = merci.closest('section'), pluie = document.createElement('div');
      pluie.className = 'petales'; pluie.setAttribute('aria-hidden', 'true');
      const couleurs = ['#FFFFFF', '#E7ECFA', '#D7DCF3', '#9FD0FF', '#1565FF'];
      for (let i = 0; i < 46; i++) {
        const p = document.createElement('span'), taille = 9 + Math.random() * 12;
        p.style.cssText = `left:${Math.random() * 100}%;width:${taille}px;height:${taille * 1.35}px;background:${couleurs[i % couleurs.length]};`
          + `animation-delay:${(Math.random() * 2.6).toFixed(2)}s;animation-duration:${(4.2 + Math.random() * 2.6).toFixed(2)}s;`
          + `--derive:${Math.round(Math.random() * 160 - 80)}px;--tour:${Math.round(Math.random() * 540 + 180)}deg`;
        pluie.append(p);
      }
      heros.append(pluie);
      setTimeout(() => pluie.remove(), 10500);
    }
  }
}

/* ---------- lueur des cartes qui suit la souris ---------- */
if (matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', e => {
    const c = e.target.closest?.('.carte'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------- diagnostic en ligne (particuliers) ---------- */
$$('form[data-diagnostic]').forEach(form => {
  const etapes = $$('[data-etape]', form), progression = $('[data-progression]', form), barre = $('[data-barre]', form);
  const titres = ['Votre problème', 'Une précision', 'Votre appareil', 'Premier avis et contact'];
  const choix = {};
  let courante = 0;
  const erreurEtape = $('[data-erreur-etape]', form);
  const aller = n => {
    courante = n; erreurEtape.hidden = true;
    etapes.forEach((e, i) => { e.hidden = i !== n; });
    progression.textContent = `Étape ${n + 1} sur 4 · ${titres[n]}`;
    barre.style.width = `${(n + 1) * 25}%`;
    if (n === 1) $$('.diag-detail', form).forEach(d => { d.hidden = d.dataset.pour !== choix.probleme; });
    if (n === 3) $$('[data-avis]', form).forEach(a => { a.hidden = a.dataset.avis !== `${choix.probleme}|${choix.detail || ''}`; });
    const haut = form.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > haut) window.scrollTo({ top: haut, behavior: 'smooth' });
    const cible = n === 1 ? $(`.diag-detail[data-pour="${CSS.escape(choix.probleme || '')}"] button, .diag-detail[data-pour="${CSS.escape(choix.probleme || '')}"] textarea`, form) : $('button:not(.retour), input', etapes[n]);
    cible?.focus({ preventScroll: true });
    if (n > 0) window.ztiMesurer?.('formulaire', { valeur: n + 1, cible: form.dataset.sujet });
  };
  const signaler = texte => { erreurEtape.textContent = texte; erreurEtape.hidden = false; };
  // cartes et options : un seul choix par groupe ; certaines font avancer toutes seules
  $$('[data-groupe]', form).forEach(g => $$('button', g).forEach(b => b.addEventListener('click', () => {
    $$('button', g).forEach(x => x.setAttribute('aria-checked', String(x === b)));
    choix[g.dataset.groupe] = b.dataset.valeur;
    if (g.dataset.groupe === 'probleme') { choix.detail = ''; setTimeout(() => aller(1), 220); }
    if (g.dataset.groupe === 'detail') setTimeout(() => aller(2), 220);
  })));
  $$('[data-suivant]', etapes[1]).forEach(b => b.addEventListener('click', () => aller(2)));
  $$('[data-suivant]', etapes[2]).forEach(b => b.addEventListener('click', () => {
    if (!choix.appareil || !choix.duree) return signaler('Choisissez votre appareil et depuis quand le problème existe.');
    aller(3);
  }));
  $$('[data-retour]', form).forEach(b => b.addEventListener('click', () => aller(courante - 1)));

  const caseAccord = $('[data-case="accord"]', form);
  caseAccord.addEventListener('click', () => { caseAccord.setAttribute('aria-checked', String(caseAccord.getAttribute('aria-checked') !== 'true')); caseAccord.closest('.champ').classList.remove('invalide'); });
  const v = n => (form.elements[n]?.value || '').trim();
  const tel = form.elements.tel;
  tel.addEventListener('input', () => { const c = tel.value.replace(/\D/g, '').replace(/^237/, '').slice(0, 9); tel.value = c.replace(/(\d)(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/, (m, a, b, c2, d, e) => [a + b, c2, d, e].filter(Boolean).join(' ')); });
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => i.closest('.champ')?.classList.remove('invalide')));

  let envoi = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (envoi || form.elements.site_web.value) return;
    const erreurs = [];
    const marque = (n, ok) => { const c = $(`[data-champ="${n}"]`, form); c?.classList.toggle('invalide', !ok); if (!ok) erreurs.push(c); };
    marque('nom', v('nom').length >= 2);
    marque('tel', /^6\d{8}$/.test(v('tel').replace(/\D/g, '')));
    marque('email', !v('email') || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v('email')));
    marque('accord', caseAccord.getAttribute('aria-checked') === 'true');
    const msg = $('[data-etape="4"] .message-erreur', form);
    if (erreurs.length) { msg.textContent = 'Quelques informations manquent : elles sont signalées ci-dessus.'; msg.hidden = false; erreurs[0].querySelector('input, button')?.focus(); return; }
    msg.hidden = true;
    const chiffres = v('tel').replace(/\D/g, '');
    const resume = [choix.detail && `Précision : ${choix.detail}`, v('autre') && `Description : ${v('autre')}`, `Depuis : ${choix.duree}`, v('message')].filter(Boolean).join('\n');
    const d = {
      accord: true, sujet: form.dataset.sujet, profil: 'Particulier', nom: v('nom'),
      tel: '+237 ' + chiffres.replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'), email: v('email'), lieu: v('lieu'),
      postes: choix.appareil, situation: choix.detail || choix.probleme, besoins: [choix.probleme], moment: choix.moment || '', message: resume,
      page: form.dataset.page || location.pathname, campagne: form.dataset.campagne || '', adresse: location.href.split('#')[0],
      ...JSON.parse(sessionStorage.getItem(SOURCE) || '{}'), parrain: PARRAIN,
    };
    $('button[type="submit"]', form).disabled = true; envoi = true;
    const enregistree = form.dataset.endpoint ? await envoyerDemande(form.dataset.endpoint, d) : false;
    suivi('Lead', { content_name: d.sujet, content_category: d.campagne || d.page });
    const texte = [`Bonjour ZTi, voici mon diagnostic en ligne :`, `• Problème : ${choix.probleme}`, choix.detail && `• Précision : ${choix.detail}`,
      `• Appareil : ${choix.appareil}`, `• Depuis : ${choix.duree}`, v('autre') && `• Description : ${v('autre')}`,
      `• Nom : ${d.nom}`, `• Téléphone : ${d.tel}`, d.lieu && `• Lieu : ${d.lieu}`, d.moment && `• Meilleur moment : ${d.moment}`, v('message') && `• Message : ${v('message')}`]
      .filter(Boolean).join('\n');
    sessionStorage.setItem('zti-demande', JSON.stringify({ enregistree, texte, sujet: d.sujet, wa: form.dataset.wa, mail: form.dataset.mail }));
    location.href = form.dataset.merci;
  });
});

/* ---------- avis publiés (validés par ZTi dans le tableau de bord) ---------- */
$$('[data-avis-serveur]').forEach(async liste => {
  if (!SERVEUR) return;
  try {
    const avis = await (await fetch(SERVEUR + '/v1/avis')).json();
    if (!Array.isArray(avis) || !avis.length) return;
    for (const a of avis) {
      const carte = document.createElement('figure'); carte.className = 'carte avis-carte';
      const etoiles = document.createElement('span'); etoiles.className = 'etoiles'; etoiles.setAttribute('role', 'img'); etoiles.setAttribute('aria-label', a.note + ' sur 5');
      etoiles.textContent = '★★★★★'.slice(0, a.note) + '☆☆☆☆☆'.slice(0, 5 - a.note);
      const texte = document.createElement('blockquote'); texte.textContent = a.texte;
      const qui = document.createElement('figcaption'); const b = document.createElement('b'); b.textContent = a.nom; qui.append(b);
      if (a.organisation) { const o = document.createElement('span'); o.textContent = a.organisation; qui.append(o); }
      carte.append(etoiles, texte, qui); liste.append(carte);
    }
    liste.hidden = false;
    liste.closest('.avis')?.querySelector('.donner-avis')?.removeAttribute('open');
  } catch (_) { /* serveur injoignable : on garde la section telle quelle */ }
});

/* ---------- mesure d'audience maison (sans cookie) : pages, défilement, sections, clics, formulaires, sortie ---------- */
(() => {
  if (!SERVEUR || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  const chemin = location.pathname.replace(/^\/zti-site/, '') || '/';
  const source = JSON.parse(sessionStorage.getItem(SOURCE) || '{}');
  const envoyer = (evenement, extra = {}) => {
    const corps = JSON.stringify({ evenement, chemin, referent: document.referrer, parrain: PARRAIN, ...source, ...extra });
    if (!navigator.sendBeacon?.(SERVEUR + '/v1/visites', new Blob([corps], { type: 'text/plain' })))
      fetch(SERVEUR + '/v1/visites', { method: 'POST', body: corps, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  };
  window.ztiMesurer = (evenement, extra) => envoyer(evenement === 'etape2' ? 'formulaire' : evenement, evenement === 'etape2' ? { valeur: 2, ...extra } : extra);
  envoyer('vue');
  // défilement : 25, 50, 75, 100 %
  const paliers = [25, 50, 75, 100], atteints = new Set();
  let max = 0;
  const mesurerDefilement = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    max = Math.max(max, h > 0 ? Math.round(100 * scrollY / h) : 100);
    for (const p of paliers) if (max >= p && !atteints.has(p)) { atteints.add(p); envoyer('defilement', { valeur: p }); }
  };
  addEventListener('scroll', () => requestAnimationFrame(mesurerDefilement), { passive: true });
  // sections vues (ordre dans la page = valeur) : montre où les visiteurs décrochent
  if ('IntersectionObserver' in window) {
    const sections = $$('main section, body > section').filter(s => s.querySelector('h1, h2'));
    const vues = new Set();
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || vues.has(e.target)) return;
      vues.add(e.target); io.unobserve(e.target);
      const titre = (e.target.querySelector('.etiquette')?.textContent || e.target.querySelector('h1, h2').textContent).trim().slice(0, 70);
      envoyer('section', { cible: titre, valeur: sections.indexOf(e.target) + 1 });
    }), { threshold: .35 });
    sections.forEach(s => io.observe(s));
  }
  // clics : boutons, WhatsApp, appels, réseaux
  document.addEventListener('click', e => {
    const a = e.target.closest('a, button.btn, .diag-carte'); if (!a) return;
    const href = a.getAttribute('href') || '';
    const evenement = /wa\.me|whatsapp\.com/.test(href) ? (a.dataset.communaute ? 'communaute' : 'whatsapp') : href.startsWith('tel:') ? 'appel' : 'clic';
    if (evenement === 'clic' && !a.matches('.btn, .lien, .diag-carte, .reseau, .entete nav a, .carte')) return;
    envoyer(evenement, { cible: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70) });
  }, { capture: true });
  // formulaire commencé (1re action dans un formulaire de la page)
  $$('form[data-demande], form[data-diagnostic], form[data-avis]').forEach(f => f.addEventListener('pointerdown', () => envoyer('formulaire', { valeur: 1, cible: f.dataset.sujet || 'Avis' }), { once: true }));
  // sortie : temps passé sur la page
  const debut = Date.now();
  let parti = false;
  const sortie = () => { if (parti) return; parti = true; envoyer('sortie', { valeur: Math.round((Date.now() - debut) / 1000) }); };
  addEventListener('pagehide', sortie);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sortie(); });
})();
