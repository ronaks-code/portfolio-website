// Playground: a floating paper diorama of a procedurally generated mountain
// range. Drag to orbit, "New range" folds the paper flat and grows a new seed,
// palette chips recolor the sky, and clicking the terrain calls the cranes.
import {
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  PALETTES,
  clamp01,
  easeOutBack,
  isWeakDevice,
  makeNoise,
  paletteAt,
  prefersReducedMotion,
  runWhileVisible,
  smooth,
  srgb,
} from "./common";
import { createFlock } from "./cranes";
import { createSnow } from "./snow";

const SIZE = 200;
const HALF = SIZE / 2;

function heightField(seed: number, seg: number) {
  const noise = makeNoise(seed);
  const n = seg + 1;
  const h = new Float32Array(n * n);
  const ox = (seed * 7.31) % 100;
  const oz = (seed * 3.17) % 100;
  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) {
      const x = (ix / seg - 0.5) * SIZE;
      const z = (iz / seg - 0.5) * SIZE;
      let v = 0;
      let amp = 1;
      let f = 0.0082;
      for (let o = 0; o < 5; o++) {
        const r = 1 - Math.abs(noise(x * f + ox, z * f + oz));
        v += r * r * amp;
        amp *= 0.44;
        f *= 2.1;
      }
      const massif = 0.35 + 0.65 * (noise(x * 0.0065 - ox, z * 0.0065 + oz) * 0.5 + 0.5);
      // fall off to a flat paper border so the tile reads as a diorama
      const edge = Math.max(Math.abs(x), Math.abs(z)) / HALF;
      const fall = 1 - smooth(0.42, 0.9, edge);
      const radial = 1 - smooth(0.15, 1.0, Math.hypot(x, z) / HALF) * 0.5;
      h[iz * n + ix] = Math.max(0, Math.pow(v / 1.7, 1.45) * 86 * massif * fall * radial - 1.5);
    }
  }
  return h;
}

