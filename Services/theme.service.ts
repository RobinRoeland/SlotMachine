import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Theme definition interface
 */
export interface Theme {
  name: 'light' | 'medium-dark' | 'dark' | 'custom';
  displayName: string;
  colors: {
    // Background gradients
    bodyBackground: string;
    // Primary colors
    primary: string;
    primaryDark: string;
    primaryLight: string;
    // Secondary colors
    secondary: string;
    secondaryLight: string;
    // Scrollbar colors
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    scrollbarThumbActive: string;
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textAccent: string;
    // Border and UI elements
    border: string;
    cardBackground: string;
    cardBackgroundSolid: string;
    logoBackground: string;
    hoverOverlay: string;
    // Gradient preview (for theme selector)
    previewGradient: string;
  };
}

/**
 * Theme service to manage application color themes
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /**
   * Available themes
   */
  public readonly themes: Theme[] = [
    {
      name: 'light',
      displayName: 'Light Theme',
      colors: {
        bodyBackground: 'linear-gradient(135deg, #D4F1F4 0%, #E8F4F8 25%, #F3E8FF 60%, #E8D4FF 100%)',
        primary: '#2D3E8E',
        primaryDark: '#1f2d6b',
        primaryLight: '#4759B4',
        secondary: '#9D8DF1',
        secondaryLight: '#B8A4F5',
        scrollbarThumb: 'linear-gradient(135deg, #9D8DF1 0%, #B8A4F5 100%)',
        scrollbarThumbHover: 'linear-gradient(135deg, #8B7ADF 0%, #A692E3 100%)',
        scrollbarThumbActive: 'linear-gradient(135deg, #7968CD 0%, #9480D1 100%)',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        textAccent: '#2D3E8E',
        border: '#e5e7eb',
        cardBackground: 'linear-gradient(135deg, #E8F4F8 0%, #F0E8FF 100%)',
        cardBackgroundSolid: '#ffffff',
        logoBackground: 'linear-gradient(135deg, #D4F1F4 0%, #E8F4F8 25%, #F3E8FF 60%, #E8D4FF 100%)',
        hoverOverlay: 'rgba(45, 62, 142, 0.05)',
        previewGradient: 'linear-gradient(135deg, #D4F1F4 0%, #E8F4F8 25%, #F3E8FF 60%, #E8D4FF 100%)'
      }
    },
    {
      name: 'medium-dark',
      displayName: 'Medium Dark Theme',
      colors: {
        bodyBackground: 'linear-gradient(135deg, #2a3f5f 0%, #3d5a7a 25%, #4a4a6a 60%, #5a4a7a 100%)',
        primary: '#3d52a5ff',
        primaryDark: '#4263d9',
        primaryLight: '#748ffc',
        secondary: '#a78bfa',
        secondaryLight: '#c4b5fd',
        scrollbarThumb: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)',
        scrollbarThumbHover: 'linear-gradient(135deg, #9370e8 0%, #b39ef0 100%)',
        scrollbarThumbActive: 'linear-gradient(135deg, #7f55d6 0%, #a287e3 100%)',
        textPrimary: '#e0e7ff',
        textSecondary: '#c7d2fe',
        textAccent: '#a5b4fc',
        border: '#4a5568',
        cardBackground: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
        cardBackgroundSolid: '#374151',
        logoBackground: 'linear-gradient(135deg, #D4F1F4 0%, #E8F4F8 25%, #F3E8FF 60%, #E8D4FF 100%)',
        hoverOverlay: 'rgba(92, 124, 250, 0.1)',
        previewGradient: 'linear-gradient(135deg, #2a3f5f 0%, #3d5a7a 25%, #4a4a6a 60%, #5a4a7a 100%)'
      }
    },
    {
      name: 'dark',
      displayName: 'Dark Theme',
      colors: {
        bodyBackground: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #1e1e2e 60%, #2a1e3e 100%)',
        primary: '#2a2e50ff',
        primaryDark: '#6366f1',
        primaryLight: '#a5b4fc',
        secondary: '#c084fc',
        secondaryLight: '#e9d5ff',
        scrollbarThumb: 'linear-gradient(135deg, #c084fc 0%, #e9d5ff 100%)',
        scrollbarThumbHover: 'linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)',
        scrollbarThumbActive: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
        textPrimary: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textAccent: '#c4b5fd',
        border: '#374151',
        cardBackground: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        cardBackgroundSolid: '#1f2937',
        logoBackground: 'linear-gradient(135deg, #D4F1F4 0%, #E8F4F8 25%, #F3E8FF 60%, #E8D4FF 100%)',
        hoverOverlay: 'rgba(129, 140, 248, 0.1)',
        previewGradient: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #1e1e2e 60%, #2a1e3e 100%)'
      }
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Get a theme by name
   */
  getTheme(name: 'light' | 'medium-dark' | 'dark' | 'custom'): Theme {
    return this.themes.find(t => t.name === name) || this.themes[0];
  }

  /**
   * Create a custom theme from gradient and color settings
   */
  createCustomTheme(customTheme: {
    gradientColors: string[];
    primaryColor: string;
    secondaryColor: string;
    textPrimaryColor: string;
    textSecondaryColor: string;
    cardBackgroundColor: string;
    borderColor: string;
  }): Theme {
    const gradientStops = customTheme.gradientColors.map((color, index) => {
      const percent = (index / (customTheme.gradientColors.length - 1)) * 100;
      return `${color} ${percent}%`;
    }).join(', ');
    
    const bodyBackground = `linear-gradient(135deg, ${gradientStops})`;
    
    // Generate darker/lighter variants of primary color
    const primaryDark = this.adjustColorBrightness(customTheme.primaryColor, -20);
    const primaryLight = this.adjustColorBrightness(customTheme.primaryColor, 20);
    const secondaryLight = this.adjustColorBrightness(customTheme.secondaryColor, 20);
    
    return {
      name: 'custom',
      displayName: 'Custom Theme',
      colors: {
        bodyBackground,
        primary: customTheme.primaryColor,
        primaryDark,
        primaryLight,
        secondary: customTheme.secondaryColor,
        secondaryLight,
        scrollbarThumb: `linear-gradient(135deg, ${customTheme.secondaryColor} 0%, ${secondaryLight} 100%)`,
        scrollbarThumbHover: `linear-gradient(135deg, ${this.adjustColorBrightness(customTheme.secondaryColor, -10)} 0%, ${this.adjustColorBrightness(secondaryLight, -10)} 100%)`,
        scrollbarThumbActive: `linear-gradient(135deg, ${this.adjustColorBrightness(customTheme.secondaryColor, -20)} 0%, ${this.adjustColorBrightness(secondaryLight, -20)} 100%)`,
        textPrimary: customTheme.textPrimaryColor,
        textSecondary: customTheme.textSecondaryColor,
        textAccent: customTheme.primaryColor,
        border: customTheme.borderColor,
        cardBackground: `linear-gradient(135deg, ${customTheme.cardBackgroundColor} 0%, ${this.adjustColorBrightness(customTheme.cardBackgroundColor, -5)} 100%)`,
        cardBackgroundSolid: customTheme.cardBackgroundColor,
        logoBackground: bodyBackground,
        hoverOverlay: this.hexToRgba(customTheme.primaryColor, 0.05),
        previewGradient: bodyBackground
      }
    };
  }

  /**
   * Adjust color brightness
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = num >> 16;
    const g = num >> 8 & 0x00FF;
    const b = num & 0x0000FF;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Determine if a color is dark
   */
  private isColorDark(hexColor: string): boolean {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness < 128;
  }

  /**
   * Apply a custom theme
   */
  applyCustomTheme(customTheme: {
    gradientColors: string[];
    primaryColor: string;
    secondaryColor: string;
    textPrimaryColor: string;
    textSecondaryColor: string;
    cardBackgroundColor: string;
    borderColor: string;
  }): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const theme = this.createCustomTheme(customTheme);
    this.applyThemeObject(theme);
  }

  /**
   * Apply theme object directly
   */
  private applyThemeObject(theme: Theme): void {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--body-background', theme.colors.bodyBackground);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--color-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-secondary-light', theme.colors.secondaryLight);
    root.style.setProperty('--scrollbar-thumb', theme.colors.scrollbarThumb);
    root.style.setProperty('--scrollbar-thumb-hover', theme.colors.scrollbarThumbHover);
    root.style.setProperty('--scrollbar-thumb-active', theme.colors.scrollbarThumbActive);
    root.style.setProperty('--text-primary', theme.colors.textPrimary);
    root.style.setProperty('--text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--text-accent', theme.colors.textAccent);
    root.style.setProperty('--border-color', theme.colors.border);
    root.style.setProperty('--card-background', theme.colors.cardBackground);
    root.style.setProperty('--card-background-solid', theme.colors.cardBackgroundSolid);
    root.style.setProperty('--logo-background', theme.colors.logoBackground);
    root.style.setProperty('--hover-overlay', theme.colors.hoverOverlay);

    // Apply body background directly (since it's a gradient)
    document.body.style.background = theme.colors.bodyBackground;
    document.body.style.backgroundAttachment = 'fixed';

    // Store theme name as data attribute for potential CSS targeting
    root.setAttribute('data-theme', theme.name);
  }

  /**
   * Apply a theme to the document
   * Only works in browser environment (not during SSR)
   */
  applyTheme(themeName: 'light' | 'medium-dark' | 'dark' | 'custom'): void {
    // Check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip theme application during SSR
    }

    const theme = this.getTheme(themeName);
    this.applyThemeObject(theme);
  }
}
