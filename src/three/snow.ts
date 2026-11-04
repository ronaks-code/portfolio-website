// GPU snow: positions wrap vertically in the vertex shader, so the CPU only
// updates a few uniforms per frame. Optional pointer interaction: flakes part
// around the cursor ray, and a "gust" blows them outward from a click.
import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from "three";

export type Snow = {
  points: Points;
  uniforms: {
    uTime: { value: number };
    uPixelRatio: { value: number };
    uWind: { value: number };
    uRay: { value: Vector3 };
    uRepel: { value: number };
    uGust: { value: number };
    uGustRay: { value: Vector3 };
    uSize: { value: number };
  };
};

export function createSnow(opts: {
  count: number;
  /** box: x/z half extents and height */
  box: { x: number; y: number; z: number; zOffset?: number; yOffset?: number };
  size?: number;
}): Snow {
  const { count, box } = opts;
  const geo = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 2 * box.x;
    pos[i * 3 + 1] = Math.random() * box.y;
    pos[i * 3 + 2] = (box.zOffset ?? 0) + (Math.random() - 0.5) * 2 * box.z;
    seed[i] = Math.random();
  }
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uWind: { value: 0 },
    uRay: { value: new Vector3(0, 0, -1) },
    uRepel: { value: 0 },
    uGust: { value: 0 },
    uGustRay: { value: new Vector3(0, 0, -1) },
    uSize: { value: opts.size ?? 1 },
  };

  const mat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime, uPixelRatio, uWind, uRepel, uGust, uSize;
      uniform vec3 uRay, uGustRay;
      attribute float aSeed;
      varying float vAlpha;
      const float H = ${box.y.toFixed(1)};
      const float Y0 = ${(box.yOffset ?? 0).toFixed(1)};
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * (1.0 + aSeed * 1.6) * H * 0.035, H);
        float fade = smoothstep(0.0, H * 0.1, p.y) * smoothstep(H, H * 0.86, p.y);
        p.y += Y0;
        p.x += sin(uTime * 0.55 + aSeed * 40.0) * H * 0.018 + uWind * (H - p.y + Y0) * 0.04;
        p.z += cos(uTime * 0.35 + aSeed * 23.0) * H * 0.012;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;

        // part around the pointer ray (view space), radius grows with depth
        vec2 toFlake = mv.xy - uRay.xy * depth;
        float r = 0.11 * depth;
        float f = exp(-dot(toFlake, toFlake) / (r * r)) * uRepel;
        mv.xy += normalize(toFlake + 1e-4) * f * r * 1.3;

        // gust from a click
        vec2 g = mv.xy - uGustRay.xy * depth;
        float gr = 0.6 * depth;
        float gf = exp(-dot(g, g) / (gr * gr)) * uGust;
        mv.xy += normalize(g + 1e-4) * gf * gr * 0.9;

        gl_Position = projectionMatrix * mv;
        gl_PointSize = (0.9 + aSeed * 1.6) * uSize * uPixelRatio * (90.0 / depth) * (1.0 + gf * 0.6);
        vAlpha = fade * clamp(1.4 - depth / (${(box.z * 2.2).toFixed(1)} + 20.0), 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vAlpha * 0.9;
        if (a < 0.01) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }`,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}
