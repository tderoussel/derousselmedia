// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://derousselmedia.com',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'never',
    assets: '_astro',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
