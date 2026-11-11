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
    publics: z.array(z.string()).default([]),
    points: z.array(z.string()).default([]),
    campagne: z.string().optional(),
    ordre: z.number().default(50),
    en_ligne: z.boolean().default(true),
  }),
});

const reglages = defineCollection({
  loader: glob({ pattern: '*.yml', base: './contenu/reglages' }),
  schema: z.looseObject({}),
});

export const collections = { pages, campagnes, services, reglages };
