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

The build path has to be the repository root. The site imports the `morphui`
package from the workspace and packs it into a tarball during its build, so a
build scoped to `apps/docs` has no package to point at.

### Environment

| Variable | Required | Effect |
| --- | --- | --- |
| `SITE_URL` | **yes** | Absolute URL, e.g. `https://morphui.dev`. Sets canonical links, `og:url` and the sitemap. |
| `PORT` | no | Port nginx listens on. Default `80`. |
| `SITE_ROOT` | no | Directory to serve. Defaults to the built site. |

`SITE_URL` is not optional in practice. Without it Astro has no site, so every
page is built with `noindex, nofollow` and `robots.txt` is generated as
`Disallow: /`. The site would deploy and look correct while being invisible to
search engines. It must be set at **build** time, not just at runtime, because
the tag is baked into the HTML.

## What the build runs

```
pnpm install --frozen-lockfile
pnpm build                    # turbo: package, then the site
```

`pnpm build` at the root builds `packages/morphui` first, then the docs site,
which runs `astro build` and packs the built package into
`public/downloads/morphui-0.0.0.tgz` so the installation page has something real
to hand out. That tarball lands in the image along with the rest of the site.

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
