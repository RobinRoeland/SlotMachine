import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

export interface CustomTheme {
  name: string;
  gradientColors: string[];
  primaryColor: string;
  secondaryColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  cardBackgroundColor: string;
  borderColor: string;
}

@Component({
  selector: 'app-custom-theme-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-theme-editor.component.html',
  styleUrls: ['./custom-theme-editor.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CustomThemeEditorComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CustomTheme>();

  customTheme: CustomTheme;

  constructor() {
    this.customTheme = {
      name: 'My Custom Theme',
      gradientColors: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      textPrimaryColor: '#1e293b',
      textSecondaryColor: '#64748b',
      cardBackgroundColor: '#ffffff',
      borderColor: '#e5e7eb'
    };
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit(this.customTheme);
  }

  addGradientColor(): void {
    if (this.customTheme.gradientColors.length < 10) {
      this.customTheme.gradientColors.push('#000000');
    }
  }

  removeGradientColor(index: number): void {
    if (this.customTheme.gradientColors.length > 2) {
      this.customTheme.gradientColors.splice(index, 1);
    }
  }

  updateGradientColor(index: number, color: string): void {
    this.customTheme.gradientColors[index] = color;
  }

  getGradientPreview(): string {
    const stops = this.customTheme.gradientColors.map((color, index) => {
      const percent = (index / (this.customTheme.gradientColors.length - 1)) * 100;
      return `${color} ${percent}%`;
    }).join(', ');
    return `linear-gradient(135deg, ${stops})`;
  }

  getThemePreviewStyles(): { [key: string]: string } {
    return {
      '--color-primary-light': this.customTheme.primaryColor,
      '--color-secondary-light': this.customTheme.secondaryColor,
      '--text-primary': this.customTheme.textPrimaryColor,
      '--text-secondary': this.customTheme.textSecondaryColor,
      '--card-background-solid': this.customTheme.cardBackgroundColor,
      '--border-color': this.customTheme.borderColor
    };
  }
}
