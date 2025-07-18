/** Compatibility: central prefs vs outer traits (0..1). */
export function compatibility(prefs: number[], attrs: number[]): number {
  const N = prefs.length;
  let diff = 0;
  for (let i=0;i<N;i++) diff += Math.abs(prefs[i] - attrs[i]);
  return 1 - diff / (N * 100);
}

/** Similarity: outer vs outer (0..1). */
export function similarity(a: number[], b: number[]): number {
  const N = a.length;
  let diff = 0;
  for (let i=0;i<N;i++) diff += Math.abs(a[i] - b[i]);
  return 1 - diff / (N * 100);
}
