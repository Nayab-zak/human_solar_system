import * as THREE from 'three';
import { PhysicsService } from './PhysicsService';
import { Node } from './node.interface';

describe('PhysicsService', () => {
  describe('calculateCompatibility', () => {
    it('returns 1 for identical vectors', () => {
      const a = [80, 60, 40];
      const b = [80, 60, 40];
      expect(PhysicsService.calculateCompatibility(a, b)).toBeCloseTo(1);
    });
    it('returns 0 for maximally different vectors', () => {
      const a = [0, 0, 0];
      const b = [100, 100, 100];
      expect(PhysicsService.calculateCompatibility(a, b)).toBeCloseTo(0);
    });
  });

  describe('calculateSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const a = [1, 2, 3];
      expect(PhysicsService.calculateSimilarity(a, a)).toBeCloseTo(1);
    });
    it('returns 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(PhysicsService.calculateSimilarity(a, b)).toBeCloseTo(0);
    });
    it('returns -1 for opposite vectors', () => {
      const a = [1, 0];
      const b = [-1, 0];
      expect(PhysicsService.calculateSimilarity(a, b)).toBeCloseTo(-1);
    });
  });

  describe('computeForces', () => {
    it('returns a Map with a force vector for each node', () => {
      const nodes = [
        { id: 'A', attributes: [80, 60, 40], velocity: new THREE.Vector3() },
        { id: 'B', attributes: [70, 50, 30], velocity: new THREE.Vector3() }
      ];
      const central = { id: 'central', attributes: [80, 60, 40], velocity: new THREE.Vector3() };
      const constants = { k: 1, kRep: 1 };
      const result = PhysicsService.computeForces(nodes, central, constants);
      expect(result.size).toBe(nodes.length);
      for (const force of result.values()) {
        expect(force).toBeInstanceOf(THREE.Vector3);
      }
    });
  });
});
