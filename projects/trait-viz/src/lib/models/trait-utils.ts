import { TraitNode } from './node';

export type TraitKey = string;

/** Get the canonical attribute order from the first node. */
export function getTraitKeys(nodes: TraitNode[]): TraitKey[] {
  if (!nodes.length) return [];
  return Object.keys(nodes[0].traits);
}

export function canonicalKey(index: number): string {
  return `attr${index+1}`;          // attr1, attr2, …
}

export function ensureTraitCount(
  node: TraitNode,
  keys: string[],
  newCount: number,
  fillValue = 50
){
  // add new keys
  for (let i=keys.length; i<newCount; i++){
    const k = canonicalKey(i);
    node.traits[k] = fillValue;
    node.preferences[k] = fillValue;
    keys.push(k);
  }
  // trim extra keys
  if (newCount < keys.length){
    for (let i=newCount;i<keys.length;i++){
      const k = keys[i];
      delete node.traits[k];
      delete node.preferences[k];
    }
    keys.length = newCount;
  }
}
