import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';                     // <— add
import { VisualizationComponent } from './visualization/visualization.component';
import { ControlPanelComponent } from './control-panel/control-panel.component'; // <— add (we create in Step 2)

@NgModule({
  imports: [CommonModule, FormsModule, VisualizationComponent, ControlPanelComponent],
  exports: [VisualizationComponent], // panel is internal; user interacts via viz
})
export class TraitVisualization3dModule {}
