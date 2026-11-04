// Shared helpers for the WebGL scenes: palettes, noise, easing, render loop.
import { Vector3 } from "three";

import { PALETTES, STATE_MS } from "./palettes";
export { PALETTES, STATE_MS };

/** Hex to raw sRGB triplet (for shaders that blend in display space, like CSS does). */
export function srgb(hex: string, out = new Vector3()) {
  const n = parseInt(hex.slice(1), 16);
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Cycles the palettes like Granim: returns blended top/bottom (sRGB vectors). */
export function paletteAt(ms: number, top: Vector3, bottom: Vector3) {
  const t = ms / STATE_MS;
  const n = PALETTES.length;
  const i = ((Math.floor(t) % n) + n) % n;
  const j = (i + 1) % n;
  const f = smooth(0, 1, t - Math.floor(t));
  const a = srgb(PALETTES[i].top, _a);
  const b = srgb(PALETTES[j].top, _b);
  top.copy(a).lerp(b, f);
  srgb(PALETTES[i].bottom, _a);
  srgb(PALETTES[j].bottom, _b);
  bottom.copy(_a).lerp(_b, f);
}
const _a = new Vector3();
const _b = new Vector3();

// ---------- 2D simplex noise (Stefan Gustavson, public domain) ----------
export function makeNoise(seed = 7) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = Math.max(1, Math.floor(seed)) % 2147483647;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (xin: number, yin: number) => {
    const s2 = (xin + yin) * F2;
    const i = Math.floor(xin + s2);
    const j = Math.floor(yin + s2);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    const corner = (gi: number, x: number, y: number) => {
      let tt = 0.5 - x * x - y * y;
      if (tt < 0) return 0;
      tt *= tt;
      const g = grad[gi % 8];
      return tt * tt * (g[0] * x + g[1] * y);
    };
    return (
      70 *
      (corner(perm[ii + perm[jj]], x0, y0) +
        corner(perm[ii + i1 + perm[jj + j1]], x1, y1) +
        corner(perm[ii + 1 + perm[jj + 1]], x2, y2))
    );
  };
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isWeakDevice = () =>
  window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;

/**
 * rAF loop that only runs while `el` is on screen and the tab is visible.
 * `frame(dt, elapsed)` gets seconds. Returns a stop function.
 */
export function runWhileVisible(el: Element, frame: (dt: number, elapsed: number) => void) {
  let raf = 0;
  let running = false;
  let last = 0;
  let elapsed = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    elapsed += dt;
    frame(dt, elapsed);
  };
  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const io = new IntersectionObserver((entries) => (entries[entries.length - 1].isIntersecting ? start() : stop()), {
    rootMargin: "80px",
  });
  io.observe(el);
  return () => {
    stop();
    io.disconnect();
  };
}
