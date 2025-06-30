import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Node } from '../../objects/Node';

@Component({
  selector: 'app-sun-select',
  templateUrl: './sun-select.component.html',
  styleUrls: ['./sun-select.component.scss']
})
export class SunSelectComponent {
  @Input() nodes: Node[] = [];
  @Input() sunId!: number;
  @Output() sunIdChange = new EventEmitter<number>();

  setSun(id: number) {
    this.sunId = id;
    this.sunIdChange.emit(id);
  }
}
