import * as THREE from 'three';

/** Creates (and caches) a radial‑falloff circle alpha texture. */
let cached: THREE.Texture | null = null;

export function getCircleTexture(size = 64): THREE.Texture {
  if (cached) return cached;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d')!;
  const r = size/2;
  const grd = ctx.createRadialGradient(r,r,0,r,r,r);
  grd.addColorStop(0,'rgba(255,255,255,1)');
  grd.addColorStop(0.7,'rgba(255,255,255,0.6)');
  grd.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(cvs);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  cached = tex;
  return tex;
}
