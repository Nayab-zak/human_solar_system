// PerformanceService.ts
// Provides spatial partitioning (uniform grid) to prune pairwise force calculations for node physics
// Ensures simulation remains performant for up to 20 nodes (target <100ms/frame)

import * as THREE from 'three';

export interface GridCell {
  indices: number[]; // indices of nodes in this cell
}

export class UniformGrid {
  private cellSize: number;
  private grid: Map<string, { nodes: any[] }>;

  constructor(cellSize: number = 20) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getCellKey(pos: THREE.Vector3): string {
    const x = Math.floor(pos.x / this.cellSize);
    const y = Math.floor(pos.y / this.cellSize);
    const z = Math.floor(pos.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  build(nodes: { position: THREE.Vector3, ref: any }[]): void {
    this.grid.clear();
    nodes.forEach((node) => {
      const key = this.getCellKey(node.position);
      if (!this.grid.has(key)) this.grid.set(key, { nodes: [] });
      this.grid.get(key)!.nodes.push(node.ref);
    });
  }

  // Returns possible neighbor node references for a given node
  getNeighborRefs(node: { position: THREE.Vector3 }): any[] {
    const neighbors: Set<any> = new Set();
    const baseKey = this.getCellKey(node.position);
    const [bx, by, bz] = baseKey.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${bx + dx},${by + dy},${bz + dz}`;
          const cell = this.grid.get(key);
          if (cell) {
            cell.nodes.forEach(n => neighbors.add(n));
          }
        }
      }
    }
    return Array.from(neighbors);
  }
}

export class PerformanceService {
  private grid: UniformGrid;
  private cellSize: number;

  constructor(cellSize: number = 20) {
    this.cellSize = cellSize;
    this.grid = new UniformGrid(cellSize);
  }

  // Call this each frame before force calculations
  update(nodes: { position: THREE.Vector3, ref: any }[]): void {
    this.grid.build(nodes);
  }

  // For a given node, get indices of possible neighbors (for force calculation)
  getNeighbors(node: { position: THREE.Vector3 }): any[] {
    return this.grid.getNeighborRefs(node);
  }
}
