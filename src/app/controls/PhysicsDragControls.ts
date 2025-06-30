import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { Cluster } from '../objects/Cluster';

export class PhysicsDragControls extends DragControls {
  onDragMoved?: (payload: { id: string; pos: THREE.Vector3 }) => void;
  private cluster: Cluster;

  constructor(meshes: THREE.Object3D[], camera: THREE.Camera, dom: HTMLElement, cluster: Cluster) {
    super(meshes, camera, dom);
    this.cluster = cluster;
    this.addEventListener('dragstart', (event: any) => {
      // TODO: Implement pauseSimulation on Cluster or handle simulation pause here
      // this.cluster.pauseSimulation();
    });
    this.addEventListener('dragend', (event: any) => {
      if (event.object && event.object.parent && event.object.parent.velocity) {
        event.object.parent.velocity.set(0, 0, 0);
        if (this.onDragMoved) {
          this.onDragMoved({ id: event.object.parent.userData.id, pos: event.object.parent.position.clone() });
        }
      }
      // TODO: Implement resumeSimulation on Cluster or handle simulation resume here
      // this.cluster.resumeSimulation();
    });
  }
}
