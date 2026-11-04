// Hero scene: a faceted ("origami") low-poly mountain range under a sky that
// cycles through the original site's Granim gradient palettes, with falling
// snow. Loaded lazily after first paint; pauses when off-screen.
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

// Same four [top, bottom] states as the original Granim background.
const PALETTES: [string, string][] = [
  ["#29323c", "#485563"],
  ["#FF6B6B", "#556270"],
  ["#80d3fe", "#7ea0c4"],
  ["#f0ab51", "#eceba3"],
];
const STATE_MS = 8000;
const WHITE = new Color("#ffffff");

// ---------- 2D simplex noise (Stefan Gustavson, public domain) ----------
function makeNoise(seed = 7) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
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

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function buildTerrain(segX: number, segZ: number) {
  const noise = makeNoise(11);
  const W = 560;
  const D = 340;
  const plane = new PlaneGeometry(W, D, segX, segZ);
  plane.rotateX(-Math.PI / 2);
  plane.translate(0, 0, -D / 2 + 50); // spans z = +50 .. -290

  const pos = plane.attributes.position as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Ridged fBm for alpine crests, masked by a broad low-frequency field so
    // the range reads as distinct massifs instead of uniform spikes.
    let h = 0;
    let amp = 1;
    let freq = 0.0058;
    for (let o = 0; o < 6; o++) {
      const n = 1 - Math.abs(noise(x * freq + 13.1, z * freq - 4.7));
      h += n * n * amp;
      amp *= 0.47;
      freq *= 2.07;
    }
    const massif = 0.35 + 0.65 * (noise(x * 0.0035 - 9.2, z * 0.0035 + 2.1) * 0.5 + 0.5);
    const far = smooth(25, -190, z); // 0 near the camera, 1 at the back
    const valley = 1 - Math.exp(-(x * x) / (2 * 70 * 70)) * (1 - far); // open valley in front
    const height = h * (2.2 + Math.pow(far, 1.6) * 78 * massif) * (0.35 + 0.65 * valley) - 3;
    pos.setY(i, height);
  }

  // Non-indexed so each triangle gets one flat colour: the faceted paper look.
  const geo = plane.toNonIndexed() as BufferGeometry;
  plane.dispose();
  geo.computeVertexNormals();

  const p = geo.attributes.position as BufferAttribute;
  const n = geo.attributes.normal as BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const snow = new Color("#f4f6ff");
  const shade = new Color("#dfe4f3");
  const rock = new Color("#4b5169");
  const rockDark = new Color("#343a50");
  const c = new Color();
  for (let i = 0; i < p.count; i += 3) {
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const ny = n.getY(i);
    const jitter = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1; // per-face variety
    const snowAmt = smooth(0.62, 0.8, ny + jitter * 0.08) * smooth(-6, 4, y) + smooth(26, 48, y) * (0.45 + jitter * 0.4);
    c.copy(jitter > 0.5 ? rock : rockDark).lerp(jitter > 0.35 ? snow : shade, Math.min(1, snowAmt));
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = c.r;
      colors[(i + k) * 3 + 1] = c.g;
      colors[(i + k) * 3 + 2] = c.b;
    }
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  return geo;
}

