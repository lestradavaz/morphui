/*
 * Animation inventory — paste into either page, then open the panel once.
 *
 * Frame timing already says the two versions perform the same, so what is left
 * is choreography: which properties move, for how long, on what curve. This
 * prints that as a table from both sides, so the difference can be read off
 * rather than guessed at.
 *
 * On the reference it hooks startViewTransition and lists the browser's own
 * animations on the view-transition pseudo-elements. On the port it lists the
 * GSAP tweens. Same columns either way.
 */
(() => {
  const round = (n) => (typeof n === 'number' ? Math.round(n) : n);

  function describeTarget(effect) {
    const t = effect.target;
    if (!t) return '(none)';
    const pseudo = effect.pseudoElement ? effect.pseudoElement : '';
    const name = t.tagName ? t.tagName.toLowerCase() : String(t);
    const cls = t.classList && t.classList.length ? '.' + [...t.classList].join('.') : '';
    return pseudo || name + cls;
  }

  function fromWebAnimations() {
    const rows = document.getAnimations().map((a) => {
      const e = a.effect;
      const timing = e.getTiming();
      let frames = [];
      try {
        frames = e.getKeyframes().map((k) => {
          const { offset, computedOffset, easing, composite, ...props } = k;
          return Object.keys(props).length ? Object.keys(props).join(',') : '';
        });
      } catch {
        /* some effects refuse introspection */
      }
      return {
        target: describeTarget(e),
        properties:
          [...new Set(frames.filter(Boolean).join(',').split(','))].join(' ') ||
          (a.animationName ? `@${a.animationName}` : ''),
        'duration ms': round(timing.duration),
        'delay ms': round(timing.delay),
        easing: String(timing.easing).slice(0, 44),
      };
    });
    return rows.filter((r) => r.properties || r['duration ms']);
  }

  function fromGsap(gsap) {
    return gsap.globalTimeline
      .getChildren(true, true, false)
      .map((tween) => {
        const targets = tween.targets ? tween.targets() : [];
        const first = targets[0];
        const name = first && first.tagName ? first.tagName.toLowerCase() : '(object)';
        const cls = first && first.classList && first.classList.length ? '.' + [...first.classList].join('.') : '';
        const vars = { ...tween.vars };
        for (const k of ['duration', 'ease', 'delay', 'onUpdate', 'onComplete', 'callbackScope', 'data', 'runBackwards', 'immediateRender', 'startAt', 'stagger', 'inherit', 'parent']) delete vars[k];
        return {
          target: name + cls,
          properties: Object.keys(vars).join(' '),
          'duration ms': round(tween.duration() * 1000),
          'delay ms': round(tween.delay() * 1000),
          easing: String(tween.vars.ease ?? 'default').slice(0, 44),
        };
      })
      .filter((r) => r['duration ms'] > 0);
  }

  const gsap = window.__gsap;
  if (gsap) {
    /*
     * GSAP drops a tween from the global timeline as soon as it finishes, so
     * reading after the animation returns an empty list. Sample every frame
     * while it runs instead, and dedupe.
     */
    const seen = new Map();
    let raf = 0;
    const sample = () => {
      // GSAP tweens AND the browser's own animations. Half of this port's
      // choreography is CSS driven by a class the engine toggles, and a
      // GSAP-only listing is blind to it - which is exactly the row that looked
      // missing when the two inventories were first compared.
      const rows = [
        ...fromGsap(gsap).map((r) => ({ ...r, via: 'gsap' })),
        ...fromWebAnimations().map((r) => ({ ...r, via: 'css' })),
      ];
      for (const row of rows) seen.set(`${row.via}|${row.target}|${row.properties}|${row['duration ms']}`, row);
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);

    console.log('Recording. Open the panel, wait for it to settle, then run __inventory()');
    window.__inventory = () => {
      cancelAnimationFrame(raf);
      const rows = [...seen.values()].sort((a, b) => a.target.localeCompare(b.target));
      console.table(rows);
      return rows;
    };
    return;
  }

  if (typeof document.startViewTransition !== 'function') {
    console.warn('Neither GSAP nor view transitions found on this page.');
    return;
  }

  const original = document.startViewTransition.bind(document);
  document.startViewTransition = (cb) => {
    const transition = original(cb);
    transition.ready.then(() => {
      // One frame in, so the browser has built its pseudo-element animations.
      requestAnimationFrame(() => {
        const rows = fromWebAnimations();
        console.log('%cview transition inventory', 'font-weight:bold');
        console.table(rows);
        window.__lastInventory = rows;
      });
    }).catch(() => {});
    return transition;
  };
  console.log('Hooked. Open the panel once and the inventory prints itself.');
})();
