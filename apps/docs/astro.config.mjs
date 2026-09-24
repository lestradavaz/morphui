import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';

/*
 * The production origin is the default rather than an empty value, because a
 * build with no site ships every page noindex and a `Disallow: /` robots file —
 * the site deploys, looks right, and is invisible. Override SITE_URL for a
 * preview or a different host.
 */
const site = process.env.SITE_URL ?? 'https://morphui.lestradavaz.com';
if (!/^https?:\/\//.test(site)) throw new Error('SITE_URL must be an absolute HTTP(S) URL');
const sentrySourceMapsReady = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default defineConfig({
  site,
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
  build: { format: 'file' },
  integrations: [react(), sitemap({ filter: page => !/\/(404|robots\.txt)(\.html)?$/.test(page) }), sentry({ enabled: { client: true, server: false }, sourcemaps: { disable: !sentrySourceMapsReady, filesToDeleteAfterUpload: ['./dist/**/*.map'] } })],
  vite: { plugins: [tailwindcss()], ssr: { noExternal: ['@lestradavaz/morph-ui', 'gsap'] } },
});
