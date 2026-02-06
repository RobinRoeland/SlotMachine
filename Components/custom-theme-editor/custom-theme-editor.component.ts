import { Component, Output, EventEmitter, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AppPreviewComponent } from './app-preview/app-preview.component';

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
  imports: [CommonModule, FormsModule, AppPreviewComponent],
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
export class CustomThemeEditorComponent implements OnInit, OnChanges {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CustomTheme>();
  @Input() initialTheme?: CustomTheme;

  customTheme: CustomTheme;

  constructor() {
    this.customTheme = this.getDefaultTheme();
  }

  ngOnInit(): void {
    // If initial theme is provided, use it; otherwise use defaults
    if (this.initialTheme) {
      this.customTheme = this.deepCopyTheme(this.initialTheme);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update theme when input changes (e.g., when reopening the modal)
    if (changes['initialTheme'] && changes['initialTheme'].currentValue) {
      this.customTheme = this.deepCopyTheme(changes['initialTheme'].currentValue);
    }
  }

  private deepCopyTheme(theme: CustomTheme): CustomTheme {
    return {
      name: theme.name,
      gradientColors: [...theme.gradientColors],
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      textPrimaryColor: theme.textPrimaryColor,
      textSecondaryColor: theme.textSecondaryColor,
      cardBackgroundColor: theme.cardBackgroundColor,
      borderColor: theme.borderColor
    };
  }

  private getDefaultTheme(): CustomTheme {
    return {
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

  trackByIndex(index: number): number {
    return index;
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
      '--color-primary': this.customTheme.primaryColor,
      '--color-primary-light': this.customTheme.primaryColor,
      '--color-secondary-light': this.customTheme.secondaryColor,
      '--text-primary': this.customTheme.textPrimaryColor,
      '--text-secondary': this.customTheme.textSecondaryColor,
      '--text-accent': this.customTheme.primaryColor,
      '--card-background-solid': this.customTheme.cardBackgroundColor,
      '--border-color': this.customTheme.borderColor
    };
  }
}
