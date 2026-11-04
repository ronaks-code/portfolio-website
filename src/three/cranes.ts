// Origami paper cranes: one hand-built low-poly mesh, instanced, with wing
// flap in the vertex shader and flat paper shading from screen derivatives.
// Movement is a tiny steering/flocking sim on the CPU (cheap at <40 birds).
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  ShaderMaterial,
  Vector3,
} from "three";

const PAPER = ["#ffffff", "#f4f1ff", "#d0c4fc", "#b5d0ff", "#ffdee3", "#ffe8c7"];

function craneGeometry() {
  const v = (x: number, y: number, z: number) => [x, y, z];
  // Crane faces +z, up is +y. Wingspan ~1.9 units.
  const F = v(0, 0, 0.32);
  const K = v(0, 0, -0.32);
  const T = v(0, 0.1, 0);
  const L = v(-0.07, -0.16, 0);
  const R = v(0.07, -0.16, 0);
  const tris: number[][][] = [
    // body
    [F, T, L], [T, K, L], [F, R, T], [T, R, K], [F, L, R], [K, R, L],
    // neck + head (bends down at the tip like a real fold)
    [v(0, 0.03, 0.26), v(0, -0.06, 0.3), v(0, 0.58, 0.62)],
    [v(0, 0.58, 0.62), v(0, 0.52, 0.6), v(0, 0.49, 0.78)],
    // tail
    [v(0, 0.03, -0.26), v(0, -0.06, -0.3), v(0, 0.52, -0.68)],
  ];
  // wings: two facets each with a valley crease
  for (const s of [-1, 1]) {
    const WF = v(0.02 * s, 0.05, 0.16);
    const WK = v(0.02 * s, 0.05, -0.2);
    const WM = v(0.03 * s, 0.11, -0.02);
    const TIP = v(0.95 * s, 0.14, -0.14);
    tris.push([WF, WM, TIP], [WM, WK, TIP]);
  }
  const pos = new Float32Array(tris.length * 9);
  tris.forEach((t, i) => t.forEach((p, k) => pos.set(p, i * 9 + k * 3)));
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  return g;
}

type Bird = {
  pos: Vector3;
  vel: Vector3;
  offset: Vector3;
  bank: number;
  speed: number;
};

export type Flock = {
  mesh: InstancedMesh;
  birds: Bird[];
  /** target(i) returns where bird i wants to be (already includes its offset if you want). */
  update: (dt: number, time: number, target: (i: number, b: Bird) => Vector3) => void;
  scatter: (from: Vector3, strength?: number) => void;
  dispose: () => void;
};

export function createFlock(opts: {
  count: number;
  scale: number;
  spawn: (i: number) => Vector3;
  spread: Vector3;
  maxSpeed: number;
  minSpeed?: number;
  /** extra light: cranes in the hero sit over a dark photo */
  brightness?: number;
}): Flock {
  const { count, scale, maxSpeed } = opts;
  const minSpeed = opts.minSpeed ?? maxSpeed * 0.25;
  const geo = craneGeometry();
  const phase = new Float32Array(count);
  const color = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    phase[i] = Math.random() * Math.PI * 2;
    const hex = PAPER[i % PAPER.length];
    const n = parseInt(hex.slice(1), 16);
    color.set([((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255], i * 3);
  }
  geo.setAttribute("aPhase", new InstancedBufferAttribute(phase, 1));
  geo.setAttribute("aColor", new InstancedBufferAttribute(color, 3));

  const mat = new ShaderMaterial({
    side: DoubleSide,
    uniforms: { uTime: { value: 0 }, uBright: { value: opts.brightness ?? 1 }, uFlap: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uFlap;
      varying vec3 vView;
      varying vec3 vColor;
      void main() {
        vec3 p = position;
        float w = abs(p.x);
        float flap = sin(uTime * 7.5 + aPhase) * uFlap;
        p.y += flap * w * 0.6;
        p.x *= 1.0 - abs(flap) * 0.1;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vView = mv.xyz;
        vColor = aColor;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uBright;
      varying vec3 vView;
      varying vec3 vColor;
      void main() {
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        vec3 L = normalize(vec3(0.35, 0.85, 0.45));
        float d = abs(dot(n, L));
        vec3 col = vColor * (0.5 + 0.6 * d) * uBright;
        gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
      }`,
  });

  const mesh = new InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;

  const birds: Bird[] = [];
  for (let i = 0; i < count; i++) {
    const offset = new Vector3(
      (Math.random() - 0.5) * 2 * opts.spread.x,
      (Math.random() - 0.5) * 2 * opts.spread.y,
      (Math.random() - 0.5) * 2 * opts.spread.z,
    );
    birds.push({
      pos: opts.spawn(i),
      vel: new Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2),
      offset,
      bank: 0,
      speed: 0.75 + Math.random() * 0.5,
    });
  }

  const dummy = new Object3D();
  const look = new Vector3();
  const desired = new Vector3();
  const sep = new Vector3();
  const prevDir = new Vector3();
  const d = new Vector3();

  function update(dt: number, time: number, target: (i: number, b: Bird) => Vector3) {
    mat.uniforms.uTime.value = time;
    for (let i = 0; i < count; i++) {
      const b = birds[i];
      desired.copy(target(i, b)).sub(b.pos);
      const dist = desired.length();
      // arrive: slow down near the target so they hover instead of overshooting
      const want = Math.min(maxSpeed * b.speed, dist * 1.4 + minSpeed);
      desired.setLength(want);
      // separation
      sep.set(0, 0, 0);
      for (let j = 0; j < count; j++) {
        if (j === i) continue;
        d.copy(b.pos).sub(birds[j].pos);
        const l2 = d.lengthSq();
        const r = scale * 2.2;
        if (l2 < r * r && l2 > 1e-6) sep.addScaledVector(d, (r * r - l2) / (r * r) / Math.sqrt(l2));
      }
      desired.addScaledVector(sep, maxSpeed * 0.9);
      prevDir.copy(b.vel).normalize();
      b.vel.lerp(desired, Math.min(1, dt * 1.6));
      const sp = b.vel.length();
      if (sp < minSpeed) b.vel.setLength(minSpeed);
      b.pos.addScaledVector(b.vel, dt);

      // bank into turns
      const turn = prevDir.x * b.vel.z - prevDir.z * b.vel.x;
      b.bank += (Math.max(-1, Math.min(1, -turn * 1.5)) - b.bank) * Math.min(1, dt * 3);

      dummy.position.copy(b.pos);
      look.copy(b.pos).add(b.vel);
      dummy.lookAt(look);
      dummy.rotateZ(b.bank * 0.9);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function scatter(from: Vector3, strength = maxSpeed * 3) {
    for (const b of birds) {
      d.copy(b.pos).sub(from);
      d.y = Math.abs(d.y) + 0.5;
      b.vel.addScaledVector(d.normalize(), strength * (0.7 + Math.random() * 0.6));
    }
  }

  return {
    mesh,
    birds,
    update,
    scatter,
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
