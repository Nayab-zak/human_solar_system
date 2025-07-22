import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TraitNode } from '../models/node';
import { NodeSliders, NodeTraitEdit } from './node-sliders/node-sliders';

export interface SimSettings {
  kAttraction: number;
  kRepulsion: number;
  damping: number;
  angularSpeed: number;
  restLength: number;
}

@Component({
  selector: 'tv-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NodeSliders],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss']
})
export class ControlPanelComponent implements OnChanges {
  @Input({required:true}) nodes: TraitNode[] = [];
  @Input() traitKeys: string[] = [];
  @Input() centralIndex = 0;

  // Minimize state
  isMinimized = false;

  @Input() kAttraction = 1;
  @Input() kRepulsion  = 1;
  @Input() damping     = 0.95;
  @Input() angularSpeed = 0.25;
  @Input() restLength   = 25;

  @Input() traitCount = 3;           // initial
  @Input() nodeCount = 4;            // initial outer count

  @Input() galaxyBendStrength = 0.5;
  @Input() galaxyTwinkleSpeed = 0.5;
  @Input() galaxyAmbientRot = 0.02;  // Much higher default for very visible rotation
  @Input() galaxyRotationAxis = 'z';  // 'x', 'y', or 'z' axis for rotation
  @Input() galaxyRotationMode = 'screen';  // 'screen', 'world', or 'local' rotation mode
  @Input() galaxyRotationSpeed = 0.02;  // Speed of rotation
  @Input() galaxyParticles = 180000;   // Optimal balance: visually rich but performant
  @Input() glowStrength = 0.2;
  @Input() galaxyPointSize = 2.0;  // Star size control
  @Input() galaxyCoreSize = 225;   // Galaxy core radius control
  @Input() dragCluster = true;
  @Input() galaxyClearPush = 1; // 0..1
  @Input() galaxyPocketPush = 0.8;
  @Input() galaxyPocketRingBoost = 1.2;
  @Input() centralNodeClearance = 2.5; // multiplier for central node clear zone

  // Spiral galaxy controls
  @Input() spiralArms = 3;
  @Input() spiralTightness = 0.15;
  @Input() spiralWinds = 1.5;
  @Input() armWidth = 0.15;
  @Input() armBrightness = 2.0;        // Increased for better visibility with larger galaxy
  
  // Arm thickness variation controls
  @Input() armMaxWidth = 25;
  @Input() armMinWidth = 3;
  @Input() armThicknessProfile = 0.6;
  
  // Galaxy tilt controls
  @Input() galaxyTiltX = 0;    // pitch tilt in degrees
  @Input() galaxyTiltZ = 12;   // roll tilt in degrees
  
  // Background starfield controls
  @Input() nebulaIntensity = 1.0;
  @Input() nebulaClusters = 8;
  @Input() nebulaRadius = 25;
  @Input() fieldStarDensity = 1.0;
  @Input() fieldStarDistance = 1.8;
  
  // Elliptical disk shape controls
  @Input() diskEllipticity = 0.8;
  @Input() zGaussianStrength = 1.0;

  @Output() centralChange = new EventEmitter<number>();
  @Output() simChange = new EventEmitter<SimSettings>();
  @Output() nodeEdit = new EventEmitter<NodeTraitEdit>();
  @Output() traitCountChange = new EventEmitter<number>();
  @Output() nodeCountChange = new EventEmitter<number>();
  @Output() dragClusterChange = new EventEmitter<boolean>();
  @Output() galaxyClearPushChange = new EventEmitter<number>();
  @Output() galaxyPocketPushChange = new EventEmitter<number>();
  @Output() galaxyPocketRingBoostChange = new EventEmitter<number>();
  @Output() galaxyReseedChange = new EventEmitter<void>();
  @Output() galaxyPointSizeChange = new EventEmitter<number>();  // Star size output
  @Output() galaxyCoreSizeChange = new EventEmitter<number>();   // Galaxy core size output
  @Output() centralClearanceChange = new EventEmitter<number>(); // Central node clearance output

