import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL;
if (site && !/^https?:\/\//.test(site)) throw new Error('SITE_URL must be an absolute HTTP(S) URL');

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
  build: { format: 'file' },
  integrations: [react(), ...(site ? [sitemap({ filter: page => !/\/(404|robots\.txt)(\.html)?$/.test(page) })] : [])],
  vite: { plugins: [tailwindcss()], ssr: { noExternal: ['morphui', 'gsap'] } },
});
