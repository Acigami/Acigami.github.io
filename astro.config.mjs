// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  // Preact renderiza las islas interactivas (componentes .tsx).
  integrations: [preact()],
  site: 'https://acigami.github.io',
});
