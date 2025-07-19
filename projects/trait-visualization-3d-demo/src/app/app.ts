import { Component, signal } from '@angular/core';
import { VisualizationComponent } from 'trait-viz';
import { nodeData } from 'trait-viz';

@Component({
  selector: 'app-root',
  imports: [VisualizationComponent],
  template: `
    <div class="app-root">
      <tv-visualization [nodes]="nodes" [centralIndex]="centralIndex"></tv-visualization>
    </div>
  `,
  styles: [`.app-root{width:100vw;height:100vh;display:block;}`]
})
export class App {
  protected readonly title = signal('trait-visualization-3d-demo');
  nodes = nodeData;
  centralIndex = 0;
}
