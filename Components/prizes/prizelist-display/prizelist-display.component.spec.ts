import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrizelistDisplayComponent } from './prizelist-display.component';

describe('PrizelistDisplayComponent', () => {
  let component: PrizelistDisplayComponent;
  let fixture: ComponentFixture<PrizelistDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizelistDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrizelistDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
