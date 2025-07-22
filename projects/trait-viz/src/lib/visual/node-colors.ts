import * as THREE from 'three';

// Warmer, more galaxy-compatible central color
export const COLOR_CENTRAL_YELLOW = new THREE.Color('#ffeb3b'); // warm golden yellow
export const COLOR_CENTRAL_WARM = new THREE.Color('#ffa726');   // warm orange-gold alternative
export const COLOR_CENTRAL_BRIGHT = new THREE.Color('#64ffda'); // bright cyan alternative

/** Map 0..1 compat to enhanced Blueyard galaxy colors (low compat=>magenta, high compat=>cyan). */
export function compatToColor(t: number, out = new THREE.Color()): THREE.Color {
  t = Math.max(0, Math.min(1, t));
  
  // Enhanced gradient matching the new galaxy color zones
  if (t < 0.2) {
    // Low compatibility: bright magenta (outer galaxy color)
    out.set('#ff4fd2');
  } else if (t < 0.4) {
    // Medium-low: violet-purple mix
    const mix = (t - 0.2) / 0.2;
    out.set('#ff4fd2').lerp(new THREE.Color('#7e6bff'), mix);
  } else if (t < 0.6) {
    // Medium: violet to blue transition
    const mix = (t - 0.4) / 0.2;
    out.set('#7e6bff').lerp(new THREE.Color('#1a8dff'), mix);
  } else if (t < 0.8) {
    // Medium-high: blue to cyan transition
    const mix = (t - 0.6) / 0.2;
    out.set('#1a8dff').lerp(new THREE.Color('#4fc9ff'), mix);
  } else {
    // High compatibility: bright cyan (core galaxy color)
    const mix = (t - 0.8) / 0.2;
    out.set('#4fc9ff').lerp(new THREE.Color('#9fe9ff'), mix);
  }
  
  return out;
}
