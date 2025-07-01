import * as THREE from 'three';

export interface Node {
  id: string;
  attributes: number[];
  velocity: THREE.Vector3;
  mesh?: THREE.Mesh;
}
