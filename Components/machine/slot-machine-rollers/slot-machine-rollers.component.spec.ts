import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotMachineRollersComponent } from './slot-machine-rollers.component';

describe('SlotMachineRollersComponent', () => {
  let component: SlotMachineRollersComponent;
  let fixture: ComponentFixture<SlotMachineRollersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotMachineRollersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SlotMachineRollersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
