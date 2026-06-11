import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
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

export const collections = { proyectos };
