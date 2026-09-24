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
  const attachFeedback = () => {
    const trigger = document.querySelector('#feedback-trigger');
    if (!trigger) return;

    feedback.attachTo(trigger);
    trigger.addEventListener('click', event => event.preventDefault());
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachFeedback, { once: true });
  } else {
    attachFeedback();
  }
}