  // Spiral structure outputs
  @Output() spiralArmsChange = new EventEmitter<number>();
  @Output() spiralTightnessChange = new EventEmitter<number>();
  @Output() spiralWindsChange = new EventEmitter<number>();
  @Output() armWidthChange = new EventEmitter<number>();
  @Output() armBrightnessChange = new EventEmitter<number>();
  
  // Arm thickness variation outputs
  @Output() armMaxWidthChange = new EventEmitter<number>();
  @Output() armMinWidthChange = new EventEmitter<number>();
  @Output() armThicknessProfileChange = new EventEmitter<number>();
  
  // Galaxy tilt outputs
  @Output() galaxyTiltXChange = new EventEmitter<number>();
  @Output() galaxyTiltZChange = new EventEmitter<number>();
  
  // Background starfield outputs
  @Output() nebulaIntensityChange = new EventEmitter<number>();
  @Output() nebulaClustersChange = new EventEmitter<number>();
  @Output() nebulaRadiusChange = new EventEmitter<number>();
  @Output() fieldStarDensityChange = new EventEmitter<number>();
  @Output() fieldStarDistanceChange = new EventEmitter<number>();
  
  // Elliptical disk shape outputs
  @Output() diskEllipticityChange = new EventEmitter<number>();
  @Output() zGaussianStrengthChange = new EventEmitter<number>();

  @Output() visualChange = new EventEmitter<{
    bend:number; twinkle:number; ambient:number; particles:number; glow:number;
    rotationAxis:string; rotationSpeed:number; rotationMode:string;
  }>();

  editNodeIndex = 0;

  ngOnChanges(_: SimpleChanges){}

  onCentralChange(idx: string){
    const i = +idx;
    this.centralIndex = i;
    this.centralChange.emit(i);
  }

  onDropdownChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.onCentralChange(value);
  }

  toggleMinimized() {
    this.isMinimized = !this.isMinimized;
  }

  onEditNodeChange(idx: string){
    this.editNodeIndex = +idx;
  }

  emitSim(){
    this.simChange.emit({
      kAttraction: this.kAttraction,
      kRepulsion: this.kRepulsion,
      damping: this.damping,
      angularSpeed: this.angularSpeed,
      restLength: this.restLength,
    });
  }

  onKA(v:any){ this.kAttraction = +v; this.emitSim(); }
  onKR(v:any){ this.kRepulsion  = +v; this.emitSim(); }
  onDamp(v:any){ this.damping   = +v; this.emitSim(); }
  onAng(v:any){ this.angularSpeed = +v; this.emitSim(); }
  onRest(v:any){ this.restLength = +v; this.emitSim(); }

  onTraitCount(v:any){
    this.traitCount = +v;
    this.traitCountChange.emit(this.traitCount);
  }

  onNodeCount(v:any){
    this.nodeCount = +v;
    this.nodeCountChange.emit(this.nodeCount);
  }

  handleNodeEdit(e: NodeTraitEdit){
    this.nodeEdit.emit(e);
  }

  emitVisual(){
    this.visualChange.emit({
      bend: this.galaxyBendStrength,
      twinkle: this.galaxyTwinkleSpeed,
      ambient: this.galaxyAmbientRot,
      particles: this.galaxyParticles,
      glow: this.glowStrength,
      rotationAxis: this.galaxyRotationAxis,
      rotationSpeed: this.galaxyRotationSpeed,
      rotationMode: this.galaxyRotationMode,
    });
  }

  onBend(v:any){ this.galaxyBendStrength=+v; this.emitVisual(); }
  onTw(v:any){ this.galaxyTwinkleSpeed=+v; this.emitVisual(); }
  onAmb(v:any){ this.galaxyAmbientRot=+v; this.emitVisual(); }
  onRotationAxis(v:any){ this.galaxyRotationAxis=v; this.emitVisual(); }
  onRotationMode(v:any){ this.galaxyRotationMode=v; this.emitVisual(); }
  onRotationSpeed(v:any){ this.galaxyRotationSpeed=+v; this.emitVisual(); }
  onPart(v:any){ this.galaxyParticles=+v; this.emitVisual(); }
  onGlow(v:any){ this.glowStrength=+v; this.emitVisual(); }
  
  onPointSize(v:any){ 
    this.galaxyPointSize=+v; 
    this.galaxyPointSizeChange.emit(this.galaxyPointSize); 
  }

  onCoreSize(v:any){ 
    this.galaxyCoreSize=+v; 
    this.galaxyCoreSizeChange.emit(this.galaxyCoreSize); 
  }

  onClearPush(v:any){
    this.galaxyClearPush = +v;
    this.galaxyClearPushChange.emit(this.galaxyClearPush);
  }

  onPocketPush(v:any){ 
    this.galaxyPocketPush=+v; 
    this.galaxyPocketPushChange.emit(this.galaxyPocketPush); 
  }

  onPocketRingBoost(v:any){ 
    this.galaxyPocketRingBoost=+v; 
    this.galaxyPocketRingBoostChange.emit(this.galaxyPocketRingBoost); 
  }

  onCentralClearance(v:any){
    this.centralNodeClearance = +v;
    this.centralClearanceChange.emit(this.centralNodeClearance);
  }

  onGalaxyReseed(){
    this.galaxyReseedChange.emit();
  }

  onDragModeChange(ev:any){
    this.dragCluster = !!ev.target.checked;
    this.dragClusterChange.emit(this.dragCluster);
  }

  // Spiral structure handlers
  onSpiralArms(v:any){
    this.spiralArms = +v;
    this.spiralArmsChange.emit(this.spiralArms);
  }

  onSpiralTightness(v:any){
    this.spiralTightness = +v;
    this.spiralTightnessChange.emit(this.spiralTightness);
  }

  onSpiralWinds(v:any){
    this.spiralWinds = +v;
    this.spiralWindsChange.emit(this.spiralWinds);
  }

  onArmWidth(v:any){
    this.armWidth = +v;
    this.armWidthChange.emit(this.armWidth);
  }

  onArmBrightness(v:any){
    this.armBrightness = +v;
    this.armBrightnessChange.emit(this.armBrightness);
  }

  // Arm thickness variation handlers
  onArmMaxWidth(v:any){
    this.armMaxWidth = +v;
    this.armMaxWidthChange.emit(this.armMaxWidth);
  }

  onArmMinWidth(v:any){
    this.armMinWidth = +v;
    this.armMinWidthChange.emit(this.armMinWidth);
  }

  onArmThicknessProfile(v:any){
    this.armThicknessProfile = +v;
    this.armThicknessProfileChange.emit(this.armThicknessProfile);
  }
  
  // Galaxy tilt handlers
  onGalaxyTiltX(v:any){
    this.galaxyTiltX = +v;
    this.galaxyTiltXChange.emit(this.galaxyTiltX);
  }
  
  onGalaxyTiltZ(v:any){
    this.galaxyTiltZ = +v;
    this.galaxyTiltZChange.emit(this.galaxyTiltZ);
  }
  
  // Background starfield handlers
  onNebulaIntensity(v:any){
    this.nebulaIntensity = +v;
    this.nebulaIntensityChange.emit(this.nebulaIntensity);
  }
  
  onNebulaClusters(v:any){
    this.nebulaClusters = +v;
    this.nebulaClustersChange.emit(this.nebulaClusters);
  }
  
  onNebulaRadius(v:any){
    this.nebulaRadius = +v;
    this.nebulaRadiusChange.emit(this.nebulaRadius);
  }
  
  onFieldStarDensity(v:any){
    this.fieldStarDensity = +v;
    this.fieldStarDensityChange.emit(this.fieldStarDensity);
  }
  
  onFieldStarDistance(v:any){
    this.fieldStarDistance = +v;
    this.fieldStarDistanceChange.emit(this.fieldStarDistance);
  }
  
  // Elliptical disk shape handlers
  onDiskEllipticity(v:any){
    this.diskEllipticity = +v;
    this.diskEllipticityChange.emit(this.diskEllipticity);
  }
  
  onZGaussianStrength(v:any){
    this.zGaussianStrength = +v;
    this.zGaussianStrengthChange.emit(this.zGaussianStrength);
  }
}
