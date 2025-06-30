import * as THREE from 'three';

export class SpaceDust {
  private points: THREE.Points | null = null;
  private uniforms: any;
  private lowPower: boolean;

  constructor(scene: THREE.Scene, lowPower: boolean = false) {
    this.lowPower = lowPower;
    if (lowPower) {
      // Fallback: static opaque texture
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(5000 * 3);
      for (let i = 0; i < 5000; i++) {
        positions[3 * i] = (Math.random() - 0.5) * 80;
        positions[3 * i + 1] = (Math.random() - 0.5) * 80;
        positions[3 * i + 2] = (Math.random() - 0.5) * 80;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, opacity: 0.7, transparent: true });
      this.points = new THREE.Points(geometry, material);
      scene.add(this.points);
      return;
    }
    // Shader uniforms
    this.uniforms = {
      uTime: { value: 0 },
      uMassivePositions: { value: new Array(20).fill(new THREE.Vector3()) },
      uMassiveCount: { value: 0 },
      uViewVector: { value: new THREE.Vector3() },
    };
    // Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      positions[3 * i] = (Math.random() - 0.5) * 80;
      positions[3 * i + 1] = (Math.random() - 0.5) * 80;
      positions[3 * i + 2] = (Math.random() - 0.5) * 80;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Shaders
    const vertexShader = `
      uniform float uTime;
      uniform vec3 uMassivePositions[20];
      uniform int uMassiveCount;
      uniform vec3 uViewVector;
      varying float vGlow;
      void main() {
        vec3 p = position;
        float effect = 0.0;
        for (int i = 0; i < 20; i++) {
          if (i >= uMassiveCount) break;
          float d = length(p - uMassivePositions[i]);
          effect += 1.0 / (0.2 + d * 0.15);
        }
        vGlow = effect;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = 2.0 + 8.0 * vGlow;
      }
    `;
    const fragmentShader = `
      varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.2, d) * clamp(vGlow, 0.2, 1.0);
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);
  }

  updateUniforms(massivePositions: THREE.Vector3[]): void {
    if (!this.uniforms) return;
    for (let i = 0; i < 20; i++) {
      this.uniforms.uMassivePositions.value[i] = massivePositions[i] || new THREE.Vector3();
    }
    this.uniforms.uMassiveCount.value = Math.min(massivePositions.length, 20);
  }
}
