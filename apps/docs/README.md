# MorphUI documentation

Astro documentation and live React previews, styled with Tailwind CSS 4 and the
package's Atrium tokens. The site stays in Ink; each preview has its own color,
light/dark mode and slow-motion control.

## Run locally

```bash
pnpm --filter @morphui/docs dev
# http://localhost:4321
```

The script builds and packs `@lestradavaz/morph-ui` before starting Astro. The installation page
links to that exact local tarball. No npm publication is performed.

```bash
pnpm --filter @morphui/docs build
pnpm --filter @morphui/docs typecheck
pnpm test:docs
```

## Architecture

The folder responsibilities follow portfolio-2026: layouts contain the shell and
metadata, components implement sections and controls, core contains the typed
catalog, and pages handle routing. Markdown content lives in an Astro content
collection with a validated schema. Component examples are imported as source
text from the same files used in live previews.

Documentation is static HTML. React hydrates only the demonstrations, search,
package-manager selector and theme explorer. There is no API or request-time
fetching because all current content belongs to the repository. An SSR adapter
can be added if a future feature actually requires request-time data.

This project consumes the package's built exports, exercising the same boundary
as an installed application. Rebuild the package after editing its source. The
separate playground still aliases package source for animation development.

## Preview and deployment metadata

Until a domain is chosen, pages emit `noindex` and robots.txt disallows crawling.
No canonical or sitemap claims a placeholder domain. To build for a real domain:

```bash
SITE_URL=https://your-domain.example pnpm --filter @morphui/docs build
```

This enables canonical URLs, Open Graph URLs and sitemap generation. Serve `dist`
with clean URLs resolving `/docs/installation` to `/docs/installation.html`.
The documentation includes no invented repository URL or package release claims.

## Design and UX

PRODUCT.md and DESIGN.md record the approved Atrium direction. The documentation
uses familiar navigation and consistent controls, keeps installation tasks
chunked, and demonstrates motion before explaining implementation. These apply
the familiarity, proximity and cognitive-load principles requested for the site.

References: [Astro content collections](https://docs.astro.build/en/guides/content-collections/),
[React islands](https://docs.astro.build/en/guides/integrations-guide/react/),
[Tailwind integration](https://tailwindcss.com/docs/installation/framework-guides/astro),
and [Laws of UX](https://lawsofux.com/es/).
