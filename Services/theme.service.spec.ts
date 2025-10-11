import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have three themes', () => {
    expect(service.themes.length).toBe(3);
  });

  it('should get theme by name', () => {
    const lightTheme = service.getTheme('light');
    expect(lightTheme.name).toBe('light');
    
    const mediumDarkTheme = service.getTheme('medium-dark');
    expect(mediumDarkTheme.name).toBe('medium-dark');
    
    const darkTheme = service.getTheme('dark');
    expect(darkTheme.name).toBe('dark');
  });

  it('should apply theme to document', () => {
    service.applyTheme('dark');
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('dark');
  });
});
