import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { StarField } from './StarField';

export class SceneFactory {
  static materials: any;

  static createScene(width: number, height: number) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    // Add lights
    scene.add(new THREE.AmbientLight(0xbbbbbb, 1));
    scene.add(new THREE.DirectionalLight(0xffffff, 1));

    // ① Materials
    const neonPurple = 0xC300FF, neonPink = 0xFF3366;
    this.materials = {
      sun: new THREE.MeshPhysicalMaterial({ color: neonPurple, emissive: neonPurple, emissiveIntensity: 4 }),
      planet: new THREE.MeshStandardMaterial({ color: neonPink, emissive: neonPink, emissiveIntensity: 1 })
    };

    // ② Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.5, 0.1));

    // ③ Background & stars
    scene.background = new THREE.Color(0x1A1A1A);
    StarField.create(scene, { count: 5000, colors: [neonPurple, neonPink] });

    // ④ EXPORT
    return { scene, camera, renderer, composer, materials: this.materials };
  }
}
