import { TestBed } from '@angular/core/testing';
import { PrizeItemComponent } from './prize-item.component';

describe('PrizeItemComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizeItemComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PrizeItemComponent);
    const component = fixture.componentInstance;
    component.prize = { pattern: [], reward: '' };
    component.index = 0;
    expect(component).toBeTruthy();
  });
});
