import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';

export interface PostFXBundle {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
}

export function initPostFX(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  strength=0.6,
  radius=0.2,
  threshold=0.25
): PostFXBundle {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    strength, radius, threshold
  );
  composer.addPass(bloom);
  return {composer, bloom};
}
