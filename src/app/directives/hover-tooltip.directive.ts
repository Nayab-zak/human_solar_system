import { Directive, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { SceneService } from '../services/scene.service';
import * as THREE from 'three';

@Directive({
  selector: '[traitHoverTooltip]'
})
export class HoverTooltipDirective implements OnInit, OnDestroy {
  private raycaster = new THREE.Raycaster();
  private pointerMoveHandler = (event: PointerEvent) => this.onPointerMove(event);
  private tooltipRef: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private sceneService: SceneService,
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<any>
  ) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('pointermove', this.pointerMoveHandler);
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('pointermove', this.pointerMoveHandler);
    this.hideTooltip();
  }

  private onPointerMove(event: PointerEvent) {
    const { camera, scene, domElement } = this.sceneService;
    const rect = domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, camera);
    const intersects = this.raycaster.intersectObjects(scene.children, true);
    const node = intersects.find(i => i.object.userData && i.object.parent && i.object.parent.position && i.distance < 0.5);
    if (node) {
      this.showTooltip(event.clientX, event.clientY, node.object.parent.userData);
    } else {
      this.hideTooltip();
    }
  }

  private showTooltip(x: number, y: number, nodeData: any) {
    if (!this.tooltipRef) {
      this.tooltipRef = document.createElement('div');
      this.tooltipRef.className = 'trait-hover-tooltip';
      document.body.appendChild(this.tooltipRef);
    }
    this.tooltipRef.style.display = 'block';
    this.tooltipRef.style.left = `${x + 12}px`;
    this.tooltipRef.style.top = `${y + 12}px`;
    this.tooltipRef.innerHTML = `<b>${nodeData.name}</b><br>` +
      Object.entries(nodeData.attributes || {}).map(([k, v]) => `${k}: ${v}`).join('<br>');
  }

  private hideTooltip() {
    if (this.tooltipRef) {
      this.tooltipRef.style.display = 'none';
    }
  }
}
