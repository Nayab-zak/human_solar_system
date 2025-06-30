import * as THREE from 'three';

export class StarField {
  static create(scene: THREE.Scene, opts: { count: number; colors: number[] }) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(opts.count * 3);
    const colors = new Float32Array(opts.count * 3);
    for (let i = 0; i < opts.count; i++) {
      const r = 40 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[3 * i] = x;
      positions[3 * i + 1] = y;
      positions[3 * i + 2] = z;
      const color = new THREE.Color(opts.colors[i % opts.colors.length]);
      colors[3 * i] = color.r;
      colors[3 * i + 1] = color.g;
      colors[3 * i + 2] = color.b;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 0.15, vertexColors: true });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
  }
}
