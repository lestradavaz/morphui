import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: import.meta.env.PROD && Boolean(dsn),
});
