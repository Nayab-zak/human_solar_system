import * as THREE from 'three';
import { getCircleTexture } from './circle-texture';

export function makeGlowySpriteMaterial(color: THREE.Color | number): THREE.SpriteMaterial {
  const c = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.SpriteMaterial({
    map: getCircleTexture(),
    color: c,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });
}
