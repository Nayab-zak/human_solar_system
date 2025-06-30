import * as THREE from 'three';
import { PhysicsService } from './PhysicsService';
import { Node } from '../objects/Node';
import { ISimulationConfigs, INodeData, IHumanAttributes } from '../app.types';

describe('PhysicsService.computeRepulsionForce', () => {
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

  function makeNode(attrs: number[], pos: [number, number, number] = [0,0,0]): Node {
    const data: INodeData = {
      id: 1,
      name: 'Test',
      initialPosition: pos,
      isSun: false,
      color: '#fff',
      attributes: makeAttrObj(attrs),
      preferences: makeAttrObj([]),
    };
    const options: ISimulationConfigs = {
      sun: { attraction: 1, repulsion: 1, repulsionInitializationThreshold: 0.4 },
      planet: { attraction: 1, repulsion: 1, repulsionInitializationThreshold: 0.2 },
      maxVelocity: 1, velocityDamping: 1, minAttributeValue: 0, minPreferenceValue: 0, maxAttributeValue: 100, maxPreferenceValue: 100
    };
    return new Node(data, options);
  }

  it('identical nodes – negligible repulsion', () => {
    const a = makeNode([10, 20, 30], [0,0,0]);
    const b = makeNode([10, 20, 30], [1,0,0]);
    const kRep = 50;
    const force = PhysicsService.computeRepulsionForce(a, b, kRep);
    expect(force.length()).toBeLessThan(0.01);
  });

  it('opposite nodes – strong repulsion', () => {
    const a = makeNode([0, 0, 0], [0,0,0]);
    const b = makeNode([100, 100, 100], [1,0,0]);
    const kRep = 50;
    const force = PhysicsService.computeRepulsionForce(a, b, kRep);
    expect(force.length()).toBeCloseTo(50, 1);
    expect(force.x).toBeLessThan(0); // direction: a - b
  });
});
