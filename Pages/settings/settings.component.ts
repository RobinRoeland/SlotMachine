import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { SettingsService, AppSettings } from '../../Services/settings.service';
import { GamesService, Game } from '../../Services/games.service';
import { ThemeService } from '../../Services/theme.service';
import { TutorialService } from '../../Services/tutorial.service';
import { BaseComponent } from '../../Services/base.component';
import { SettingsSectionComponent } from '../../Components/settings/settings-section/settings-section.component';
import { SettingItemComponent } from '../../Components/settings/setting-item/setting-item.component';
import { ToggleSwitchComponent } from '../../Components/settings/toggle-switch/toggle-switch.component';

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
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent extends BaseComponent implements OnInit {
  settings: AppSettings;
  showSaved = false;
  isMobile = false;
  games: Game[] = [];
  
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
    public gamesService: GamesService,
    private themeService: ThemeService,
    private tutorialService: TutorialService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    super();
    // Initialize with current settings from service
    this.settings = this.settingsService.getSettings();
    // Load available games
    this.games = this.gamesService.getGames();
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
    // Load tutorial for the current game
    const currentGame = this.gamesService.getCurrentGame();
    if (currentGame) {
      this.tutorialService.loadTutorialForGame(currentGame.id);
    }
    
    // Reset tutorial state to allow it to be shown again
    this.tutorialService.resetTutorial();
    this.tutorialService.showTutorialModal();
  }

  /**
   * Export all application data
   */
  exportAllData(): void {
    this.settingsService.exportAllData();
  }

  /**
   * Import all application data
   */
  async importAllData(): Promise<void> {
    await this.settingsService.importAllData();
  }

  /**
   * Check if we should show game-specific settings (when there's a current game context)
   */
  shouldShowGameSettings(): boolean {
    return this.gamesService.getCurrentGame() !== null;
  }

  /**
   * Check if a tutorial exists for the current game
   */
  hasTutorial(): boolean {
    const currentGame = this.gamesService.getCurrentGame();
    if (!currentGame) return false;
    
    // Try to load the tutorial and check if it exists
    return this.tutorialService.loadTutorialForGame(currentGame.id);
  }

  /**
   * Get unique groups from game settings
   */
  getGameSettingsGroups(game: Game): string[] {
    if (!game.gameSettings) return [];
    const groups = game.gameSettings
      .map(setting => setting.group)
      .filter((group, index, self) => group && self.indexOf(group) === index);
    return groups as string[];
  }

  /**
   * Get settings for a specific group
   */
  getGameSettingsByGroup(game: Game, group: string) {
    if (!game.gameSettings) return [];
    return game.gameSettings.filter(setting => setting.group === group);
  }

  /**
   * Check if this is the last group
   */
  isLastGroup(game: Game, group: string): boolean {
    const groups = this.getGameSettingsGroups(game);
    return groups.indexOf(group) === groups.length - 1;
  }

  /**
   * Get setting value by ID (maps to existing settings)
   */
  getSettingValue(settingId: string): any {
    // First check if it's a mapped global setting
    const idMap: Record<string, any> = {
      'prize-machine-display-settings': this.settings.showPrizesList,
      'prize-machine-show-odds': this.settings.showOdds,
      'prize-machine-pity-system': this.settings.enablePitySystem,
      'prize-machine-show-pity-warning': this.settings.showPityWarning,
      'prize-machine-enable-arduino': this.settings.enableArduinoControl,
      'prize-machine-show-button-text-roll': this.settings.showButtonTextRoll,
      'prize-machine-button-text-roll': this.settings.buttonTextRoll,
      'prize-machine-show-notification-rolling': this.settings.showNotificationRolling,
      'prize-machine-notification-rolling': this.settings.notificationRolling,
      'prize-machine-show-notification-win': this.settings.showNotificationWin,
      'prize-machine-notification-win': this.settings.notificationWin,
      'prize-machine-show-notification-after-roll': this.settings.showNotificationAfterRoll,
      'prize-machine-notification-after-roll': this.settings.notificationAfterRoll,
      'prize-machine-show-button-text-arduino': this.settings.showButtonTextArduino,
      'prize-machine-button-text-arduino': this.settings.buttonTextArduino
    };
    
    if (idMap[settingId] !== undefined) {
      return idMap[settingId];
    }
    
    // Otherwise, get it from game-specific settings
    const currentGame = this.gamesService.getCurrentGame();
    if (currentGame) {
      return this.gamesService.getGameSetting(currentGame.id, settingId);
    }
    
    return false;
  }

  /**
   * Handle game setting change
   */
  onGameSettingChange(settingId: string, value: any): void {
    const currentGame = this.gamesService.getCurrentGame();
    if (!currentGame) return;

    // Check if this is a mapped global setting
    const idMap: Record<string, string> = {
      'prize-machine-display-settings': 'showPrizesList',
      'prize-machine-show-odds': 'showOdds',
      'prize-machine-pity-system': 'enablePitySystem',
      'prize-machine-show-pity-warning': 'showPityWarning',
      'prize-machine-enable-arduino': 'enableArduinoControl',
      'prize-machine-show-button-text-roll': 'showButtonTextRoll',
      'prize-machine-button-text-roll': 'buttonTextRoll',
      'prize-machine-show-notification-rolling': 'showNotificationRolling',
      'prize-machine-notification-rolling': 'notificationRolling',
      'prize-machine-show-notification-win': 'showNotificationWin',
      'prize-machine-notification-win': 'notificationWin',
      'prize-machine-show-notification-after-roll': 'showNotificationAfterRoll',
      'prize-machine-notification-after-roll': 'notificationAfterRoll',
      'prize-machine-show-button-text-arduino': 'showButtonTextArduino',
      'prize-machine-button-text-arduino': 'buttonTextArduino'
    };
    
    const settingKey = idMap[settingId];
    if (settingKey) {
      // Handle global settings
      // Validate text inputs
      if (typeof value === 'string' && value.trim()) {
        this.settingsService.updateSetting(settingKey as keyof AppSettings, value.trim());
      } else if (typeof value === 'boolean') {
        this.settingsService.updateSetting(settingKey as keyof AppSettings, value);
        
        // Special handling for pity system
        if (settingId === 'prize-machine-pity-system' && !value) {
          this.settingsService.updateSetting('showPityWarning', false);
        }
        
        // Prevent enabling Arduino on mobile
        if (settingId === 'prize-machine-enable-arduino' && value && this.isMobile) {
          this.settingsService.updateSetting('enableArduinoControl', false);
        }
      }
    } else {
      // Handle game-specific settings
      if (typeof value === 'string') {
        value = value.trim();
      }
      this.gamesService.saveGameSettings(currentGame.id, settingId, value);
    }
  }
}
