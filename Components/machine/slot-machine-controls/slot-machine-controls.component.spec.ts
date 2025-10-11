import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotMachineControlsComponent } from './slot-machine-controls.component';

describe('SlotMachineControlsComponent', () => {
  let component: SlotMachineControlsComponent;
  let fixture: ComponentFixture<SlotMachineControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotMachineControlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SlotMachineControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
