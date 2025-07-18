import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TraitNode } from '../../models/node';

/** Emit granular edit events so parent can mutate live node data. */
export interface NodeTraitEdit {
  node: TraitNode;
  key: string;
  value: number;
  field: 'traits' | 'preferences';
}

@Component({
  selector: 'tv-node-sliders',
  imports: [CommonModule, FormsModule],
  templateUrl: './node-sliders.html',
  styleUrl: './node-sliders.css'
})
export class NodeSliders implements OnChanges {
  @Input({required:true}) node!: TraitNode;
  @Input({required:true}) traitKeys: string[] = [];  // canonical order

  // Allow hiding either column if you want (defaults show both).
  @Input() showTraits = true;
  @Input() showPreferences = true;

  @Output() edit = new EventEmitter<NodeTraitEdit>();

  // local copies for binding
  traitVals: Record<string, number> = {};
  prefVals: Record<string, number> = {};

  ngOnChanges(_ch: SimpleChanges){
    if (!this.node) return;
    this.traitVals = {...this.node.traits};
    this.prefVals = {...this.node.preferences};
  }

  onTraitChange(k: string, v: any){
    const val = clamp0to100(+v);
    this.traitVals[k] = val;
    this.edit.emit({node:this.node, key:k, value:val, field:'traits'});
  }
  onPrefChange(k: string, v: any){
    const val = clamp0to100(+v);
    this.prefVals[k] = val;
    this.edit.emit({node:this.node, key:k, value:val, field:'preferences'});
  }
}

function clamp0to100(n:number){ return Math.min(100, Math.max(0, Math.round(n))); }
