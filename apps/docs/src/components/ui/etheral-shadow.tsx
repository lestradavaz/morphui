'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { watchViewport } from '@/core/viewport';

interface ShadowOverlayProps {
  sizing?: 'fill' | 'stretch';
  color?: string;
  /** `scale` is how wide the folds are and how far they travel, `speed` how fast they churn. 1-100. */
  animation?: { scale: number; speed: number };
  style?: CSSProperties;
  className?: string;
}

const MASK = '/images/ethereal-shadow.webp';
const MASK_ASPECT = 1920 / 1079;

const mapRange = (value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) =>
  fromLow === fromHigh ? toLow : toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow);

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * .5 + .5;
  gl_Position = vec4(a_position, 0., 1.);
}`;

/*
 * The source effect displaces the mask with an feTurbulence field and animates
 * that field, which is a per-pixel recomputation every frame — 40-90ms of main
 * thread each time it was measured. The same maths belongs in a fragment
 * shader: simplex noise stands in for the turbulence, and the two chained
 * displacements mirror the two feDisplacementMap stages.
 */
const FRAGMENT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_mask;
uniform vec2 u_cover;
uniform vec2 u_frequency;
uniform vec2 u_amplitude;
uniform vec2 u_texel;
uniform vec3 u_color;
uniform float u_time;

// Simplex noise, Ashima Arts / Stefan Gustavson (MIT).
vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec4 mod289(vec4 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec4 permute(vec4 x) { return mod289(((x * 34.) + 1.) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - .85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1. / 6., 1. / 3.);
  const vec4 D = vec4(0., .5, 1., 2.);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1. - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0., i1.z, i2.z, 1.))
    + i.y + vec4(0., i1.y, i2.y, 1.))
    + i.x + vec4(0., i1.x, i2.x, 1.));
  float n_ = .142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49. * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7. * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1. - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2. + 1.;
  vec4 s1 = floor(b1) * 2. + 1.;
  vec4 sh = -step(h, vec4(0.));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.);
  m = m * m;
  return 42. * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// feTurbulence type="turbulence": the fractal sum of absolute noise.
float turbulence(vec3 p) { return abs(snoise(p)) * .66 + abs(snoise(p * 2.)) * .34; }

// Stands in for the filter's trailing blur(4px), which softened the seams the
// displacement opens up.
float mask(vec2 uv) {
  return (texture2D(u_mask, uv).a * 2.
    + texture2D(u_mask, uv + vec2(u_texel.x, 0.)).a
    + texture2D(u_mask, uv - vec2(u_texel.x, 0.)).a
    + texture2D(u_mask, uv + vec2(0., u_texel.y)).a
    + texture2D(u_mask, uv - vec2(0., u_texel.y)).a) / 6.;
}

void main() {
  vec2 base = (v_uv - .5) * u_cover + .5;
  vec3 p = vec3(v_uv * u_frequency, u_time);
  vec2 first = vec2(turbulence(p) - .5, turbulence(p + 31.4) - .5);
  vec2 uv = base + first * u_amplitude;
  vec3 q = vec3(uv * u_frequency * 1.7, u_time * .85 + 5.1);
  vec2 second = vec2(snoise(q), snoise(q + 17.2));
  uv += second * u_amplitude * .35;
  float a = mask(clamp(uv, vec2(0.), vec2(1.)));
  gl_FragColor = vec4(u_color * a, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader');
  return shader;
}

function readColor(element: HTMLElement) {
  const [r = 128, g = 128, b = 128] = (getComputedStyle(element).color.match(/[\d.]+/g) ?? []).map(Number);
  return [r / 255, g / 255, b / 255] as const;
}

/**
 * Decorative shadow: the mask is displaced by a churning noise field, the same
 * shape the source component's SVG filter produced, drawn on the GPU so the
 * main thread stays free. Anything that cannot afford it — a narrow screen, a
 * reader who asked for less motion, a hidden tab, no WebGL — gets the mask on
 * its own, which is what the server renders anyway.
 */
export function Component({ sizing = 'fill', color = 'var(--morph-muted)', animation,
  style, className }: ShadowOverlayProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const loop = useRef<{ start(): void; stop(): void } | null>(null);
  const pending = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const wanted = Boolean(animation && animation.scale > 0);

  // What the screen and the reader allow. Checked once on the client so the
  // server's static markup is what a narrow or motion-averse visitor keeps.
  useEffect(() => {
    if (!wanted) return;
    const media = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [wanted]);

  // Whether it is worth drawing right now.
  useEffect(() => {
    const element = host.current;
    if (!element || !enabled) return;
    let visible = false;
    const sync = () => setRunning(visible && !document.hidden);
    const stop = watchViewport(element, next => { visible = next; sync(); });
    document.addEventListener('visibilitychange', sync);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', sync);
      setRunning(false);
    };
  }, [enabled]);

  /* The context, the program and the texture are built once and kept. Pausing
     is only ever "stop asking for frames" — tearing WebGL down on a tab switch
     would mean recompiling and re-uploading to come back. */
  useEffect(() => {
    const surface = canvas.current;
    const element = host.current;
    if (!enabled || !surface || !element || !animation) return;
    const gl = surface.getContext('webgl', { alpha: true, antialias: false, depth: false,
      stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return;

    let frame = 0;
    let drawing = false;
    let disposed = false;
    const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); setEnabled(false); };
    surface.addEventListener('webglcontextlost', lost);

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link');
    } catch {
      surface.removeEventListener('webglcontextlost', lost);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uCover = uniform('u_cover'), uFrequency = uniform('u_frequency');
    const uAmplitude = uniform('u_amplitude'), uTexel = uniform('u_texel');
    const uColor = uniform('u_color'), uTime = uniform('u_time');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* The filter's own numbers, kept so the folds read at the size they did in
       the source: a pixel base frequency and a pixel displacement. */
    const displacement = mapRange(animation.scale, 1, 100, 20, 100);
    const frequency = [mapRange(animation.scale, 0, 100, .001, .0005), mapRange(animation.scale, 0, 100, .004, .002)];
    const cycle = mapRange(animation.speed, 1, 100, 1000, 50) / 25;

    const resize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const ratio = Math.min(devicePixelRatio || 1, 1.25);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      gl.viewport(0, 0, surface.width, surface.height);

      const aspect = width / height;
      const fit = sizing === 'stretch' ? [1, 1]
        : aspect > MASK_ASPECT ? [1, MASK_ASPECT / aspect] : [aspect / MASK_ASPECT, 1];
      // Shrink the sampled window by the displacement so the folds never reach
      // past the mask and smear along its edge.
      const amplitude = [displacement / width, displacement / height];
      gl.uniform2f(uCover, fit[0] * (1 - amplitude[0] * 2), fit[1] * (1 - amplitude[1] * 2));
      gl.uniform2f(uAmplitude, amplitude[0], amplitude[1]);
      gl.uniform2f(uFrequency, frequency[0] * width, frequency[1] * height);
      gl.uniform2f(uTexel, 4 / width, 4 / height);
      if (!drawing) draw(performance.now(), true);
    };

    const paintColor = () => { const [r, g, b] = readColor(element); gl.uniform3f(uColor, r, g, b); };
    const theme = new MutationObserver(() => { paintColor(); if (!drawing) draw(performance.now(), true); });

    let start = 0;
    let elapsed = 0;
    let ready = false;
    const draw = (now: number, once = false) => {
      if (!ready) return;
      gl.uniform1f(uTime, (elapsed + (drawing ? now - start : 0)) / 1000 / cycle);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!once && drawing) frame = requestAnimationFrame(draw);
    };

    loop.current = {
      start() {
        if (drawing || !ready) { pending.current = !ready; return; }
        drawing = true;
        start = performance.now();
        frame = requestAnimationFrame(draw);
      },
      stop() {
        if (!drawing) return;
        // Hold the clock where it stopped so coming back is a continuation.
        elapsed += performance.now() - start;
        drawing = false;
        cancelAnimationFrame(frame);
      },
    };

    addEventListener('resize', resize, { passive: true });
    const image = new Image();
    image.decoding = 'async';
    image.src = MASK;
    image.decode().then(() => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ready = true;
      paintColor();
      resize();
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-morph-mode', 'data-morph-theme'] });
      element.dataset.ready = 'true';
      if (pending.current) { pending.current = false; loop.current?.start(); }
    }).catch(() => {});

    return () => {
      disposed = true;
      drawing = false;
      cancelAnimationFrame(frame);
      loop.current = null;
      removeEventListener('resize', resize);
      theme.disconnect();
      surface.removeEventListener('webglcontextlost', lost);
      delete element.dataset.ready;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [enabled, animation?.scale, animation?.speed, sizing]);

  useEffect(() => {
    if (running) loop.current ? loop.current.start() : (pending.current = true);
    else loop.current?.stop();
  }, [running]);

  return (
    <div ref={host} aria-hidden="true" className={className} data-shadow=""
      data-running={String(running)} style={{
        overflow: 'hidden', position: 'relative', width: '100%', height: '100%',
        pointerEvents: 'none', opacity: .5, color,
        maskImage: 'linear-gradient(to bottom, black 0%, black 25%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 25%, transparent 100%)',
        ...style,
      }}>
      <div className="ethereal-shadow-layer" style={{
        position: 'absolute', inset: 0, backgroundColor: color,
        maskImage: `url(${MASK})`, WebkitMaskImage: `url(${MASK})`,
        maskSize: sizing === 'stretch' ? '100% 100%' : 'cover',
        maskRepeat: 'no-repeat', maskPosition: 'center',
      }} />
      <canvas ref={canvas} className="ethereal-shadow-canvas" />
    </div>
  );
}
