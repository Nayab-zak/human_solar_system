import { Vector3 } from 'three';

// Central node preferences (3-dimensional example)
export const centralNode = {
  id: 'central',
  preferences: [80, 60, 40] as number[],
};

// Four outer nodes with varied attributes
export const outerNodes = [
  { id: 'A', attributes: [80, 60, 40], velocity: new Vector3() },
  { id: 'B', attributes: [70, 50, 30], velocity: new Vector3() },
  { id: 'C', attributes: [20, 20, 20], velocity: new Vector3() },
  { id: 'D', attributes: [75, 55, 35], velocity: new Vector3() },
];
