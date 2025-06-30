import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitVisualLibComponent } from './trait-visual-lib.component';

describe('TraitVisualLibComponent', () => {
  let component: TraitVisualLibComponent;
  let fixture: ComponentFixture<TraitVisualLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitVisualLibComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraitVisualLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
