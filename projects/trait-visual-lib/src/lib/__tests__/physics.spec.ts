import { PhysicsService } from '../../../app/services/PhysicsService';
import { Node } from '../../../app/objects/Node';
import { ISimulationConfigs, INodeData, IHumanAttributes } from '../../../app/app.types';
import * as THREE from 'three';

describe('PhysicsService (10-attribute vectors)', () => {
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
      maxVelocity: 1, velocityDamping: 1, minAttributeValue: 0, minPreferenceValue: 0, maxAttributeValue: 100, maxPreferenceValue: 100, damping: 1
    };
    return new Node(data, options);
  }

  it('identical 10-attr vectors ⇒ attraction close to k/d²', () => {
    const attrs = [10,20,30,40,50,60,70,80,90,100];
    const outer = makeNode(attrs, attrs, [0,0,0]);
    const sun = makeNode(attrs, attrs, [2,0,0]);
    const k = 5;
    const force = PhysicsService.computeAttractionForce(outer, sun, k);
    // d = 2, so expect force.x ≈ k/(d^2) = 1.25
    expect(force.x).toBeCloseTo(1.25, 2);
    expect(force.y).toBeCloseTo(0, 2);
    expect(force.z).toBeCloseTo(0, 2);
  });

  it('opposite vectors ⇒ attraction near 0', () => {
    const outer = makeNode([0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0], [0,0,0]);
    const sun = makeNode([100,100,100,100,100,100,100,100,100,100], [100,100,100,100,100,100,100,100,100,100], [1,0,0]);
    const k = 5;
    const force = PhysicsService.computeAttractionForce(outer, sun, k);
    expect(force.length()).toBeLessThan(0.01);
  });

  it('similar planets ⇒ repulsion <0.1*kRep/d²', () => {
    const attrs = [10,20,30,40,50,60,70,80,90,100];
    const a = makeNode(attrs, attrs, [0,0,0]);
    const b = makeNode(attrs, attrs, [2,0,0]);
    const kRep = 10;
    const force = PhysicsService.computeRepulsionForce(a, b, kRep);
    // d = 2, so kRep/d^2 = 2.5, expect repulsion < 0.25
    expect(force.length()).toBeLessThan(0.25);
  });

  it('with damping 0.9, total kinetic energy frame N+100 < frame N', () => {
    const attrs = [10,20,30,40,50,60,70,80,90,100];
    const a = makeNode(attrs, attrs, [0,0,0]);
    const b = makeNode(attrs, attrs, [2,0,0]);
    // Set damping
    a.damping = 0.9;
    b.damping = 0.9;
    // Give initial velocity
    a.velocity.set(1,0,0);
    b.velocity.set(-1,0,0);
    // Simulate 100 frames
    let ke0 = 0.5 * a.velocity.lengthSq() + 0.5 * b.velocity.lengthSq();
    for (let i = 0; i < 100; i++) {
      a.updatePosition(1);
      b.updatePosition(1);
    }
    let ke1 = 0.5 * a.velocity.lengthSq() + 0.5 * b.velocity.lengthSq();
    expect(ke1).toBeLessThan(ke0);
  });
});
