import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SettingsService, AppSettings } from '../../Services/settings.service';
import { ThemeService } from '../../Services/theme.service';
import { TutorialService } from '../../Services/tutorial.service';
import { BaseComponent } from '../../Services/base.component';
import { SettingsSectionComponent } from '../../Components/settings/settings-section/settings-section.component';
import { SettingItemComponent } from '../../Components/settings/setting-item/setting-item.component';
import { ToggleSwitchComponent } from '../../Components/settings/toggle-switch/toggle-switch.component';
import { TutorialModalComponent } from '../../Components/tutorial-modal/tutorial-modal.component';

/**
 * Settings page component
 * Displays all application settings in a responsive layout
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SettingsSectionComponent,
    SettingItemComponent,
    ToggleSwitchComponent,
    TutorialModalComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent extends BaseComponent implements OnInit {
  settings: AppSettings;
  showSaved = false;
  isMobile = false;
  showTutorialModal = false;
  
  // Logo toggle state: 'regular' or 'small'
  selectedLogoType: 'regular' | 'small' = 'regular';
  
  // Available preset logos (regular size)
  presetLogos = [
    'assets/images/Slotmachine-Logo.png',
  ];

  // Available preset logos (small size)
  presetLogosSmall = [
    'assets/images/slot-machine-colorful-neon-sign.jpg',
  ];

  // Available themes
  availableThemes = this.themeService.themes;

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private tutorialService: TutorialService
  ) {
    super();
    // Initialize with current settings from service
    this.settings = this.settingsService.getSettings();
  }

  ngOnInit(): void {
    this.isMobile = this.isMobileDevice();
    
    // Subscribe to settings changes
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = settings;
      });

    // Subscribe to saved indicator
    this.settingsService.saved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(saved => {
        this.showSaved = saved;
      });
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileUA || isMobileScreen;
  }

  /**
   * Check if odds toggle should be disabled
   */
  get isOddsDisabled(): boolean {
    return this.settingsService.isOddsDisabled();
  }

  /**
   * Handle show prizes list toggle
   */
  onShowPrizesListChange(value: boolean): void {
    this.settingsService.updateSetting('showPrizesList', value);
  }

  /**
   * Handle show odds toggle
   */
  onShowOddsChange(value: boolean): void {
    this.settingsService.updateSetting('showOdds', value);
  }

  /**
   * Handle enable pity system toggle
   */
  onEnablePitySystemChange(value: boolean): void {
    this.settingsService.updateSetting('enablePitySystem', value);
    
    // If disabling pity system, also disable show pity warning
    if (!value) {
      this.settingsService.updateSetting('showPityWarning', false);
    }
  }

  /**
   * Handle show pity warning toggle
   */
  onShowPityWarningChange(value: boolean): void {
    this.settingsService.updateSetting('showPityWarning', value);
  }

  /**
   * Handle enable Arduino control toggle
   */
  onEnableArduinoControlChange(value: boolean): void {
    // Prevent enabling on mobile devices
    if (value && this.isMobile) {
      return;
    }
    this.settingsService.updateSetting('enableArduinoControl', value);
  }

  /**
   * Handle button text roll change
   */
  onButtonTextRollChange(value: string): void {
    if (value && value.trim()) {
      this.settingsService.updateSetting('buttonTextRoll', value.trim());
    }
  }

  /**
   * Handle notification rolling text change
   */
  onNotificationRollingChange(value: string): void {
    if (value && value.trim()) {
      this.settingsService.updateSetting('notificationRolling', value.trim());
    }
  }

  /**
   * Handle notification win text change
   */
  onNotificationWinChange(value: string): void {
    if (value && value.trim()) {
      this.settingsService.updateSetting('notificationWin', value.trim());
    }
  }

  /**
   * Handle button text Arduino change
   */
  onButtonTextArduinoChange(value: string): void {
    if (value && value.trim()) {
      this.settingsService.updateSetting('buttonTextArduino', value.trim());
    }
  }

  /**
   * Handle show button text toggle
   */
  onShowButtonTextChange(value: boolean): void {
    this.settingsService.updateSetting('showButtonTextRoll', value);
  }

  /**
   * Handle show button text roll toggle
   */
  onShowButtonTextRollChange(value: boolean): void {
    this.settingsService.updateSetting('showButtonTextRoll', value);
  }

  /**
   * Handle show notification rolling toggle
   */
  onShowNotificationRollingChange(value: boolean): void {
    this.settingsService.updateSetting('showNotificationRolling', value);
  }

  /**
   * Handle show notification win toggle
   */
  onShowNotificationWinChange(value: boolean): void {
    this.settingsService.updateSetting('showNotificationWin', value);
  }

  /**
   * Handle show button text Arduino toggle
   */
  onShowButtonTextArduinoChange(value: boolean): void {
    this.settingsService.updateSetting('showButtonTextArduino', value);
  }

  /**
   * Handle notification after roll text change
   */
  onNotificationAfterRollChange(value: string): void {
    if (value && value.trim()) {
      this.settingsService.updateSetting('notificationAfterRoll', value.trim());
    }
  }

  /**
   * Handle show notification after roll toggle
   */
  onShowNotificationAfterRollChange(value: boolean): void {
    this.settingsService.updateSetting('showNotificationAfterRoll', value);
  }

  /**
   * Handle logo path input change
   */
  onLogoPathChange(newPath: string): void {
    if (newPath && newPath.trim()) {
      this.settingsService.updateSetting('companyLogo', newPath.trim());
    }
  }

  /**
   * Handle small logo path input change
   */
  onLogoSmallPathChange(newPath: string): void {
    if (newPath && newPath.trim()) {
      this.settingsService.updateSetting('companyLogoSmall', newPath.trim());
    }
  }

  /**
   * Select a preset logo
   */
  selectPresetLogo(logoPath: string): void {
    this.settingsService.updateSetting('companyLogo', logoPath);
  }

  /**
   * Select a preset small logo
   */
  selectPresetLogoSmall(logoPath: string): void {
    this.settingsService.updateSetting('companyLogoSmall', logoPath);
  }

  /**
   * Handle file upload for custom logo
   */
  onLogoFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Create a local URL for the uploaded file
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          // In a real application, you would upload this to a server
          // For now, we'll use a data URL (base64)
          const dataUrl = e.target.result as string;
          this.settingsService.updateSetting('companyLogo', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Handle file upload for custom small logo
   */
  onLogoSmallFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Create a local URL for the uploaded file
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          // In a real application, you would upload this to a server
          // For now, we'll use a data URL (base64)
          const dataUrl = e.target.result as string;
          this.settingsService.updateSetting('companyLogoSmall', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Check if a logo is currently selected
   */
  isLogoSelected(logoPath: string): boolean {
    return this.settings.companyLogo === logoPath;
  }

  /**
   * Check if a small logo is currently selected
   */
  isLogoSmallSelected(logoPath: string): boolean {
    return this.settings.companyLogoSmall === logoPath;
  }

  /**
   * Switch between regular and small logo editing
   */
  switchLogoType(type: 'regular' | 'small'): void {
    this.selectedLogoType = type;
  }

  /**
   * Select a theme
   */
  selectTheme(themeName: 'light' | 'medium-dark' | 'dark'): void {
    this.settingsService.updateSetting('colorTheme', themeName);
    this.themeService.applyTheme(themeName);
  }

  /**
   * Check if a theme is currently selected
   */
  isThemeSelected(themeName: 'light' | 'medium-dark' | 'dark'): boolean {
    return this.settings.colorTheme === themeName;
  }

  /**
   * Show the tutorial modal
   */
  showTutorial(): void {
    // Reset tutorial state to allow it to be shown again
    this.tutorialService.resetTutorial();
    this.showTutorialModal = true;
  }

  /**
   * Close the tutorial modal
   */
  closeTutorial(): void {
    this.showTutorialModal = false;
  }
}
