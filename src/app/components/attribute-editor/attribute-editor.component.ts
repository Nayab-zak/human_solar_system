import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { Node } from '../../objects/Node';

@Component({
  selector: 'app-attribute-editor',
  templateUrl: './attribute-editor.component.html',
  styleUrls: ['./attribute-editor.component.scss']
})
export class AttributeEditorComponent implements OnChanges {
  @Input() selectedNode: Node | null = null;
  @Input() attrCount: number = 3;
  attrForm: FormArray = this.fb.array([]);

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedNode'] || changes['attrCount']) {
      this.refresh(this.attrCount);
    }
  }

  get attrControls(): FormArray {
    return this.attrForm;
  }

  refresh(count: number) {
    this.attrForm.clear();
    if (!this.selectedNode) return;
    for (let i = 0; i < count; i++) {
      const val = this.selectedNode.attributes[i] ?? 50;
      const ctrl = new FormControl(val);
      ctrl.valueChanges.subscribe(v => {
        if (this.selectedNode) this.selectedNode.attributes[i] = v;
      });
      this.attrForm.push(ctrl);
    }
  }
}
