import * as THREE from 'three';
import { PhysicsService } from './PhysicsService';
import { Node } from '../objects/Node';
import { ISimulationConfigs, INodeData, IHumanAttributes } from '../app.types';

describe('PhysicsService.computeAttractionForce', () => {
  function makeAttrObj(arr: number[]): IHumanAttributes {
    return {
      attrOne: arr[0] ?? 0,
      attrTwo: arr[1] ?? 0,
      attrThree: arr[2] ?? 0,
      attrFour: arr[3] ?? 0,
      attrFive: arr[4] ?? 0,
      attrSix: arr[5] ?? 0,
      attrSeven: arr[6] ?? 0,
      attrEight: arr[7] ?? 0,
      attrNine: arr[8] ?? 0,
      attrTen: arr[9] ?? 0,
    };
  }

  function makeNode(attrs: number[], prefs: number[], pos: [number, number, number] = [0,0,0]): Node {
    const data: INodeData = {
      id: 1,
      name: 'Test',
      initialPosition: pos,
      isSun: false,
      color: '#fff',
      attributes: makeAttrObj(attrs),
      preferences: makeAttrObj(prefs),
    };
    const options: ISimulationConfigs = {
      sun: { attraction: 1, repulsion: 1, repulsionInitializationThreshold: 0.4 },
      planet: { attraction: 1, repulsion: 1, repulsionInitializationThreshold: 0.2 },
      maxVelocity: 1, velocityDamping: 1, minAttributeValue: 0, minPreferenceValue: 0, maxAttributeValue: 100, maxPreferenceValue: 100
    };
    return new Node(data, options);
  }

  it('returns correct force for 3 attributes', () => {
    const outer = makeNode([10, 20, 30], [0,0,0]);
    const sun = makeNode([0,0,0], [10, 20, 30], [1,2,3]);
    const k = 2;
    const force = PhysicsService.computeAttractionForce(outer, sun, k);
    expect(force.x).toBeCloseTo(1, 2);
    expect(force.y).toBeCloseTo(1, 2);
    expect(force.z).toBeCloseTo(1, 2);
  });

  it('returns correct force for 10 attributes', () => {
    const attrs = [10,20,30,40,50,60,70,80,90,100];
    const prefs = [10,20,30,40,50,60,70,80,90,100];
    const outer = makeNode(attrs, prefs);
    const sun = makeNode(attrs, prefs, [1,1,1]);
    const k = 1;
    const force = PhysicsService.computeAttractionForce(outer, sun, k);
    expect(force.x).toBeGreaterThan(0.9);
    expect(force.y).toBeGreaterThan(0.9);
    expect(force.z).toBeGreaterThan(0.9);
  });

  it('handles different attribute values', () => {
    const outer = makeNode([0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]);
    const sun = makeNode([100,100,100,100,100,100,100,100,100,100], [100,100,100,100,100,100,100,100,100,100], [1,0,0]);
    const k = 1;
    const force = PhysicsService.computeAttractionForce(outer, sun, k);
    expect(force.length()).toBeLessThan(0.1); // all compat = 0
  });
});
