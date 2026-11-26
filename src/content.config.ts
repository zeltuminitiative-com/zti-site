// Contenus du site : tout ce que l'équipe ZTi modifie dans Pages CMS (.pages.yml) est dans contenu/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// une section de page (bloc Pages CMS) : son type, puis ses champs propres (lus par src/components/Sections.astro)
const section = z.looseObject({ type: z.string() });

const page = z.object({
  titre: z.string(),
  description: z.string().default(''),
  image_partage: z.string().optional(),
  sections: z.array(section).default([]),
  // barre du haut réduite au logo (sans menu ni bouton), comme la page école : ex. page « Travailler avec ZTi »
  entete_simple: z.boolean().default(false),
});

const pages = defineCollection({ loader: glob({ pattern: '*.md', base: './contenu/pages' }), schema: page });

const campagnes = defineCollection({
  loader: glob({ pattern: '*.md', base: './contenu/campagnes' }),
  schema: page.extend({
    en_ligne: z.boolean().default(false),
    public: z.string().default(''),
    sans_menu: z.boolean().default(true),
    // référencement : titre affiché dans Google, et service présenté (données structurées schema.org)
    titre_google: z.string().optional(),
    service: z.object({
      nom: z.string().optional(),
      description: z.string().optional(),
      zone: z.string().optional(),
      offre: z.string().optional(),
    }).optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './contenu/services' }),
  schema: z.object({
    titre: z.string(),
    accroche: z.string().default(''),
    resume: z.string().default(''),
    image: z.string().optional(),
    // image d'aperçu du lien partagé (WhatsApp, Facebook), 1200 × 630 ; ex. capture du héro de Protection ZTi (26/11)
    image_partage: z.string().optional(),
    publics: z.array(z.string()).default([]),
    points: z.array(z.string()).default([]),
    campagne: z.string().optional(),
    ordre: z.number().default(50),
    en_ligne: z.boolean().default(true),
    // sections facultatives sous le texte (mêmes blocs que les pages), ex. page Protection ZTi (24/11)
    sections: z.array(section).default([]),
    // formulaire « Parlons de votre besoin. » en bas de page ; false : remplacé par une section de la page (ex. Protection ZTi, 25/11)
    formulaire: z.boolean().default(true),
    // titre et texte du formulaire, à la place de « Parlons de votre besoin. » (ex. Protection ZTi, 25/11)
    // étiquette et titre de la section d'introduction (sous l'en-tête), ex. Protection ZTi (25/11)
    intro_etiquette: z.string().optional(),
    intro_titre: z.string().optional(),
    formulaire_titre: z.string().optional(),
    formulaire_texte: z.string().optional(),
  }),
});

const reglages = defineCollection({
  loader: glob({ pattern: '*.yml', base: './contenu/reglages' }),
  schema: z.looseObject({}),
});

export const collections = { pages, campagnes, services, reglages };
