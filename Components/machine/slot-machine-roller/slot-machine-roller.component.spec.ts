import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotMachineRollerComponent } from './slot-machine-roller.component';

describe('SlotMachineRollerComponent', () => {
  let component: SlotMachineRollerComponent;
  let fixture: ComponentFixture<SlotMachineRollerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotMachineRollerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SlotMachineRollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
