import * as THREE from 'three';

/**
 * Returns an additive billboard sprite material with a soft radial falloff.
 * color: THREE.Color | hex
 * sizeAttenuation disabled because we render as Sprite (pixel-ish); we scale object.
 */
export function makeGlowySpriteMaterial(color: THREE.Color | number): THREE.SpriteMaterial {
  const c = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.SpriteMaterial({
    color: c,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    opacity: 1.0,
    // built-in textureless sprite: we'll use alpha in fragment; default round.
  });
}
