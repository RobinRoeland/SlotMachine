import { TestBed } from '@angular/core/testing';
import { PrizeService } from './prize.service';

describe('PrizeService', () => {
  let service: PrizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
