/**
 * ZTi — photos jointes aux demandes de diagnostic → Google Drive
 *
 * Le formulaire du site envoie la photo (déjà réduite à 1600 px, JPEG) à ce script.
 * Le script la range dans le dossier « ZTi — photos des demandes » de votre Google Drive
 * et renvoie le lien, qui est ajouté à la demande (tableau de bord et message WhatsApp).
 * Les photos restent privées : seul le propriétaire du Drive (ZTi) peut les ouvrir.
 *
 * Installation (une seule fois, avec le compte Google de ZTi) :
 *  1. https://script.google.com → Nouveau projet → nommez-le « ZTi photos demandes ».
 *  2. Remplacez tout le code par ce fichier, puis Enregistrer.
 *  3. Déployer → Nouveau déploiement → type « Application Web » :
 *       Exécuter en tant que : Moi
 *       Qui a accès : Tout le monde
 *     → Déployer, puis autorisez l'accès à Google Drive (c'est votre propre script).
 *  4. Copiez l'« URL de l'application Web » (elle finit par /exec) et collez-la dans
 *     Pages CMS › Réglages du site › Demandes et mesure d'audience › Photos des demandes (Google Drive).
 *     Tant que ce champ est vide, la case photo n'apparaît pas dans le formulaire.
 */

const DOSSIER = 'ZTi — photos des demandes';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 4 * 1024 * 1024; // 4 Mo après décodage

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (!TYPES.includes(d.type)) return reponse({ ok: false, erreur: 'type' });
    const octets = Utilities.base64Decode(String(d.donnees || ''));
    if (!octets.length || octets.length > TAILLE_MAX) return reponse({ ok: false, erreur: 'taille' });
    // le vrai contenu doit être une image (signature JPEG, PNG ou WEBP), pas seulement le type annoncé
    const debut = octets.slice(0, 12).map(o => (o + 256) % 256);
    const jpeg = debut[0] === 0xFF && debut[1] === 0xD8, png = debut[0] === 0x89 && debut[1] === 0x50,
      webp = debut[8] === 0x57 && debut[9] === 0x45 && debut[10] === 0x42 && debut[11] === 0x50;
    if (!jpeg && !png && !webp) return reponse({ ok: false, erreur: 'contenu' });

    // anti-abus : 30 photos par heure au plus, tous visiteurs confondus
    const cache = CacheService.getScriptCache(), cle = 'photos-' + Math.floor(Date.now() / 3600000);
    const n = Number(cache.get(cle) || 0);
    if (n >= 30) return reponse({ ok: false, erreur: 'limite' });
    cache.put(cle, String(n + 1), 3700);

    const propre = s => String(s || '').replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 60);
    const date = Utilities.formatDate(new Date(), 'Africa/Douala', 'yyyy-MM-dd HH-mm');
    const nom = `${date} — ${propre(d.organisation) || 'Établissement'} — ${propre(d.nom) || 'Contact'}.${png ? 'png' : webp ? 'webp' : 'jpg'}`;
    const fichier = dossier().createFile(Utilities.newBlob(octets, d.type, nom));
    return reponse({ ok: true, url: fichier.getUrl() });
  } catch (err) {
    return reponse({ ok: false, erreur: 'serveur' });
  }
}

function dossier() {
  const liste = DriveApp.getFoldersByName(DOSSIER);
  return liste.hasNext() ? liste.next() : DriveApp.createFolder(DOSSIER);
}

function reponse(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
