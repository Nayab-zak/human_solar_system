import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitViz } from './trait-viz';

describe('TraitViz', () => {
  let component: TraitViz;
  let fixture: ComponentFixture<TraitViz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitViz]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraitViz);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
