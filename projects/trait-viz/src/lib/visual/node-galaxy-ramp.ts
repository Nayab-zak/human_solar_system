import * as THREE from 'three';
import {
  PAL_CYAN_LIGHT,PAL_CYAN_CORE,PAL_BLUE_CORE,PAL_BLUE_DEEP,PAL_VIOLET,PAL_MAGENTA,PAL_TEAL_DARK
} from './blueyard-palette';

export function nodeGalaxyRamp(t:number, out:THREE.Color){
  // Enhanced smooth transitions matching the new galaxy gradient
  if (t < 0.15) {
    // Bright cyan core zone
    const mix = t / 0.15;
    out.copy(PAL_CYAN_LIGHT).lerp(PAL_CYAN_CORE, mix);
  } else if (t < 0.35) {
    // Cyan to deep blue transition
    const mix = (t - 0.15) / 0.20;
    out.copy(PAL_CYAN_CORE).lerp(PAL_BLUE_DEEP, mix);
  } else if (t < 0.60) {
    // Deep blue to violet transition
    const mix = (t - 0.35) / 0.25;
    out.copy(PAL_BLUE_DEEP).lerp(PAL_VIOLET, mix);
  } else if (t < 0.85) {
    // Violet to magenta transition
    const mix = (t - 0.60) / 0.25;
    out.copy(PAL_VIOLET).lerp(PAL_MAGENTA, mix);
  } else {
    // Magenta to dark outer edge
    const mix = (t - 0.85) / 0.15;
    out.copy(PAL_MAGENTA).lerp(PAL_TEAL_DARK, mix);
  }
}