export function initPlayground(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
  const reduced = prefersReducedMotion();
  const weak = isWeakDevice();

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "default" });
  } catch {
    root.classList.add("no-webgl");
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  const dpr = Math.min(window.devicePixelRatio || 1, weak ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 1, 2000);

  // ---- sky (fullscreen gradient quad in display space) ----
  const skyU = { uTop: { value: new Vector3() }, uBottom: { value: new Vector3() } };
  const sky = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: skyU,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uBottom; varying vec2 vUv;
        void main(){
          vec3 c = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
          vec2 q = vUv - vec2(0.5, 0.35);
          c += vec3(1.0) * 0.12 * exp(-dot(q, q) * 6.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  // ---- terrain ----
  const seg = weak ? 72 : 96;
  const n = seg + 1;
  const plane = new PlaneGeometry(SIZE, SIZE, seg, seg);
  plane.rotateX(-Math.PI / 2);
  const geo = plane.toNonIndexed();
  plane.dispose();
  const pos = geo.attributes.position as BufferAttribute;
  // map every non-indexed vertex back to its grid index so heights can be re-applied
  const gridIndex = new Uint32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const ix = Math.round((pos.getX(i) / SIZE + 0.5) * seg);
    const iz = Math.round((pos.getZ(i) / SIZE + 0.5) * seg);
    gridIndex[i] = iz * n + ix;
  }
  const colors = new Float32Array(pos.count * 3);
  const targetColors = new Float32Array(pos.count * 3);
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const terrainMat = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const terrain = new Mesh(geo, terrainMat);
  scene.add(terrain);

  // paper base + frozen lake + soft floor shadow
  const base = new Mesh(
    new BoxGeometry(SIZE, 10, SIZE),
    new MeshLambertMaterial({ color: "#e9e4f7" }),
  );
  base.position.y = -5.01;
  scene.add(base);

  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(20,10,50,0.55)");
    grd.addColorStop(1, "rgba(20,10,50,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  })();
  const shadow = new Mesh(
    new PlaneGeometry(SIZE * 1.9, SIZE * 1.9),
    new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotateX(-Math.PI / 2);
  shadow.position.y = -34;
  scene.add(shadow);

  const hemi = new HemisphereLight("#ffffff", "#8090b0", 1.5);
  scene.add(hemi);
  const sun = new DirectionalLight("#ffffff", 2.2);
  sun.position.set(-90, 120, 60);
  scene.add(sun);

  // ---- snow + cranes ----
  const snow = createSnow({ count: weak ? 500 : 1100, box: { x: 110, y: 120, z: 110 }, size: 2.6 });
  snow.uniforms.uPixelRatio.value = dpr;
  scene.add(snow.points);

  const flock = createFlock({
    count: weak ? 7 : 10,
    scale: 6,
    maxSpeed: 60,
    minSpeed: 18,
    spread: new Vector3(26, 10, 26),
    spawn: (i) => new Vector3(Math.cos(i) * 120, 70 + i * 2, Math.sin(i) * 120),
  });
  scene.add(flock.mesh);

  // ---- heights / colors with fold animation ----
  let from = new Float32Array(n * n);
  let to = heightField(1 + Math.floor(Math.random() * 9999), seg);
  let current = new Float32Array(n * n);
  let anim = reduced ? 1 : 0; // 0..1 progress of the grow animation
  const delays = new Float32Array(n * n);
  for (let iz = 0; iz < n; iz++)
    for (let ix = 0; ix < n; ix++) {
      const d = Math.hypot(ix / seg - 0.5, iz / seg - 0.5) / 0.7071;
      delays[iz * n + ix] = d * 0.45;
    }

  const snowC = new Color("#f6f7ff");
  const shadeC = new Color("#dde3f4");
  const rockC = new Color("#737a96");
  const rockD = new Color("#535a76");
  const paperC = new Color("#eeeaf8");
  const iceC = new Color("#c4d7fb");
  const c = new Color();

  function applyHeights() {
    for (let i = 0; i < pos.count; i++) pos.setY(i, current[gridIndex[i]]);
    pos.needsUpdate = true;
  }

  function recolor(h: Float32Array) {
    // color per face from its slope + height (computed on the target shape)
    for (let i = 0; i < pos.count; i += 3) {
      const a = gridIndex[i];
      const b = gridIndex[i + 1];
      const d = gridIndex[i + 2];
      const ya = h[a];
      const yb = h[b];
      const yd = h[d];
      const y = (ya + yb + yd) / 3;
      // face normal y from the 3 points
      const ax = pos.getX(i), az = pos.getZ(i);
      const bx = pos.getX(i + 1) - ax, by = yb - ya, bz = pos.getZ(i + 1) - az;
      const cx = pos.getX(i + 2) - ax, cy = yd - ya, cz = pos.getZ(i + 2) - az;
      const nx = by * cz - bz * cy;
      const ny = bz * cx - bx * cz;
      const nz = bx * cy - by * cx;
      const slope = Math.abs(ny) / Math.hypot(nx, ny, nz);
      const j = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const edge = Math.max(Math.abs(ax), Math.abs(az)) / HALF;
      if (y < 0.3) c.copy(edge > 0.8 ? paperC : edge > 0.6 ? snowC : iceC).lerp(snowC, j * 0.3);
      else {
        const s = smooth(0.5, 0.76, slope + j * 0.1) * 0.85 + smooth(18, 34, y) * (0.8 + j * 0.4) - smooth(4, 0, y) * 0.2;
        c.copy(j > 0.5 ? rockC : rockD).lerp(j > 0.3 ? snowC : shadeC, clamp01(s));
      }
      for (let k = 0; k < 3; k++) targetColors.set([c.r, c.g, c.b], (i + k) * 3);
    }
  }

  /** per-vertex blend from paper to the target colors, following the grow progress */
  function blendColors(t: (gi: number) => number) {
    for (let i = 0; i < pos.count; i++) {
      const k = Math.min(1, t(gridIndex[i]));
      const o = i * 3;
      colors[o] = paperC.r + (targetColors[o] - paperC.r) * k;
      colors[o + 1] = paperC.g + (targetColors[o + 1] - paperC.g) * k;
      colors[o + 2] = paperC.b + (targetColors[o + 2] - paperC.b) * k;
    }
    (geo.attributes.color as BufferAttribute).needsUpdate = true;
  }
  let prevK = new Float32Array(n * n).fill(1);

  let seedLabel = 0;
  const seedEl = root.querySelector<HTMLElement>("[data-seed]");
  function newRange(seed = 1 + Math.floor(Math.random() * 9999)) {
    from = current.slice();
    to = heightField(seed, seg);
    seedLabel = seed;
    if (seedEl) seedEl.textContent = `#${String(seed).padStart(4, "0")}`;
    anim = reduced ? 1 : 0;
    colorsSwapped = false;
    if (reduced) {
      current = to.slice();
      recolor(to);
      prevK.fill(1);
      blendColors(() => 1);
      applyHeights();
    }
  }
  let colorsSwapped = false;

  function stepAnim(dt: number) {
    if (anim >= 1) return;
    anim = Math.min(1, anim + dt / 2.2);
    if (anim === 1) queueMicrotask(() => geo.computeBoundingSphere());
    // phase 1 (0..0.3): fold old range flat. phase 2 (0.3..1): grow new one.
    if (anim < 0.3) {
      const t = easeInOut(anim / 0.3);
      for (let i = 0; i < current.length; i++) current[i] = from[i] * (1 - t);
      const fade = 1 - t;
      blendColors((gi) => prevK[gi] * fade);
    } else {
      if (!colorsSwapped) {
        recolor(to);
        colorsSwapped = true;
      }
      const t = (anim - 0.3) / 0.7;
      for (let i = 0; i < current.length; i++) {
        const k = clamp01((t - delays[i]) / 0.55);
        prevK[i] = k;
        current[i] = to[i] * (k > 0 ? easeOutBack(k) : 0);
      }
      blendColors((gi) => prevK[gi]);
    }
    applyHeights();
  }
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // ---- palette control ----
  let fixedPalette = -1; // -1 = auto cycle
  const skyTarget = { top: new Vector3(), bottom: new Vector3() };
  const chips = [...root.querySelectorAll<HTMLButtonElement>("[data-palette]")];
  chips.forEach((b) =>
    b.addEventListener("click", () => {
      fixedPalette = Number(b.dataset.palette);
      dirty = true;
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }),
  );

  // ---- orbit (custom: horizontal drag never blocks vertical page scroll) ----
  let az = 0.6;
  let el = 0.33;
  let tAz = az;
  let tEl = el;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let idleT = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    root.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    tAz -= dx * 0.006;
    if (e.pointerType === "mouse") tEl = Math.min(1.1, Math.max(0.18, tEl + dy * 0.004));
    idleT = 0;
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("grabbing");
    if (moved < 6) callCranes(e);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    root.classList.remove("grabbing");
  });

  // ---- click terrain -> cranes circle that spot ----
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const beacon = new Vector3(0, 40, 0);
  let beaconTime = -99;
  let elapsed = 0;
  function callCranes(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(terrain, false)[0];
    if (!hit) return;
    beacon.copy(hit.point);
    beaconTime = elapsed;
    snow.uniforms.uGust.value = 1;
    root.dispatchEvent(new CustomEvent("playground:call"));
  }

  root.querySelector("[data-new-range]")?.addEventListener("click", () => {
    newRange();
    dirty = true;
  });

  // ---- sizing ----
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 50 : 34;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);

  // ---- frame ----
  const tgt = new Vector3();
  const look = new Vector3(0, 16, 0);
  function craneTarget(i: number, b: { offset: Vector3 }) {
    const t = elapsed * 0.32 + (i / flock.birds.length) * Math.PI * 2;
    if (elapsed - beaconTime < 9) {
      const r = 22 + (i % 3) * 7;
      tgt.set(beacon.x + Math.cos(t * 1.8) * r, beacon.y + 18 + (i % 4) * 4, beacon.z + Math.sin(t * 1.8) * r);
      return tgt;
    }
    const r = 95 + (i % 3) * 14;
    tgt.set(Math.cos(t) * r, 58 + Math.sin(t * 2 + i) * 10, Math.sin(t) * r);
    return tgt.add(b.offset);
  }

  let dirty = true;
  function draw(dt: number) {
    if (reduced) {
      // no ambient motion: render only after input/resize, with frozen time
      if (!dirty && !dragging && Math.abs(tAz - az) < 1e-3 && Math.abs(tEl - el) < 1e-3) return;
      dirty = false;
      dt = 0.016;
    } else elapsed += dt;
    idleT += dt;
    if (!dragging && idleT > 2.5 && !reduced) tAz += dt * 0.08;
    az += (tAz - az) * Math.min(1, dt * 5);
    el += (tEl - el) * Math.min(1, dt * 5);
    // fit the tile's diagonal (~300 units with margin) to the horizontal FOV on narrow screens
    const hHalf = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    const dist = camera.aspect < 1 ? Math.max(280, 142 / Math.tan(hHalf)) : 375;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist + 10, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(look);

    // gentle float
    const bob = reduced ? 0 : Math.sin(elapsed * 0.8) * 1.5;
    terrain.position.y = bob;
    base.position.y = -5.01 + bob;

    stepAnim(dt);

    if (fixedPalette < 0) paletteAt(reduced ? 0 : elapsed * 1000, skyTarget.top, skyTarget.bottom);
    else {
      srgb(PALETTES[fixedPalette].top, skyTarget.top);
      srgb(PALETTES[fixedPalette].bottom, skyTarget.bottom);
    }
    const k = Math.min(1, dt * 2.5);
    skyU.uTop.value.lerp(skyTarget.top, fixedPalette < 0 ? 1 : k);
    skyU.uBottom.value.lerp(skyTarget.bottom, fixedPalette < 0 ? 1 : k);
    const t = skyU.uTop.value;
    const b = skyU.uBottom.value;
    hemi.color.setRGB(0.55 + t.x * 0.45, 0.55 + t.y * 0.45, 0.55 + t.z * 0.45, SRGBColorSpace);
    hemi.groundColor.setRGB(b.x, b.y, b.z, SRGBColorSpace);
    sun.color.setRGB(0.75 + t.x * 0.25, 0.75 + t.y * 0.25, 0.75 + t.z * 0.25, SRGBColorSpace);

    snow.uniforms.uTime.value = elapsed;
    snow.uniforms.uGust.value *= Math.exp(-dt * 1.5);
    flock.update(reduced ? 0 : dt, elapsed, craneTarget);

    renderer.render(scene, camera);
  }

  prevK.fill(0);
  newRange();
  if (reduced) {
    paletteAt(0, skyU.uTop.value, skyU.uBottom.value);
  }
  resize();
  const stop = runWhileVisible(root, draw);
  root.classList.add("ready");
  void seedLabel;

  return {
    dispose() {
      stop();
      flock.dispose();
      renderer.dispose();
    },
  };
}
