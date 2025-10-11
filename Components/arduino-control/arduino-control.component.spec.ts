import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArduinoControlComponent } from './arduino-control.component';

describe('ArduinoControlComponent', () => {
  let component: ArduinoControlComponent;
  let fixture: ComponentFixture<ArduinoControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArduinoControlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArduinoControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
