import * as THREE from 'three';

/** Map 0..1 compat to Blueyard-esque colors. */
export function compatToColor(t: number, out = new THREE.Color()): THREE.Color {
  // clamp
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) out.set('#ff4fd2');       // magenta (low compat)
  else if (t < 0.5) out.set('#7e6bff');   // violet
  else if (t < 0.75) out.set('#1d8bff');  // blue
  else out.set('#8ee1ff');                // cyan (high compat)
  return out;
}
