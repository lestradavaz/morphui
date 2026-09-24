import * as Sentry from '@sentry/astro';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
const enabled = Boolean(dsn);
const feedback = Sentry.feedbackIntegration({
  autoInject: false,
  formTitle: 'Share feedback',
});

Sentry.init({
  dsn,
  enabled,
  integrations: [feedback],
});

if (enabled) {
  /* The footer trigger is a new element on every page the router swaps in, so
     the form is attached again on each page load and the previous one released. */
  let detach: (() => void) | undefined;
  document.addEventListener('astro:page-load', () => {
    detach?.();
    detach = undefined;
    const trigger = document.querySelector('#feedback-trigger');
    if (!trigger) return;

    detach = feedback.attachTo(trigger);
    trigger.addEventListener('click', event => event.preventDefault());
  });
}
