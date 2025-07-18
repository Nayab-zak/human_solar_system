import * as THREE from 'three';

/** Tuned from reference screenshot. Adjust only if you want theme variants. */
export const BY_CYAN     = new THREE.Color('#6ee7ff'); // bright inner
export const BY_VIOLET   = new THREE.Color('#c084fc'); // mid
export const BY_MAGENTA  = new THREE.Color('#ff1dce'); // outer accent
export const BY_FAR_DARK = new THREE.Color('#0b0b1e'); // deep space

/** Radial gradient for fallback background clearColor. */
export const BY_BG_CLEAR = 0x000000; // renderer clear; gradient done in particles
