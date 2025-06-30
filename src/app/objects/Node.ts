import * as THREE from 'three';
import { ISimulationConfigs, INodeData, ISwapAnimation } from '../app.types';

export class Node extends THREE.Object3D {
  options: ISimulationConfigs;
  velocity: THREE.Vector3;
  isSun: boolean;
  attributes: number[];
  preferences: number[];
  preference: number = 0;
  mesh: THREE.Mesh;
  swap: ISwapAnimation | null = null;

  constructor(data: INodeData, options: ISimulationConfigs) {
    super();
    this.options = options;
    this.position.fromArray(data.initialPosition);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.userData = { ...data };
    this.isSun = data.isSun;

    this.attributes = data.attributes
      ? [...Object.values(data.attributes)]
      : Array.from({ length: 10 }, () => Math.floor(Math.random() * 99));

    this.preferences = data.preferences
      ? [...Object.values(data.preferences)]
      : Array.from({ length: 10 }, () => Math.floor(Math.random() * 99));

    // Create a sphere mesh for visualization
    const sphereColor = new THREE.Color(data.color);
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 64, 64),
      new THREE.MeshStandardMaterial({
        color: sphereColor,
        metalness: 0.5,
        roughness: 0.3,
      })
    );
    this.add(this.mesh);
  }

  setSun(state: boolean = !this.isSun, preference?: number): void {
    this.isSun = state;

    // Build a neomorphic‑style purple material
    if (state) {
      this.mesh.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#9B4DFF'), // Soft purple (Tailwind's purple-400 equivalent)
        emissive: new THREE.Color('#7C3AED'), // Darker purple for the "glow" or highlight
        emissiveIntensity: 0.3, // Soft light glow
        metalness: 0.1, // Low metalness for soft, diffused light
        roughness: 0.8, // Higher roughness for softer highlights
        flatShading: true, // Gives the surface a more 'flat' look which is common in neumorphism
      });
      // Apply a slight inset shadow effect by modifying the emissive and ambient lighting
      this.mesh.material.side = THREE.DoubleSide;
      this.mesh.material.shadowSide = THREE.FrontSide;
      this.mesh.material.opacity = 1;
    } else {
      // fallback “planet” look
      this.mesh.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#22C55E'), // Tailwind green‑500 for contrast
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
        metalness: 0.1,
        roughness: 0.8,
        clearcoat: 0,
      });
    }

    if (preference !== undefined) {
      this.preference = preference;
    }
  }

  calculatePreferredCompatibility(sun: Node): number {
    const sunPreferences = sun.preferences;
    const planetAttributes = this.attributes;
    let diffSum = 0;
    for (let i = 0; i < sunPreferences.length; i++) {
      diffSum += Math.abs(sunPreferences[i] - planetAttributes[i]);
    }
    const maxDiff = sunPreferences.length * 100;
    return 1 - diffSum / maxDiff;
  }

  calculateAttributeCompatibility(other: Node): number {
    const attributesA = this.attributes;
    const attributesB = other.attributes;
    let diffSum = 0;
    for (let i = 0; i < attributesA.length; i++) {
      diffSum += Math.abs(attributesA[i] - attributesB[i]);
    }
    const maxDiff = attributesA.length * 100;
    return 1 - diffSum / maxDiff;
  }

  private calculateSunForce(sun: Node): THREE.Vector3 {
    let force = new THREE.Vector3();
    const compatibility = this.calculatePreferredCompatibility(sun);
    const desiredDistance = 1 + (1 - compatibility) * 3;
    const currentDistance = sun.position.distanceTo(this.position);
    const error = currentDistance - desiredDistance;
    const directionToSun = new THREE.Vector3()
      .subVectors(sun.position, this.position)
      .normalize();

    if (currentDistance < desiredDistance) {
      const repulsionForce =
        -this.options.sun.repulsion *
        (desiredDistance - currentDistance) *
        compatibility;
      force.add(directionToSun.multiplyScalar(repulsionForce));
    } else {
      const attractionForce =
        2 * this.options.sun.attraction * error * compatibility + 0.001;
      force.add(directionToSun.multiplyScalar(attractionForce));
    }

    return force;
  }

  private calculatePlanetAttraction(nodes: Node[]): THREE.Vector3 {
    let attractionForce = new THREE.Vector3();
    const attractionConstant = 0.001;
    nodes.forEach((other) => {
      if (other !== this && !other.isSun) {
        const compatibility = this.calculateAttributeCompatibility(other);
        const forceMagnitude = attractionConstant * compatibility - 0.001;
        const attractionDirection = new THREE.Vector3()
          .subVectors(other.position, this.position)
          .normalize();
        attractionForce.add(attractionDirection.multiplyScalar(forceMagnitude));
      }
    });
    return attractionForce;
  }

  private calculatePlanetRepulsion(nodes: Node[]): THREE.Vector3 {
    let repulsionForce = new THREE.Vector3();
    nodes.forEach((other) => {
      if (other !== this && !other.isSun) {
        const distance = this.position.distanceTo(other.position);
        if (distance < this.options.planet.repulsionInitializationThreshold) {
          const compatibility = this.calculateAttributeCompatibility(other);
          const repulsion =
            this.options.planet.repulsion *
              (this.options.planet.repulsionInitializationThreshold -
                distance) *
              (1 - compatibility) +
            0.001;
          const repulsionDirection = new THREE.Vector3()
            .subVectors(this.position, other.position)
            .normalize();
          repulsionForce.add(repulsionDirection.multiplyScalar(repulsion));
        }
      }
    });
    return repulsionForce;
  }

  // Update position with velocity, damping, and max velocity
  updatePosition(dt: number): void {
    // If no acceleration property, add it
    if (!(this as any).acceleration) {
      (this as any).acceleration = new THREE.Vector3();
    }
    const acceleration: THREE.Vector3 = (this as any).acceleration;
    // velocity += acceleration * dt
    this.velocity.add(acceleration.clone().multiplyScalar(dt));
    // velocity *= damping
    this.velocity.multiplyScalar(this.options.damping ?? 0.95);
    // Clamp velocity to maxVelocity
    const maxVel = this.options.maxVelocity ?? 3;
    if (this.velocity.lengthSq() > maxVel * maxVel) {
      this.velocity.setLength(maxVel);
    }
    // position += velocity * dt
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    // acceleration = 0
    acceleration.set(0, 0, 0);
  }

  update(nodes: Node[]): void {
    if (this.swap) {
      this.handleSwapAnimation();
      return;
    }
    if (this.isSun) return;
    let totalForce = new THREE.Vector3();
    const sun = nodes.find((n) => n.isSun);
    if (sun) {
      totalForce.add(this.calculateSunForce(sun));
    }
    totalForce.add(this.calculatePlanetRepulsion(nodes));
    totalForce.add(this.calculatePlanetAttraction(nodes));
    totalForce.multiplyScalar(this.options.velocityDamping);
    this.applyForces(totalForce);
  }

  private applyForces(force: THREE.Vector3): void {
    this.velocity.add(force);
    if (this.velocity.length() > this.options.maxVelocity) {
      this.velocity.setLength(this.options.maxVelocity);
    }
    this.velocity.multiplyScalar(this.options.velocityDamping);
    this.position.add(this.velocity);
  }

  private handleSwapAnimation(): void {
    if (!this.swap) return;
    const currentSwap = this.swap;
    const currentTime = performance.now();
    let progress = (currentTime - currentSwap.startTime) / currentSwap.duration;
    if (progress >= 1) {
      progress = 1;
      this.velocity.set(0, 0, 0);
      this.swap = null;
    }
    this.position.copy(
      currentSwap.start.clone().lerp(currentSwap.end, progress)
    );
  }
}
