import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrizeDisplayItemComponent } from './prize-display-item.component';

describe('PrizeDisplayItemComponent', () => {
  let component: PrizeDisplayItemComponent;
  let fixture: ComponentFixture<PrizeDisplayItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizeDisplayItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrizeDisplayItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
