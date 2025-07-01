import * as THREE from 'three';
import { Node } from './node.interface';

export class PhysicsService {
  /**
   * Calculates compatibility between two vectors (e.g., preferences and attributes).
   * Returns a value between 0 and 1 (higher is more compatible).
   */
  static calculateCompatibility(pref: number[], attr: number[]): number {
    if (pref.length !== attr.length) return 0;
    // Example: 1 - normalized Euclidean distance
    const dist = Math.sqrt(pref.reduce((sum, p, i) => sum + Math.pow(p - attr[i], 2), 0));
    const maxDist = Math.sqrt(pref.length * Math.pow(100, 2)); // assuming 0-100 scale
    return 1 - dist / maxDist;
  }

  /**
   * Calculates similarity between two attribute vectors (cosine similarity).
   * Returns a value between -1 and 1.
   */
  static calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }

  /**
   * Computes forces on each node due to the central node and other nodes.
   * Uses inverse-square law for attraction/repulsion per attribute.
   */
  static computeForces(nodes: Node[], central: Node, constants: { k: number; kRep: number }): Map<Node, THREE.Vector3> {
    const forces = new Map<Node, THREE.Vector3>();
    for (const node of nodes) {
      let force = new THREE.Vector3();
      // Attraction to central node (per attribute)
      if (central.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
          const diff = central.attributes[i] - node.attributes[i];
          // Inverse-square law: F = k * diff / (|diff|^2 + 1)
          const f = constants.k * diff / (Math.pow(diff, 2) + 1);
          force.addScalar(f); // For demo: add to all axes equally
        }
      }
      // Repulsion from other nodes
      for (const other of nodes) {
        if (other === node) continue;
        for (let i = 0; i < node.attributes.length; i++) {
          const diff = node.attributes[i] - other.attributes[i];
          const f = constants.kRep * diff / (Math.pow(diff, 2) + 1);
          force.addScalar(f); // For demo: add to all axes equally
        }
      }
      forces.set(node, force);
    }
    return forces;
  }
}
