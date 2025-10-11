import { TestBed } from '@angular/core/testing';
import { PrizeListComponent } from './prize-list.component';

describe('PrizeListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizeListComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PrizeListComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
