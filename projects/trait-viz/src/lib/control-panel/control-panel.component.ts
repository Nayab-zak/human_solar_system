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

  @Input() kAttraction = 1;
  @Input() kRepulsion  = 1;
  @Input() damping     = 0.95;
  @Input() angularSpeed = 0.25;
  @Input() restLength   = 40;

  @Input() traitCount = 3;           // initial
  @Input() nodeCount = 4;            // initial outer count

  @Input() galaxyBendStrength = 0.5;
  @Input() galaxyTwinkleSpeed = 0.5;
  @Input() galaxyAmbientRot = 0.005;
  @Input() galaxyParticles = 40000;
  @Input() glowStrength = 1.2;
  @Input() dragCluster = false;
  @Input() galaxyClearPush = 1; // 0..1
  @Input() galaxyPocketPush = 0.8;
  @Input() galaxyPocketRingBoost = 1.2;

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

  @Output() visualChange = new EventEmitter<{
    bend:number; twinkle:number; ambient:number; particles:number; glow:number;
  }>();

  editNodeIndex = 0;

  ngOnChanges(_: SimpleChanges){}

  onCentralChange(idx: string){
    const i = +idx;
    this.centralIndex = i;
    this.centralChange.emit(i);
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
    });
  }

  onBend(v:any){ this.galaxyBendStrength=+v; this.emitVisual(); }
  onTw(v:any){ this.galaxyTwinkleSpeed=+v; this.emitVisual(); }
  onAmb(v:any){ this.galaxyAmbientRot=+v; this.emitVisual(); }
  onPart(v:any){ this.galaxyParticles=+v; this.emitVisual(); }
  onGlow(v:any){ this.glowStrength=+v; this.emitVisual(); }

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

  onGalaxyReseed(){
    this.galaxyReseedChange.emit();
  }

  onDragModeChange(ev:any){
    this.dragCluster = !!ev.target.checked;
    this.dragClusterChange.emit(this.dragCluster);
  }
}
