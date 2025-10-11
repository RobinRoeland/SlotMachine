import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Reusable toggle switch component
 */
@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true
    }
  ]
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Toggle the switch
   */
  toggle(): void {
    if (this.disabled) {
      return;
    }
    
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.onTouched();
    this.checkedChange.emit(this.checked);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
