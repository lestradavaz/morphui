/*
 * Frame profiler — paste into the console of any page, then drive the animation.
 *
 * Works on the legacy prototype and on the React playground alike, so the two
 * are measured the same way. Records how long each frame actually took, which is
 * what "it feels smoother" resolves to, plus long tasks and any layout
 * thrashing the browser reports.
 *
 *   1. paste this
 *   2. open and close the panel three or four times
 *   3. __profile.stop()
 */
(() => {
  if (window.__profile) window.__profile.stop(true);

  const frames = [];
  const longTasks = [];
  let last = performance.now();
  let raf = 0;
  let observer = null;

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(Math.round(entry.duration));
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    /* Long tasks are not reported everywhere; frame times still are. */
  }

  const tick = (now) => {
    frames.push(now - last);
    last = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  window.__profile = {
    stop(quiet) {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      delete window.__profile;
      if (quiet) return;

      // The first frame measures the gap since paste, not a real frame.
      const sample = frames.slice(1).filter((d) => d > 0 && d < 2000);
      if (sample.length < 10) {
        console.warn('Not enough frames. Paste again and drive the animation before stopping.');
        return;
      }
      const sorted = [...sample].sort((a, b) => a - b);
      const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
      const mean = sample.reduce((a, b) => a + b, 0) / sample.length;

      // A 120Hz display wants 8.3ms, a 60Hz one 16.7ms. Anything past 20ms is a
      // frame the user had time to notice.
      const janky = sample.filter((d) => d > 20);
      const result = {
        frames: sample.length,
        'mean ms': +mean.toFixed(2),
        'median ms': +at(0.5).toFixed(2),
        'p95 ms': +at(0.95).toFixed(2),
        'worst ms': +sorted[sorted.length - 1].toFixed(2),
        'implied fps': Math.round(1000 / mean),
        'frames over 20ms': janky.length,
        'jank %': +((janky.length / sample.length) * 100).toFixed(1),
        'long tasks': longTasks.length,
        'longest task ms': longTasks.length ? Math.max(...longTasks) : 0,
      };
      console.table(result);
      return result;
    },
  };

  console.log('Profiling. Open and close the panel a few times, then run __profile.stop()');
})();
