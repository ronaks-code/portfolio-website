// Hero: the original snowy-mountain photo, multiplied by the cycling Granim
// gradient (the v1 look), given 2.5D depth parallax, with interactive snow and
// a flock of origami cranes that follow the cursor. Click/tap = gust.
import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  NoColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { isWeakDevice, paletteAt, prefersReducedMotion, runWhileVisible } from "./common";
import { createFlock } from "./cranes";
import { createSnow } from "./snow";

export function initHero(canvas: HTMLCanvasElement, photoUrl: string) {
  const reduced = prefersReducedMotion();
  const weak = isWeakDevice();
  const touch = window.matchMedia("(pointer: coarse)").matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !weak, powerPreference: "default" });
  } catch {
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  let dpr = Math.min(window.devicePixelRatio || 1, weak ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 200);
  const tanHalf = Math.tan((50 / 2) * (Math.PI / 180));

  // ---- Photo backdrop (fullscreen quad, drawn first) ----
  const photoU = {
    uTex: { value: null as unknown },
    uTop: { value: new Vector3() },
    uBottom: { value: new Vector3() },
    uPointer: { value: new Vector2() },
    uScreenAspect: { value: 1 },
    uImgAspect: { value: 2172 / 1500 },
    uZoom: { value: 1.07 },
    uTime: { value: 0 },
  };
  const photo = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: photoU,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        uniform vec3 uTop, uBottom;
        uniform vec2 uPointer;
        uniform float uScreenAspect, uImgAspect, uZoom, uTime;
        varying vec2 vUv;
        void main() {
          vec2 s = uScreenAspect > uImgAspect
            ? vec2(1.0, uImgAspect / uScreenAspect)
            : vec2(uScreenAspect / uImgAspect, 1.0);
          vec2 uv = (vUv - 0.5) * s / uZoom + 0.5;
          // Cheap depth: sky/clouds far, lower slopes near.
          vec3 c0 = texture2D(uTex, uv).rgb;
          float sky = smoothstep(0.04, 0.2, c0.b - c0.r) * smoothstep(0.5, 0.72, uv.y);
          float depth = (1.0 - smoothstep(0.1, 0.8, uv.y)) * (1.0 - sky);
          vec2 drift = vec2(sin(uTime * 0.11), cos(uTime * 0.09)) * 0.004;
          vec2 par = (uPointer * 0.5 + drift) * (0.006 + depth * 0.03);
          vec3 c = texture2D(uTex, uv - par).rgb;
          // Granim-style top-to-bottom gradient, multiplied (slightly lifted)
          vec3 g = mix(uBottom, uTop, vUv.y);
          vec3 col = c * mix(g, vec3(1.0), 0.18) * 1.18;
          // soft vignette
          vec2 q = vUv - 0.5;
          col *= 1.0 - dot(q, q) * 0.55;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  photo.frustumCulled = false;
  photo.renderOrder = -1;
  scene.add(photo);

  // ---- Snow (view space box in front of the camera) ----
  const snow = createSnow({
    count: weak ? 600 : 1250,
    box: { x: 22, y: 26, z: 13, zOffset: -17, yOffset: -13 },
    size: 1.15,
  });
  snow.uniforms.uPixelRatio.value = dpr;
  scene.add(snow.points);

  // ---- Cranes ----
  const flockCount = weak ? 7 : 11;
  const flock = createFlock({
    count: flockCount,
    scale: 0.5,
    maxSpeed: 5.5,
    minSpeed: 1.1,
    spread: new Vector3(2.6, 1.3, 2.2),
    spawn: (i) => new Vector3(-14 - i * 1.5, 2 + Math.random() * 3, -13 - Math.random() * 4),
    brightness: 1.05,
  });
  scene.add(flock.mesh);

  // ---- Input ----
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, lastMove: -10 };
  let elapsed = 0;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom) return;
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.active = true;
    pointer.lastMove = elapsed;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const ray = new Vector3();
  const gustRay = new Vector3();
  const rayAt = (nx: number, ny: number, out: Vector3) =>
    out.set(nx * tanHalf * camera.aspect, ny * tanHalf, -1);

  let gust = 0;
  const gustPoint = new Vector3();
  const host = canvas.parentElement!;
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    rayAt(nx, ny, gustRay);
    gust = 1;
    gustPoint.copy(gustRay).multiplyScalar(14);
    flock.scatter(gustPoint, 9);
    pointer.tx = nx;
    pointer.ty = ny;
    pointer.active = true;
    pointer.lastMove = elapsed;
    host.dispatchEvent(new CustomEvent("hero:gust"));
  };
  host.addEventListener("pointerdown", onDown);

  // device tilt nudges parallax on phones (no permission prompt: only where allowed)
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    pointer.tx = Math.max(-1, Math.min(1, e.gamma / 30));
    pointer.ty = Math.max(-1, Math.min(1, (45 - e.beta) / 30));
  };
  if (touch) window.addEventListener("deviceorientation", onTilt, { passive: true });

  let scrollP = 0;
  const onScroll = () => {
    scrollP = Math.min(1, Math.max(0, window.scrollY / (canvas.clientHeight || 1)));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Sizing ----
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    photoU.uScreenAspect.value = w / h;
    if (reduced) draw(0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ---- Frame ----
  const target = new Vector3();
  let frames = 0;
  let slow = 0;
  let ready = false;

  function craneTarget(i: number, b: { offset: Vector3 }) {
    const idle = !pointer.active || elapsed - pointer.lastMove > 3.5 || touch;
    if (idle) {
      // lazy figure-eight loop across the sky
      const t = elapsed * 0.16 + i * 0.05;
      target.set(Math.sin(t) * 10 * camera.aspect * 0.7, 4.2 + Math.sin(t * 2) * 1.6, -15 + Math.cos(t) * 2);
    } else {
      rayAt(pointer.x, pointer.y, target).multiplyScalar(13);
      target.y += 0.6;
    }
    return target.add(b.offset);
  }

  function draw(dt: number) {
    elapsed += dt;
    const k = Math.min(1, dt * 3);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;

    paletteAt(reduced ? 0 : elapsed * 1000, photoU.uTop.value, photoU.uBottom.value);
    photoU.uPointer.value.set(pointer.x, pointer.y);
    photoU.uTime.value = elapsed;
    photoU.uZoom.value = 1.07 + scrollP * 0.06;

    camera.position.set(pointer.x * 0.5, pointer.y * 0.3 - scrollP * 2, 0);
    camera.lookAt(pointer.x * 0.5, pointer.y * 0.3 - scrollP * 2, -10);

    rayAt(pointer.x, pointer.y, ray);
    snow.uniforms.uTime.value = elapsed;
    snow.uniforms.uRay.value.copy(ray);
    snow.uniforms.uRepel.value += ((pointer.active && !touch ? 1 : 0) - snow.uniforms.uRepel.value) * k;
    snow.uniforms.uWind.value = pointer.x * 0.25;
    gust *= Math.exp(-dt * 1.6);
    snow.uniforms.uGust.value = gust;
    snow.uniforms.uGustRay.value.copy(gustRay);

    if (!reduced) flock.update(dt, elapsed, craneTarget);
    else flock.update(0.016, 0, craneTarget);

    renderer.render(scene, camera);
    if (!ready && photoU.uTex.value) {
      ready = true;
      canvas.classList.add("ready");
      if (!reduced) canvas.classList.add("interactive");
    }
  }

  let stopLoop = () => {};
  new TextureLoader().load(photoUrl, (tex) => {
    tex.colorSpace = NoColorSpace; // blend in display space, like the CSS fallback
    photoU.uTex.value = tex;
    photoU.uImgAspect.value = tex.image.width / tex.image.height;
    resize();
    if (reduced) {
      // settle the cranes into place, then render one still frame
      for (let i = 0; i < 240; i++) flock.update(1 / 60, i / 60, craneTarget);
      draw(0);
      return;
    }
    stopLoop = runWhileVisible(canvas, (dt) => {
      // adaptive resolution: if the first ~1.5s is slow, drop DPR once
      if (frames < 90) {
        frames++;
        if (dt > 0.03) slow++;
        if (frames === 90 && slow > 40 && dpr > 1) {
          dpr = 1;
          renderer.setPixelRatio(dpr);
          snow.uniforms.uPixelRatio.value = dpr;
          resize();
        }
      }
      draw(dt);
    });
  });

  return {
    dispose() {
      stopLoop();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onTilt);
      host.removeEventListener("pointerdown", onDown);
      flock.dispose();
      renderer.dispose();
    },
  };
}
