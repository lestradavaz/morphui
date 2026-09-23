import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/*
 * The production origin is the default rather than an empty value, because a
 * build with no site ships every page noindex and a `Disallow: /` robots file —
 * the site deploys, looks right, and is invisible. Override SITE_URL for a
 * preview or a different host.
 */
const site = process.env.SITE_URL ?? 'https://morphui.lestradavaz.com';
if (!/^https?:\/\//.test(site)) throw new Error('SITE_URL must be an absolute HTTP(S) URL');

export default defineConfig({
  site,
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
  build: { format: 'file' },
  integrations: [react(), sitemap({ filter: page => !/\/(404|robots\.txt)(\.html)?$/.test(page) })],
  vite: { plugins: [tailwindcss()], ssr: { noExternal: ['@lestradavaz/morph-ui', 'gsap'] } },
});
