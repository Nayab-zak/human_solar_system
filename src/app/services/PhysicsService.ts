import * as THREE from 'three';
import { Node } from '../objects/Node';
import { ISimulationConfigs } from '../app.types';
import { BehaviorSubject } from 'rxjs';

export class PhysicsService {
  private static _energyHistory: number[] = [];
  private static _energyAvg: number = 0;
  private static _energy$ = new BehaviorSubject<number>(0);
  static get energy$() { return this._energy$.asObservable(); }

  static computeAttractionForce(
    outer: Node,
    sun: Node,
    k: number
  ): THREE.Vector3 {
    // Get attribute and preference arrays (up to 10 attributes supported)
    const attr = outer.attributes;
    const pref = sun.preferences;
    const n = Math.min(attr.length, pref.length, 10);
    const direction = new THREE.Vector3().subVectors(sun.position, outer.position);
    const distance = Math.max(direction.length(), 0.01); // avoid div by zero
    direction.normalize();

    // 3D force components
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(pref[i] - attr[i]);
      const compat = 1 - diff / 100;
      if (i === 0) x += compat;
      else if (i === 1) y += compat;
      else if (i === 2) z += compat;
      else {
        // For i >= 3, aggregate as a small vector toward the sun
        x += compat * direction.x * 0.2;
        y += compat * direction.y * 0.2;
        z += compat * direction.z * 0.2;
      }
    }
    // Sum and scale by k / distance^2
    const force = new THREE.Vector3(x, y, z);
    force.multiplyScalar(k / (distance * distance));
    return force;
  }

  // ① Compute repulsion force between two nodes (up to 10 attributes)
  static computeRepulsionForce(a: Node, b: Node, kRep: number): THREE.Vector3 {
    // Node extends THREE.Object3D, so .position is valid
    const attrA = a.attributes;
    const attrB = b.attributes;
    const n = Math.min(attrA.length, attrB.length, 10);
    let totalSimilarity = 0;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(attrA[i] - attrB[i]);
      const attrSimilarity = 1 - diff / 100;
      totalSimilarity += attrSimilarity;
    }
    // Normalize similarity to [0, n], so (1 - totalSimilarity/n) is 0 for identical, 1 for maximally different
    const similarityNorm = n > 0 ? totalSimilarity / n : 0;
    const strength = (1 - similarityNorm) * kRep;
    const direction = new THREE.Vector3().subVectors((a as THREE.Object3D).position, (b as THREE.Object3D).position).normalize();
    return direction.multiplyScalar(strength);
  }

  // ③ Helper: forEachPair (O(n^2) for ≤20 nodes is fine)
  static forEachPair<T>(arr: T[], cb: (a: T, b: T) => void): void {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        cb(arr[i], arr[j]);
      }
    }
  }

  // ② Integration: applyForces for all outer nodes (not Sun)
  // Usage: PhysicsService.applyForces(cluster.outerNodes, sun, options)
  static applyForces(outerNodes: Node[], sun: Node, options: { kRep: number; kAttr: number }): void {
    // Reset acceleration for all nodes
    for (const node of outerNodes) {
      (node as any).acceleration = new THREE.Vector3();
    }
    // Repulsion between all unordered pairs
    this.forEachPair(outerNodes, (na, nb) => {
      const f = this.computeRepulsionForce(na, nb, options.kRep);
      (na as any).acceleration.add(f);
      (nb as any).acceleration.sub(f);
    });
    // Attraction to Sun
    for (const node of outerNodes) {
      const f = this.computeAttractionForce(node, sun, options.kAttr);
      (node as any).acceleration.add(f);
    }
  }

  /**
   * Call at end of each integrate step. Monitors total system energy and clamps if runaway.
   * @param nodes All nodes in the system (including sun)
   * @param k Potential energy constant (same as used in attraction/repulsion)
   */
  static monitorEnergy(nodes: Node[], k: number = 1) {
    // Kinetic: sum 0.5 * m * v^2 (m=1)
    let kinetic = 0;
    for (const n of nodes) {
      kinetic += 0.5 * n.velocity.lengthSq();
    }
    // Potential: sum over all unordered pairs (approximate as k/distance)
    let potential = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d > 0.01) potential += k / d;
      }
    }
    const total = kinetic + potential;
    // Rolling average over last 240 frames
    this._energyHistory.push(total);
    if (this._energyHistory.length > 240) this._energyHistory.shift();
    const avg = this._energyHistory.reduce((a, b) => a + b, 0) / this._energyHistory.length;
    this._energyAvg = avg;
    this._energy$.next(total);
    if (total > 1.2 * avg && this._energyHistory.length >= 120) {
      console.warn('[PhysicsService] Energy spike detected, clamping velocities.');
      for (const n of nodes) n.velocity.multiplyScalar(0.9);
    }
  }

  /**
   * Integrate node positions and monitor energy. Call this once per frame.
   * @param nodes All nodes in the system (including sun)
   * @param dt Time step
   * @param k Potential energy constant (same as used in attraction/repulsion)
   */
  static integrate(nodes: Node[], dt: number, k: number = 1) {
    for (const n of nodes) {
      n.updatePosition(dt);
    }
    this.monitorEnergy(nodes, k);
  }
}
