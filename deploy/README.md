# Deploying the documentation site

The site is static. Nixpacks builds it with pnpm and turbo, and the runtime
image serves the result with nginx.

```
nixpacks.toml            build and start phases
deploy/nginx.conf.template   server config, port and root filled in at start
deploy/start.sh          writes the config from the environment, runs nginx
```

## Dokploy settings

| Setting | Value |
| --- | --- |
| Build type | Nixpacks |
| Build path | `/` — the repository root |
| Port | whatever you set in `PORT`, `80` by default |
| Domain | your hostname, TLS through Dokploy's Traefik |

The build path has to be the repository root. The site imports the `@lestradavaz/morph-ui`
package from the workspace and packs it into a tarball during its build, so a
build scoped to `apps/docs` has no package to point at.

### Environment

| Variable | Required | Effect |
| --- | --- | --- |
| `SITE_URL` | no | Absolute URL. Defaults to `https://morphui.lestradavaz.com`. |
| `PUBLIC_SENTRY_DSN` | for error monitoring and feedback | Public DSN from the `morphui` Sentry project. Set at build time. |
| `SENTRY_AUTH_TOKEN` | no | Build-only token for source map upload. |
| `SENTRY_ORG` | no | Sentry organization slug for source map upload. |
| `SENTRY_PROJECT` | no | Sentry project slug for source map upload: `morphui`. |
| `PORT` | no | Port nginx listens on. Default `80`. |
| `SITE_ROOT` | no | Directory to serve. Defaults to the built site. |

Nothing has to be set for the production deploy. `SITE_URL` exists so a preview
or a second host can be built without the canonical links pointing at production.
Set `PUBLIC_SENTRY_DSN` in the build environment to capture browser errors and
open the Sentry feedback form from the homepage. Without it, the feedback link
opens a new GitHub issue.
Source map upload runs only when all three `SENTRY_*` variables above are set.
Keep the auth token in the build environment; never expose it as a `PUBLIC_` variable.

It must be read at **build** time, not runtime: the canonical tag, `og:url` and
the sitemap are baked into the HTML and `robots.txt`. Astro treats a build with
no site as "not for indexing", so every page would ship `noindex, nofollow` and
`robots.txt` would be `Disallow: /` — the site would deploy and look correct
while being invisible to search engines. That is why the origin is a default in
`astro.config.mjs` rather than an empty value.

## What the build runs

```
pnpm install --frozen-lockfile
pnpm build                    # turbo: package, then the site
```

`pnpm build` at the root builds `packages/morphui` first, then the docs site,
which runs `astro build`. The site imports the library from that build output,
so the order matters; it no longer ships a tarball, because the package is on
npm and the installation page points there.

## How requests are served

Astro writes `docs/installation.html` for the URL `/docs/installation`, and the
site links to the short form. The server tries, in order:

```
$uri  →  $uri.html  →  $uri/index.html  →  404
```

which is what makes the clean URLs resolve. `dist/404.html` is the error page.

Hashed build assets under `/_astro/` are served `immutable` for a year; HTML is
revalidated every time so a deploy takes effect immediately.

## Running it without Dokploy

Nixpacks is the only thing Dokploy-specific here. Any host with nginx works:

```bash
pnpm build
PORT=8080 sh deploy/start.sh
```

## Not verified

The container has not been built here — neither Nixpacks nor Docker was
available on the machine this was written on. What was checked: the build
output's directory layout against the server rules, the placeholder
substitution, the preflight failure when the site is missing, and the config's
block structure. The first deploy is the real test.

If the build fails, the usual cause is a nixpkgs attribute name in
`[phases.setup]`. Check it can resolve `nodejs_22`, `pnpm` and `nginx` at the
pinned revision; if not, the image's builder log names the attribute it could
not find.
