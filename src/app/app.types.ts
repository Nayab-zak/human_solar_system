import { Vector3 } from 'three';

export interface IHumanAttributes {
  attrOne: number;
  attrTwo: number;
  attrThree: number;
  attrFour: number;
  attrFive: number;
  attrSix: number;
  attrSeven: number;
  attrEight: number;
  attrNine: number;
  attrTen: number;
}

export interface INodeData {
  id: number;
  name: string;
  initialPosition: [number, number, number];
  isSun: boolean;
  color: string;
  attributes: IHumanAttributes;
  preferences: IHumanAttributes;
}

export interface ISwapAnimation {
  start: Vector3;
  end: Vector3;
  startTime: number;
  duration: number;
}

export interface IPlanetConfigs {
  attraction: number;
  repulsion: number;
  repulsionInitializationThreshold: number;
}

export interface ISunConfigs {
  attraction: number;
  repulsion: number;
  repulsionInitializationThreshold: number;
}

export interface ISimulationConfigs {
  sun: ISunConfigs;
  planet: IPlanetConfigs;
  maxVelocity: number;
  velocityDamping: number;
  minAttributeValue: number;
  minPreferenceValue: number;
  maxAttributeValue: number;
  maxPreferenceValue: number;
  damping?: number; // Add optional damping
}
