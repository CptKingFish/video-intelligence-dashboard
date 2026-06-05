"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { sampleActivation } from "@/lib/analysis/brain-scan";
import type { BrainActivationPoint } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Procedural noise (CPU) — value noise + fbm for gyri and activation */
/* ------------------------------------------------------------------ */

function hash3(x: number, y: number, z: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const c000 = hash3(xi, yi, zi);
  const c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi);
  const c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1);
  const c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1);
  const c111 = hash3(xi + 1, yi + 1, zi + 1);

  const x00 = lerp(c000, c100, u);
  const x10 = lerp(c010, c110, u);
  const x01 = lerp(c001, c101, u);
  const x11 = lerp(c011, c111, u);
  const y0 = lerp(x00, x10, v);
  const y1 = lerp(x01, x11, v);
  return lerp(y0, y1, w);
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * freq, y * freq, z * freq);
    freq *= 2;
    amplitude *= 0.5;
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* Brain geometry — icosphere displaced into a folded cortical blob   */
/* ------------------------------------------------------------------ */

function buildBrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const count = pos.count;
  const seeds = new Float32Array(count);

  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(pos, i).normalize();

    // Ellipsoid: longer front-to-back (z), flatter top-to-bottom (y).
    const ex = v.x * 1.0;
    const ey = v.y * 0.82;
    const ez = v.z * 1.18;

    // Gyri / sulci folds via fbm displacement along the surface normal.
    const folds = fbm(v.x * 3.1 + 5, v.y * 3.1, v.z * 3.1, 4) - 0.5;
    let r = 1 + folds * 0.16;

    // Longitudinal fissure: carve a groove along the top midline (x ~ 0).
    const midline = Math.exp(-(v.x * v.x) / 0.0025) * Math.max(0, v.y);
    r -= midline * 0.12;

    pos.setXYZ(i, ex * r, ey * r, ez * r);

    // Low-frequency seed used to place activation regions on the cortex.
    seeds[i] = fbm(v.x * 1.7 - 9, v.y * 1.7 + 3, v.z * 1.7, 3);
  }

  pos.needsUpdate = true;
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ */
/* Shaders — turbo colormap heatmap with emissive hotspots            */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  attribute float aSeed;
  varying float vSeed;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    vSeed = aSeed;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uActivation;
  uniform float uTime;
  varying float vSeed;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  vec3 turbo(float t) {
    t = clamp(t, 0.0, 1.0);
    float t2 = t * t;
    float t3 = t2 * t;
    float t4 = t3 * t;
    float t5 = t4 * t;
    float r = 0.13572138 + 4.61539260 * t - 42.66032258 * t2 + 132.13108234 * t3 - 152.94239396 * t4 + 59.28637943 * t5;
    float g = 0.09140261 + 2.19418839 * t + 4.84296658 * t2 - 14.18503333 * t3 + 4.27729857 * t4 + 2.82956604 * t5;
    float b = 0.10667330 + 12.64194608 * t - 60.58204836 * t2 + 110.36276771 * t3 - 89.90310912 * t4 + 27.34824973 * t5;
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  void main() {
    // Living shimmer so the cortex never looks static.
    float shimmer = sin(uTime * 1.3 + vSeed * 22.0) * 0.04;
    float seed = clamp(vSeed + shimmer, 0.0, 1.0);

    // As global activation rises, the firing threshold drops so more of the
    // cortex lights up — mimicking spreading fMRI activation.
    float level = uActivation;
    float threshold = 1.0 - level;
    float intensity = smoothstep(threshold - 0.22, threshold + 0.05, seed);
    intensity *= level;

    // Cool slate cortex underneath, turbo heatmap on top.
    vec3 cortex = vec3(0.16, 0.18, 0.24);
    vec3 heat = turbo(0.25 + intensity * 0.75);
    vec3 color = mix(cortex, heat, intensity);

    // Simple wrapped lighting + rim for depth.
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(0.4, 0.7, 0.8));
    float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    vec3 V = normalize(-vViewPos);
    float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5);

    vec3 lit = color * (0.45 + 0.65 * diff);
    lit += heat * intensity * 0.9;            // emissive glow on hotspots
    lit += vec3(0.30, 0.45, 0.85) * rim * 0.35; // bluish rim light

    gl_FragColor = vec4(lit, 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Mesh + scene                                                        */
/* ------------------------------------------------------------------ */

function BrainMesh({
  activation,
  currentTime,
}: {
  activation: BrainActivationPoint[];
  currentTime: number;
}) {
  const geometry = React.useMemo(() => buildBrainGeometry(), []);
  const uniforms = React.useMemo(
    () => ({
      uActivation: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );

  const materialRef = React.useRef<THREE.ShaderMaterial>(null);
  const eased = React.useRef(0);

  // `useFrame` re-registers each render, so reading `currentTime` here always
  // sees the latest throttled playback cursor.
  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const target = sampleActivation(activation, currentTime);
    // Ease toward the target so pulses feel organic rather than steppy.
    eased.current += (target - eased.current) * Math.min(1, delta * 4);
    material.uniforms.uActivation.value = eased.current;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh geometry={geometry} rotation={[0.1, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function BrainScan3D({
  activation,
  currentTime,
}: {
  activation: BrainActivationPoint[];
  currentTime: number;
  duration: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.3], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.4} />
      <BrainMesh activation={activation} currentTime={currentTime} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
    </Canvas>
  );
}

export default BrainScan3D;
