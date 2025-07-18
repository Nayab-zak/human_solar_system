import * as THREE from 'three';

/**
 * Every node has both traits (used when node is OUTER)
 * and preferences (used when node is CENTRAL).
 * This mirrors your original repo design, so any node can become central.
 */
export interface NodeTraits {
  [key: string]: number; // attrOne, attrTwo, ...
}

export interface TraitNode {
  id: string;
  traits: NodeTraits;
  preferences: NodeTraits;
  velocity: THREE.Vector3;
  mesh?: THREE.Object3D;
}
