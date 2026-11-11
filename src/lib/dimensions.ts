// Dimensions réelles d'une image de public/, lues au moment de la construction du site.
// Elles sont écrites dans <img width height> : le navigateur réserve la place avant l'arrivée de l'image, la page ne
// « saute » plus pendant le chargement (indicateur CLS de Google). Formats lus : JPEG, PNG, GIF, WebP.
import fs from 'node:fs';
import path from 'node:path';

type Dim = { width?: number; height?: number };
const memoire = new Map<string, Dim>();

function lire(b: Buffer): Dim | null {
  if (b.length < 30) return null;
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };          // PNG
  if (b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };          // GIF
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {                              // WebP
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (t === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }; }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {                                                                              // JPEG
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

const fichier = (src: string) => path.join(process.cwd(), 'public', src.split('?')[0].replace(/^\/+/, ''));

/** { width, height } d'une image du site (vide si l'image est externe ou illisible : rien ne casse). */
export function dim(src?: string): Dim {
  if (!src || /^(https?:)?\/\//.test(src)) return {};
  if (memoire.has(src)) return memoire.get(src)!;
  let r: Dim = {};
  try { r = lire(fs.readFileSync(fichier(src))) || {}; } catch { r = {}; }
  memoire.set(src, r);
  return r;
}

/** Vignette légère d'une image (« nom-vignette.webp », sinon « nom-vignette.jpg ») si elle existe, sinon l'image elle-même.
 *  L'image d'origine reste celle qui s'ouvre en grand dans la visionneuse. */
export function vignette(src?: string): string | undefined {
  if (!src) return src;
  for (const v of [src.replace(/\.[a-z0-9]+$/i, '-vignette.webp'), src.replace(/(\.[a-z0-9]+)$/i, '-vignette$1')]) {
    try { if (fs.existsSync(fichier(v))) return v; } catch { /* rien */ }
  }
  return src;
}
