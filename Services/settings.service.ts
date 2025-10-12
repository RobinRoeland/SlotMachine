import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';

/**
 * Settings model
 */
export interface AppSettings {
  showPrizesList: boolean;
  showOdds: boolean;
  enableArduinoControl: boolean;
  enablePitySystem: boolean;
  showPityWarning: boolean;
  companyLogo: string;
  companyLogoSmall: string;
  colorTheme: 'light' | 'medium-dark' | 'dark';
}

/**
 * Service to manage application settings
 * Integrates with StorageService for centralized localStorage management
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Default settings
  private readonly DEFAULT_SETTINGS: AppSettings = {
    showPrizesList: true,
    showOdds: true,
    enableArduinoControl: false,
    enablePitySystem: false,
    showPityWarning: false,
    companyLogo: 'assets/images/Slotmachine-Logo.png',
    companyLogoSmall: 'assets/images/slot-machine-colorful-neon-sign.jpg',
    colorTheme: 'light'
  };

  // BehaviorSubject to track settings changes
  private settingsSubject: BehaviorSubject<AppSettings>;
  public settings$: Observable<AppSettings>;

  // Saved indicator subject
  private savedSubject = new BehaviorSubject<boolean>(false);
  public saved$ = this.savedSubject.asObservable();

  constructor(private storageService: StorageService) {

    const hasSettings = Object.values(storageService.keys).every((key: string) => {
      const item = storageService.getItem(key);
      if (item === null || item === undefined) {
        console.warn(`Storage key ${key} is missing`);
        return false;
      }
      return true;
    });

    // Check if settings exist in storage, if not, initialize with defaults
    if (!hasSettings) {
      this.saveSettings(this.DEFAULT_SETTINGS);
      storageService.setItem(storageService.keys.ITEMS_DRAFT, []); // Ensure items are initialized
      storageService.setItem(storageService.keys.ODDS, []); // Ensure items history is initialized
      storageService.setItem(storageService.keys.PITY_ODDS, []); // Ensure pity items are initialized
      storageService.setItem(storageService.keys.PRIZES, []); // Ensure prizes are initialized
      storageService.setItem(storageService.keys.PITY_VALUE, 5); // Ensure pity value is initialized
      storageService.setItem(storageService.keys.ROLLER_COUNT, 4); // Ensure roller count is initialized
      storageService.setItem(storageService.keys.SPINS_WITHOUT_WIN, 0); // Ensure spins without win is initialized
      console.warn("Settings were undefined, resetting to defaults.");
    }

    const initialSettings = this.loadSettings();
    this.settingsSubject = new BehaviorSubject<AppSettings>(initialSettings);

    // Expose the subject as an observable
    this.settings$ = this.settingsSubject.asObservable();

    // Subscribe to storage changes to keep our subject in sync
    combineLatest([
      this.storageService.watchShowPrizesList(),
      this.storageService.watchShowOdds(),
      this.storageService.watchArduinoEnabled(),
      this.storageService.watchPityEnabled(),
      this.storageService.watchShowPityWarning(),
      this.storageService.watchCompanyLogo(),
      this.storageService.watchCompanyLogoSmall(),
      this.storageService.watchColorTheme(),

    ]).pipe(
      map(([showPrizesList, showOdds, enableArduinoControl, enablePitySystem, showPityWarning, companyLogo, companyLogoSmall, colorTheme]) => ({
        showPrizesList,
        showOdds,
        enableArduinoControl,
        enablePitySystem,
        showPityWarning,
        companyLogo,
        companyLogoSmall,
        colorTheme
      }))
    ).subscribe(settings => {
      this.settingsSubject.next(settings);
    });
  }

  /**
   * Load settings from StorageService
   */
  private loadSettings(): AppSettings {
    const settings = {
      showPrizesList: this.storageService.getShowPrizesList(),
      showOdds: this.storageService.getShowOdds(),
      enableArduinoControl: this.storageService.getArduinoEnabled(),
      enablePitySystem: this.storageService.getPityEnabled(),
      showPityWarning: this.storageService.getShowPityWarning(),
      companyLogo: this.storageService.getCompanyLogo(),
      companyLogoSmall: this.storageService.getCompanyLogoSmall(),
      colorTheme: this.storageService.getColorTheme(),
      slotRollerCount: this.storageService.getRollerCount(),
      slotPityValue: this.storageService.getPityValue()
    };
    return settings;
  }

  /**
   * Save settings to StorageService
   */
  private saveSettings(settings: AppSettings): void {
    this.storageService.setShowPrizesList(settings.showPrizesList);
    this.storageService.setShowOdds(settings.showOdds);
    this.storageService.setArduinoEnabled(settings.enableArduinoControl);
    this.storageService.setPityEnabled(settings.enablePitySystem);
    this.storageService.setShowPityWarning(settings.showPityWarning);
    this.storageService.setCompanyLogo(settings.companyLogo);
    this.storageService.setCompanyLogoSmall(settings.companyLogoSmall);
    this.storageService.setColorTheme(settings.colorTheme);
  }

  /**
   * Get current settings
   */
  getSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  /**
   * Update a specific setting
   */
  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, [key]: value };
    
    // If prizes list is disabled, also disable odds
    if (key === 'showPrizesList' && !value) {
      newSettings.showOdds = false;
    }
    
    // Save to storage service (this will trigger the observables)
    this.saveSettings(newSettings);
    
    // Show saved indicator
    this.showSavedIndicator();
  }

  /**
   * Update multiple settings at once
   */
  updateSettings(partialSettings: Partial<AppSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...partialSettings };
    
    // If prizes list is disabled, also disable odds
    if ('showPrizesList' in partialSettings && !partialSettings.showPrizesList) {
      newSettings.showOdds = false;
    }
    
    // Save to storage service (this will trigger the observables)
    this.saveSettings(newSettings);
    
    // Show saved indicator
    this.showSavedIndicator();
  }

  /**
   * Check if odds should be disabled (when prizes list is not shown)
   */
  isOddsDisabled(): boolean {
    return !this.settingsSubject.value.showPrizesList;
  }

  /**
   * Show saved indicator for 2 seconds
   */
  private showSavedIndicator(): void {
    this.savedSubject.next(true);
    setTimeout(() => {
      this.savedSubject.next(false);
    }, 2000);
  }

  /**
   * Reset all settings to defaults
   */
  resetToDefaults(): void {
    // Save to storage service (this will trigger the observables)
    this.saveSettings(this.DEFAULT_SETTINGS);
    this.showSavedIndicator();
  }
}
