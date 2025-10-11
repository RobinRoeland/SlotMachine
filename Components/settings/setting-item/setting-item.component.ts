import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable setting item component
 * Displays a setting with title, description, and content projection for controls
 */
@Component({
  selector: 'app-setting-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setting-item.component.html',
  styleUrls: ['./setting-item.component.scss']
})
export class SettingItemComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() disabled: boolean = false;
}