function buildSnow(count: number) {
  const geo = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 260;
    pos[i * 3 + 1] = Math.random() * 90;
    pos[i * 3 + 2] = 60 - Math.random() * 260;
    seed[i] = Math.random();
  }
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new BufferAttribute(seed, 1));
  const mat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uWind: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPixelRatio; uniform float uWind;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * (2.5 + aSeed * 3.5), 90.0);
        p.x += sin(uTime * 0.55 + aSeed * 40.0) * 1.6 + uWind * (90.0 - p.y) * 0.08;
        p.z += cos(uTime * 0.35 + aSeed * 23.0) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        gl_PointSize = (0.9 + aSeed * 1.5) * uPixelRatio * (140.0 / depth);
        vAlpha = smoothstep(0.0, 8.0, p.y) * smoothstep(90.0, 78.0, p.y) * clamp(1.2 - depth / 240.0, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vAlpha * 0.85;
        if (a < 0.01) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }`,
  });
  return new Points(geo, mat);
}

function buildSky() {
  const mat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new Color() },
      uBottom: { value: new Color() },
      uSun: { value: new Vector3(0.35, 0.28, -1).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        float h = smoothstep(-0.05, 0.55, vDir.y);
        vec3 col = mix(uBottom, uTop, h);
        float sun = pow(max(dot(normalize(vDir), uSun), 0.0), 24.0);
        col += vec3(1.0, 0.95, 0.85) * sun * 0.35;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return new Mesh(new SphereGeometry(900, 32, 16), mat);
}

export type HeroHandle = { dispose: () => void };

export function initHero(canvas: HTMLCanvasElement): HeroHandle | null {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 768;
  const weak = small || (navigator.hardwareConcurrency ?? 8) <= 4;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !weak, alpha: false, powerPreference: "default" });
  } catch {
    return null; // no WebGL: the CSS fallback stays visible
  }
  let dpr = Math.min(window.devicePixelRatio || 1, weak ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const fog = new Fog("#485563", 90, 360);
  scene.fog = fog;

  const camera = new PerspectiveCamera(small ? 62 : 52, 1, 0.5, 2000);
  const lookAt = new Vector3(0, 16, -140);

  const sky = buildSky();
  scene.add(sky);

  const terrainMat = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const terrain = new Mesh(buildTerrain(weak ? 96 : 150, weak ? 60 : 92), terrainMat);
  scene.add(terrain);

  const hemi = new HemisphereLight("#ffffff", "#485563", 1.4);
  scene.add(hemi);
  const sun = new DirectionalLight("#ffffff", 2.1);
  sun.position.set(120, 140, -60);
  scene.add(sun);

  const snow = buildSnow(weak ? 900 : 2000);
  scene.add(snow);
  const snowMat = snow.material as ShaderMaterial;
  snowMat.uniforms.uPixelRatio.value = dpr;

  // Palette interpolation state
  const top = new Color();
  const bottom = new Color();
  const tmpA = new Color();
  const tmpB = new Color();
  const pal = PALETTES.map(([t, b]) => [new Color(t), new Color(b)] as const);
  const skyU = (sky.material as ShaderMaterial).uniforms;

  function applyPalette(ms: number) {
    const t = ms / STATE_MS;
    const i = Math.floor(t) % pal.length;
    const j = (i + 1) % pal.length;
    const f = smooth(0, 1, t - Math.floor(t));
    top.copy(pal[i][0]).lerp(pal[j][0], f);
    bottom.copy(pal[i][1]).lerp(pal[j][1], f);
    skyU.uTop.value.copy(top);
    skyU.uBottom.value.copy(bottom);
    fog.color.copy(tmpA.copy(bottom).lerp(top, 0.25));
    hemi.color.copy(tmpB.copy(top).lerp(WHITE, 0.55));
    hemi.groundColor.copy(bottom);
    sun.color.copy(tmpA.copy(top).lerp(WHITE, 0.7));
  }

  // Input: pointer parallax + scroll fly-in
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let scrollP = 0;
  const onScroll = () => {
    scrollP = Math.min(1, Math.max(0, window.scrollY / (canvas.clientHeight || 1)));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduced) renderFrame(0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let last = performance.now();
  const delta = () => {
    const now = performance.now();
    const d = (now - last) / 1000;
    last = now;
    return d;
  };
  let elapsed = 0;
  let raf = 0;
  let visible = true;
  let frames = 0;
  let slowFrames = 0;
  let firstFrame = true;

  function renderFrame(dt: number) {
    elapsed += dt;
    applyPalette(reduced ? 0 : elapsed * 1000);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.5);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.5);
    const sway = reduced ? 0 : Math.sin(elapsed * 0.07) * 5;
    camera.position.set(sway + pointer.x * 7, 20 - pointer.y * 3 + scrollP * 8, 74 - scrollP * 45);
    lookAt.set(pointer.x * 10, 27 - scrollP * 8, -140);
    camera.lookAt(lookAt);
    snowMat.uniforms.uTime.value = elapsed;
    snowMat.uniforms.uWind.value = pointer.x * 0.6;
    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add("ready");
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(delta(), 0.05);
    // Adaptive quality: drop resolution once if the device is struggling.
    if (frames < 90) {
      frames++;
      if (dt > 0.03) slowFrames++;
      if (frames === 90 && slowFrames > 40 && dpr > 1) {
        dpr = 1;
        renderer.setPixelRatio(dpr);
        snowMat.uniforms.uPixelRatio.value = dpr;
        resize();
      }
    }
    renderFrame(dt);
  }

  const io = new IntersectionObserver(([entry]) => {
    const next = entry.isIntersecting;
    if (next === visible) return;
    visible = next;
    if (reduced) return;
    if (visible) {
      delta();
      loop();
    } else cancelAnimationFrame(raf);
  });
  io.observe(canvas);

  resize();
  if (reduced) renderFrame(0);
  else loop();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      renderer.dispose();
    },
  };
}
