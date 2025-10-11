import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable settings section component
 * Groups related settings with a title and description
 */
@Component({
  selector: 'app-settings-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-section.component.html',
  styleUrls: ['./settings-section.component.scss']
})
export class SettingsSectionComponent {
  @Input() title: string = '';
  @Input() description: string = '';
}
