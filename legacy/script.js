/*
  Morph botón → ventana con View Transitions (sin librerías).

  Apertura: el disparador y el panel comparten view-transition-name. Dentro de
  startViewTransition se quita el nombre al disparador y se abre el <dialog>, así
  el navegador anima el grupo desde el botón hasta la ventana.

  Cierre: el panel sale solo (grupo de salida) y el script mueve ese grupo hasta
  el disparador. En Calories el disparador nunca se oculta; en Money reaparece con
  su propio grupo (.morph-origin) debajo de la ventana que se encoge.

  Palabras e imágenes marcadas con data-morph-words / data-morph-item viajan como
  grupos propios entre el disparador y la ventana.
*/
(() => {
  const root = document.documentElement;
  const supportsTransitions = typeof document.startViewTransition === 'function';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const OPEN_MS = 700;
  const CLOSE_MS = 500;
  // Money anima el contenido hacia el origen en 2 s mientras el contenedor tarda 0.5 s.
  const CONTENT_CLOSE_MS = 2000;
  const OPEN_SURFACE_MS = 300;
  const FULL_RADIUS_MS = 1200;

  let activeTransition = null;
  let uid = 0;

  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const slow = () => parseFloat(cssVar('--slow')) || 1;

  // Lee una curva linear() de CSS para calcular posiciones intermedias en JS.
  function easingFromLinear(value) {
    const stops = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')')).split(',').map((stop, index, list) => {
      const [y, x] = stop.trim().split(/\s+/);
      return { y: parseFloat(y), x: x ? parseFloat(x) / 100 : index === 0 ? 0 : index === list.length - 1 ? 1 : NaN };
    });
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1], b = stops[i];
        if (t <= b.x) return a.y + (b.y - a.y) * (t - a.x) / (b.x - a.x);
      }
      return 1;
    };
  }

  let flowEase;
  const flow = (t) => (flowEase ||= easingFromLinear(cssVar('--ease-flow')))(t);

  function setName(element, name, className) {
    element.style.setProperty('view-transition-name', name);
    element.style.setProperty('view-transition-class', className);
  }

  function clearName(element) {
    element.style.removeProperty('view-transition-name');
    element.style.removeProperty('view-transition-class');
  }

  function splitWords(node) {
    const words = node.textContent.trim().split(/\s+/);
    node.replaceChildren(...words.flatMap((word, index) => {
      const span = document.createElement('span');
      span.className = 'morph-word';
      span.textContent = word;
      return index ? [document.createTextNode(' '), span] : [span];
    }));
  }

  function sharedPairs(origin, panel, base) {
    const pairs = [];
    origin.querySelectorAll('[data-morph-words]').forEach((source) => {
      const target = panel.querySelector(`[data-morph-words="${source.dataset.morphWords}"]`);
      if (!target) return;
      const from = source.querySelectorAll('.morph-word');
      const to = target.querySelectorAll('.morph-word');
      for (let i = 0; i < Math.min(from.length, to.length); i++) {
        pairs.push({ from: from[i], to: to[i], name: `${base}-word-${i}` });
      }
    });
    origin.querySelectorAll('[data-morph-item]').forEach((source) => {
      const target = panel.querySelector(`[data-morph-item="${source.dataset.morphItem}"]`);
      if (target) pairs.push({ from: source, to: target, name: `${base}-${source.dataset.morphItem}` });
    });
    return pairs;
  }

  function box(element) {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { x: left, y: top, w: width, h: height };
  }

  function surface(element) {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, radius: style.borderTopLeftRadius, shadow: style.boxShadow };
  }

  const lerpBox = (a, b, p) => ({
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    w: a.w + (b.w - a.w) * p,
    h: a.h + (b.h - a.h) * p,
  });

  // Las animaciones con fill se quedarían vivas tras la transición; se cancelan al terminar.
  let pseudoAnimations = [];

  function animatePseudo(pseudoElement, keyframes, { duration, ...options }) {
    const animation = root.animate(keyframes, { fill: 'both', ...options, duration: duration * slow(), pseudoElement });
    pseudoAnimations.push(animation);
    return animation;
  }

  function cancelPseudoAnimations() {
    pseudoAnimations.forEach((animation) => animation.cancel());
    pseudoAnimations = [];
  }

  function startTransition(update) {
    const transition = document.startViewTransition(update);
    activeTransition = transition;
    transition.finished.catch(() => {}).then(() => {
      if (activeTransition === transition) activeTransition = null;
    });
    return transition;
  }

  function cleanRoot() {
    delete root.dataset.morph;
    delete root.dataset.morphPhase;
  }

  // Money oculta el origen con opacity 160 ms ease mientras la ventana está abierta.
  function hideOrigin(origin) {
    origin.style.transition = `opacity ${160 * slow()}ms ease`;
    origin.style.opacity = '0';
  }

  // Devuelve la opacidad en el DOM. La reaparición animada (300 ms tras 200 ms) la hace
  // el grupo .morph-origin: si se animara aquí, Chrome atenuaría también las palabras
  // compartidas que viajan de vuelta, porque heredan la opacidad del botón.
  function showOrigin(origin) {
    if (!origin || !origin.style.opacity) return false;
    origin.style.transition = 'none';
    origin.style.opacity = '';
    requestAnimationFrame(() => { origin.style.transition = ''; });
    return true;
  }

  function animateOpen({ name, style, panel, from, fromSurface }) {
    const to = box(panel);
    const toSurface = surface(panel);
    const group = `::view-transition-group(${name})`;
    const flowCSS = cssVar('--ease-flow');

    // Flip con scale: true. El contenido conserva su tamaño final y se escala.
    animatePseudo(`::view-transition-new(${name})`, {
      width: [`${to.w}px`, `${to.w}px`],
      height: [`${to.h}px`, `${to.h}px`],
      transform: [`scale(${from.w / to.w}, ${from.h / to.h})`, 'scale(1, 1)'],
    }, { duration: OPEN_MS, easing: flowCSS });

    if (style !== 'money') return;

    // El contenedor arranca con el fondo, radio y sombra del disparador.
    animatePseudo(group, {
      backgroundColor: [fromSurface.background, toSurface.background],
      boxShadow: [fromSurface.shadow, 'none'],
    }, { duration: OPEN_SURFACE_MS, easing: flowCSS });

    const fullScreen = parseFloat(toSurface.radius) === 0;
    animatePseudo(group, { borderRadius: [fromSurface.radius, toSurface.radius] }, fullScreen
      ? { duration: FULL_RADIUS_MS, easing: cssVar('--ease-in-out-soft') }
      : { duration: OPEN_SURFACE_MS, easing: flowCSS });
  }

  function animateClose({ name, style, origin, from, fromSurface }) {
    const to = box(origin);
    const toSurface = surface(origin);
    const group = `::view-transition-group(${name})`;
    const image = `::view-transition-old(${name})`;
    const easing = cssVar(style === 'money' ? '--ease-flow' : '--ease-flow-close');

    animatePseudo(group, {
      transform: [`translate(${from.x}px, ${from.y}px)`, `translate(${to.x}px, ${to.y}px)`],
      width: [`${from.w}px`, `${to.w}px`],
      height: [`${from.h}px`, `${to.h}px`],
    }, { duration: CLOSE_MS, easing });

    const size = { width: `${from.w}px`, height: `${from.h}px` };

    if (style !== 'money') {
      animatePseudo(image, [
        { ...size, transform: 'scale(1, 1)' },
        { ...size, transform: `scale(${to.w / from.w}, ${to.h / from.h})` },
      ], { duration: CLOSE_MS, easing });
      return;
    }

    // El contenido viaja más lento que el contenedor y queda recortado por él.
    const steps = 24;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const container = lerpBox(from, to, flow(t));
      const content = lerpBox(from, to, flow(t * CLOSE_MS / CONTENT_CLOSE_MS));
      frames.push({
        ...size,
        offset: t,
        transform: `translate(${content.x - container.x}px, ${content.y - container.y}px) scale(${content.w / from.w}, ${content.h / from.h})`,
      });
    }
    animatePseudo(image, frames, { duration: CLOSE_MS, easing: 'linear' });

    animatePseudo(group, {
      backgroundColor: [fromSurface.background, toSurface.background],
      borderRadius: [fromSurface.radius, toSurface.radius],
      boxShadow: ['none', toSurface.shadow],
    }, { duration: CLOSE_MS, easing });
  }

  async function openMorph(dialog, origin) {
    if (activeTransition || dialog.open) return;
    const panel = dialog.querySelector('.morph-panel');
    const style = origin.dataset.morphStyle || 'money';
    dialog.morph = { origin, style };
    dialog.dataset.style = style;

    if (!supportsTransitions) {
      dialog.showModal();
      return;
    }

    const name = `morph-${++uid}`;
    const gentle = reducedMotion.matches;
    const pairs = gentle ? [] : sharedPairs(origin, panel, name);
    const from = box(origin);
    const fromSurface = surface(origin);

    if (gentle) {
      setName(panel, name, 'morph-fade');
    } else {
      setName(origin, name, 'morph');
      setName(panel, name, 'morph');
    }
    pairs.forEach((pair) => {
      setName(pair.from, pair.name, 'morph-item');
      setName(pair.to, pair.name, 'morph-item');
    });
    root.dataset.morph = style;
    root.dataset.morphPhase = 'open';

    const transition = startTransition(() => {
      clearName(origin);
      pairs.forEach((pair) => clearName(pair.from));
      if (style === 'money' && !gentle) hideOrigin(origin);
      dialog.showModal();
    });

    if (!gentle) {
      transition.ready
        .then(() => animateOpen({ name, style, panel, from, fromSurface }))
        .catch(() => {});
    }

    try {
      await transition.finished;
    } catch {
      // La transición se omitió; el DOM ya quedó en su estado final.
    } finally {
      clearName(panel);
      pairs.forEach((pair) => clearName(pair.to));
      cancelPseudoAnimations();
      cleanRoot();
    }
  }

  async function closeMorph(dialog) {
    if (!dialog.open || 'closing' in dialog.dataset) return;
    dialog.dataset.closing = '';

    try {
      if (activeTransition) await activeTransition.finished.catch(() => {});
      if (!dialog.open) return;

      const { origin, style = 'money' } = dialog.morph || {};
      const panel = dialog.querySelector('.morph-panel');
      const tint = dialog.querySelector('.morph-tint');
      const canAnimate = supportsTransitions && origin && origin.isConnected && origin.getClientRects().length > 0;

      if (!canAnimate) {
        dialog.close();
        showOrigin(origin);
        return;
      }

      const name = `morph-${++uid}`;
      const gentle = reducedMotion.matches;
      const pairs = gentle ? [] : sharedPairs(origin, panel, name);
      const from = box(panel);
      const fromSurface = surface(panel);

      setName(panel, name, gentle ? 'morph-fade' : 'morph-closing');
      setName(tint, `${name}-tint`, gentle ? 'morph-fade' : 'morph-tint');
      pairs.forEach((pair) => setName(pair.to, pair.name, 'morph-item'));
      root.dataset.morph = style;
      root.dataset.morphPhase = 'close';

      const transition = startTransition(() => {
        clearName(panel);
        clearName(tint);
        pairs.forEach((pair) => {
          clearName(pair.to);
          setName(pair.from, pair.name, 'morph-item');
        });
        dialog.close();
        if (showOrigin(origin) && !gentle) setName(origin, `${name}-origin`, 'morph-origin');
      });

      if (!gentle) {
        transition.ready
          .then(() => animateClose({ name, style, origin, from, fromSurface }))
          .catch(() => {});
      }

      try {
        await transition.finished;
      } catch {
        // Omitida: el diálogo ya está cerrado.
      } finally {
        clearName(origin);
        pairs.forEach((pair) => clearName(pair.from));
        cancelPseudoAnimations();
        cleanRoot();
      }
    } finally {
      delete dialog.dataset.closing;
    }
  }

  // Contenido de cada ventana según su disparador.
  const authNote = 'Demo local: el formulario no envía datos.';
  const prepare = {
    auth(dialog, trigger) {
      const signup = trigger.dataset.mode === 'signup';
      const label = signup ? 'Crear cuenta' : 'Iniciar sesión';
      const title = dialog.querySelector('[data-morph-words]');
      title.textContent = label;
      splitWords(title);
      dialog.querySelector('.auth-submit').textContent = label;
      dialog.querySelector('[name="password"]').autocomplete = signup ? 'new-password' : 'current-password';
      dialog.querySelector('.auth-note').textContent = authNote;
    },
    feature(dialog, trigger) {
      dialog.querySelector('.feature-media .art').className = `art ${trigger.dataset.art}`;
      dialog.querySelector('.feature-title').textContent = trigger.dataset.title;
      dialog.querySelector('.feature-text').textContent = trigger.dataset.text;
    },
    about() {},
  };

  document.querySelectorAll('[data-morph-words]').forEach(splitWords);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-morph]');
    if (trigger) {
      const dialog = document.getElementById(trigger.dataset.morph);
      if (!dialog || dialog.open || activeTransition) return;
      prepare[trigger.dataset.morph]?.(dialog, trigger);
      openMorph(dialog, trigger);
      return;
    }
    const closer = event.target.closest('[data-close]');
    if (closer) closeMorph(closer.closest('dialog'));
  });

  document.querySelectorAll('.morph-dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.classList.contains('morph-tint')) closeMorph(dialog);
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMorph(dialog);
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeMorph(dialog);
    });
    // Si el navegador cerró el diálogo sin pasar por closeMorph, devuelve el origen.
    dialog.addEventListener('close', () => {
      if (!('closing' in dialog.dataset)) showOrigin(dialog.morph?.origin);
    });
  });

  document.querySelector('.auth-form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.querySelector('.auth-note').textContent = 'Listo. En esta demo no se envía nada.';
  });

  document.getElementById('slow').addEventListener('change', (event) => {
    root.classList.toggle('is-slow', event.target.checked);
  });
})();
