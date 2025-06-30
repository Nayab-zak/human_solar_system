import * as THREE from 'three';
import { Node } from '../../objects/Node';

class OctreeCell {
  min: THREE.Vector3;
  max: THREE.Vector3;
  nodes: Node[] = [];
  children: OctreeCell[] | null = null;

  constructor(min: THREE.Vector3, max: THREE.Vector3) {
    this.min = min;
    this.max = max;
  }

  contains(node: Node): boolean {
    const p = node.position;
    return (
      p.x >= this.min.x && p.x <= this.max.x &&
      p.y >= this.min.y && p.y <= this.max.y &&
      p.z >= this.min.z && p.z <= this.max.z
    );
  }

  intersectsSphere(center: THREE.Vector3, radius: number): boolean {
    // AABB-sphere intersection
    let d = 0;
    for (const axis of ['x', 'y', 'z'] as const) {
      if (center[axis] < this.min[axis]) d += (center[axis] - this.min[axis]) ** 2;
      else if (center[axis] > this.max[axis]) d += (center[axis] - this.max[axis]) ** 2;
    }
    return d <= radius * radius;
  }
}

export class LooseOctree {
  private root: OctreeCell;
  private depth: number = 2;
  private bounds: number = 16;

  constructor() {
    const min = new THREE.Vector3(-this.bounds, -this.bounds, -this.bounds);
    const max = new THREE.Vector3(this.bounds, this.bounds, this.bounds);
    this.root = new OctreeCell(min, max);
  }

  insert(node: Node): void {
    this._insert(this.root, node, 0);
  }

  update(node: Node): void {
    // For simplicity, rebuild is recommended for moving nodes
    // Could remove and re-insert, but not needed for small n
  }

  query(node: Node, radius: number): Node[] {
    const found: Set<Node> = new Set();
    this._query(this.root, node.position, radius, found);
    found.delete(node); // Exclude self
    return Array.from(found);
  }

  rebuild(nodes: Node[]): void {
    const min = new THREE.Vector3(-this.bounds, -this.bounds, -this.bounds);
    const max = new THREE.Vector3(this.bounds, this.bounds, this.bounds);
    this.root = new OctreeCell(min, max);
    for (const n of nodes) this.insert(n);
  }

  private _insert(cell: OctreeCell, node: Node, depth: number): void {
    if (depth >= this.depth) {
      cell.nodes.push(node);
      return;
    }
    if (!cell.children) {
      cell.children = [];
      const mid = new THREE.Vector3().addVectors(cell.min, cell.max).multiplyScalar(0.5);
      for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++)
          for (let dz = 0; dz < 2; dz++) {
            const cmin = new THREE.Vector3(
              dx === 0 ? cell.min.x : mid.x,
              dy === 0 ? cell.min.y : mid.y,
              dz === 0 ? cell.min.z : mid.z
            );
            const cmax = new THREE.Vector3(
              dx === 0 ? mid.x : cell.max.x,
              dy === 0 ? mid.y : cell.max.y,
              dz === 0 ? mid.z : cell.max.z
            );
            cell.children.push(new OctreeCell(cmin, cmax));
          }
    }
    for (const child of cell.children) {
      if (child.contains(node)) {
        this._insert(child, node, depth + 1);
        return;
      }
    }
    // If not contained in any child, put in this cell
    cell.nodes.push(node);
  }

  private _query(cell: OctreeCell, center: THREE.Vector3, radius: number, found: Set<Node>): void {
    if (!cell.intersectsSphere(center, radius)) return;
    for (const n of cell.nodes) {
      if (n.position.distanceTo(center) <= radius) found.add(n);
    }
    if (cell.children) {
      for (const child of cell.children) {
        this._query(child, center, radius, found);
      }
    }
  }
}
