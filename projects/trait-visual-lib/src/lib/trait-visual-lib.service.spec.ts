import { TestBed } from '@angular/core/testing';

import { TraitVisualLibService } from './trait-visual-lib.service';

describe('TraitVisualLibService', () => {
  let service: TraitVisualLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TraitVisualLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
