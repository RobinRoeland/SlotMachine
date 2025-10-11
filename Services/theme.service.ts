import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Theme definition interface
 */
export interface Theme {
  name: 'light' | 'medium-dark' | 'dark';
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
  getTheme(name: 'light' | 'medium-dark' | 'dark'): Theme {
    return this.themes.find(t => t.name === name) || this.themes[0];
  }

  /**
   * Apply a theme to the document
   * Only works in browser environment (not during SSR)
   */
  applyTheme(themeName: 'light' | 'medium-dark' | 'dark'): void {
    // Check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip theme application during SSR
    }

    const theme = this.getTheme(themeName);
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
}
