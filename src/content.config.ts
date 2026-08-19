import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    etiquetas: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
    // Marca las entradas de ejemplo; se muestran con una insignia "borrador".
    borrador: z.boolean().default(false),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
  }),
});

// Cada entrada es una edición (o un tramo) del Boletín Oficial, generada por el
// scraper de `escraper_boletin_oficial`: no se escriben a mano.
const boletin = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/boletin' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    desde: z.coerce.date(),
    hasta: z.coerce.date(),
    etiquetas: z.array(z.string()).default([]),
    cantidad: z.number().default(0),
    publicados: z.number().default(0),
  }),
});

export const collections = { proyectos, boletin };
