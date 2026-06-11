// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  // Preact renderiza las islas interactivas (componentes .tsx).
  integrations: [preact()],
  // Completar cuando exista el repo en GitHub. Con un repo llamado
  // <usuario>.github.io el sitio se sirve desde la raíz y no hace falta `base`.
  // site: 'https://tu-usuario.github.io',
});
