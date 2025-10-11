import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleSwitchComponent } from './toggle-switch.component';

describe('ToggleSwitchComponent', () => {
  let component: ToggleSwitchComponent;
  let fixture: ComponentFixture<ToggleSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleSwitchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle checked state', () => {
    component.checked = false;
    component.toggle();
    expect(component.checked).toBe(true);
  });

  it('should not toggle when disabled', () => {
    component.checked = false;
    component.disabled = true;
    component.toggle();
    expect(component.checked).toBe(false);
  });
});
