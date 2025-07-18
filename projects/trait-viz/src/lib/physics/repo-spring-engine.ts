import * as THREE from 'three';
import { TraitNode } from '../models/node';
import { compatibility, similarity } from './math';

export interface RepoSpringConfig {
  /** Base spring strength. */
  kAttraction: number;
  /** Base repulsion strength. */
  kRepulsion: number;
  /** Velocity damping (0..1) per step. */
  damping: number;
  /** Angular swirl (radians / sec) applied about Y axis. */
  angularSpeed: number;
  /** Target orbital radius around central. */
  restLength: number;
  /** Fixed timestep seconds (e.g., 1/60). */
  dt: number;
}

export interface CentralRuntime {
  node: TraitNode;
  prefsArr: number[]; // cached ordered preferences
  position: THREE.Vector3; // always origin (for now)
}

export interface OuterRuntime {
  node: TraitNode;
  attrsArr: number[];
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
}

export class RepoSpringEngine {
  central: CentralRuntime;
  outers: OuterRuntime[];
  keys: string[];
  cfg: RepoSpringConfig;

  constructor(
    centralNode: TraitNode,
    outerNodes: TraitNode[],
    traitKeys: string[],
    cfg: RepoSpringConfig
  ){
    this.keys = traitKeys;
    this.central = {
      node: centralNode,
      prefsArr: traitKeys.map(k => centralNode.preferences[k] ?? 0),
      position: new THREE.Vector3(0,0,0),
    };
    this.outers = outerNodes.map(n => ({
      node: n,
      attrsArr: traitKeys.map(k => n.traits[k] ?? 0),
      position: n.mesh ? n.mesh.position.clone() :
                new THREE.Vector3(
                  (Math.random()-0.5)*100,
                  (Math.random()-0.5)*100,
                  (Math.random()-0.5)*100
                ),
      velocity: n.velocity ?? new THREE.Vector3(),
      mass: 1,
    }));
    this.cfg = cfg;
  }

  /** Re-sync trait arrays if user edits values. Call before step if needed. */
  refreshTraits(){
    const {keys} = this;
    this.central.prefsArr = keys.map(k => this.central.node.preferences[k] ?? 0);
    this.outers.forEach(o => {
      o.attrsArr = keys.map(k => o.node.traits[k] ?? 0);
    });
  }

  step(dtOverride?: number){
    const dt = dtOverride ?? this.cfg.dt;
    const {
      kAttraction, kRepulsion, damping,
      angularSpeed, restLength
    } = this.cfg;

    const n = this.outers.length;
    const forces = this.outers.map(()=>new THREE.Vector3());

    // Compatibility scaling
    const prefs = this.central.prefsArr;
    const compatArr = this.outers.map(o => compatibility(prefs, o.attrsArr)); // 0..1

    // Similarities matrix
    const simMatrix:number[][] = Array.from({length:n},()=>Array(n).fill(1));
    for (let i=0;i<n;i++){
      for (let j=i+1;j<n;j++){
        const s = similarity(this.outers[i].attrsArr, this.outers[j].attrsArr);
        simMatrix[i][j] = simMatrix[j][i] = s;
      }
    }

    // Central spring
    for (let i=0;i<n;i++){
      const o = this.outers[i];
      const toC = new THREE.Vector3().subVectors(this.central.position, o.position);
      const dist = toC.length();
      if (dist > 0) {
        const dir = toC.multiplyScalar(1/dist);
        const compatScale = 0.2 + 0.8 * compatArr[i]; // requested: scale by compat
        const stretch = dist - restLength;            // Hooke offset
        // F = -k * stretch (clamped to prevent excessive forces)
        const fMag = Math.max(-10, Math.min(10, -kAttraction * compatScale * stretch));
        forces[i].addScaledVector(dir, fMag);
      }
    }

    // Outer repulsion (similarity-weighted, short range)
    const minSep = restLength * 0.9;
    for (let i=0;i<n;i++){
      const oi = this.outers[i];
      for (let j=i+1;j<n;j++){
        const oj = this.outers[j];
        const d = new THREE.Vector3().subVectors(oj.position, oi.position);
        const dist = d.length();
        if (dist === 0) continue;
        const dir = d.multiplyScalar(1/dist);
        if (dist < minSep){
          const overlap = (minSep - dist);
          // Repel more when nodes are similar (high similarity = more repulsion)
          const fMag = Math.max(0, Math.min(5, kRepulsion * simMatrix[i][j] * overlap));
          forces[i].addScaledVector(dir, -fMag);
          forces[j].addScaledVector(dir,  fMag);
        }
      }
    }

    // Integrate
    for (let i=0;i<n;i++){
      const o = this.outers[i];
      o.velocity.addScaledVector(forces[i], dt / o.mass);
      o.velocity.multiplyScalar(damping);
      o.position.addScaledVector(o.velocity, dt);
    }

    // Angular swirl about Y
    if (angularSpeed !== 0){
      const angle = angularSpeed * dt;
      const rot = new THREE.Matrix4().makeRotationY(angle);
      for (let i=0;i<n;i++){
        this.outers[i].position.applyMatrix4(rot);
      }
    }
  }
}
