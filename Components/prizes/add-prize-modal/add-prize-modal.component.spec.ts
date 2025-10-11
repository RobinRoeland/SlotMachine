import { TestBed } from '@angular/core/testing';
import { AddPrizeModalComponent } from './add-prize-modal.component';

describe('AddPrizeModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPrizeModalComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AddPrizeModalComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
