#!/bin/sh
# Runtime command for the container. Fills the nginx template from the
# environment and hands over to nginx in the foreground.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
app_dir=$(dirname "$here")

PORT="${PORT:-80}"
SITE_ROOT="${SITE_ROOT:-$app_dir/apps/docs/dist}"

if [ ! -f "$SITE_ROOT/index.html" ]; then
  echo "start: no built site at $SITE_ROOT." >&2
  echo "start: the build phase should have run 'pnpm build' from the repository root." >&2
  exit 1
fi

mkdir -p /tmp/nginx

sed -e "s|__PORT__|$PORT|g" -e "s|__ROOT__|$SITE_ROOT|g" \
  "$here/nginx.conf.template" > /tmp/nginx/nginx.conf

echo "start: serving $SITE_ROOT on port $PORT"

exec nginx -c /tmp/nginx/nginx.conf -g 'daemon off;'
