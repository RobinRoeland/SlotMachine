import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { FileService } from './file.service';

/**
 * Full export data structure
 */
export interface FullExportData {
  items: any[];
  odds: { [key: string]: number };
  prizes: any[];
  pityOdds: { [key: number]: number };
  rollerCount: number;
  pityValue: number;
  settings: AppSettings;
  exportDate: string;
  version: string;
}

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
  showButtonTextRoll: boolean;
  showNotificationRolling: boolean;
  showNotificationWin: boolean;
  showButtonTextArduino: boolean;
  showNotificationAfterRoll: boolean;
  buttonTextRoll: string;
  notificationRolling: string;
  notificationWin: string;
  buttonTextArduino: string;
  notificationAfterRoll: string;
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
    colorTheme: 'light',
    showButtonTextRoll: true,
    showNotificationRolling: true,
    showNotificationWin: true,
    showButtonTextArduino: true,
    showNotificationAfterRoll: false,
    buttonTextRoll: 'Roll',
    notificationRolling: 'Rolling...',
    notificationWin: 'You won: {reward}!',
    buttonTextArduino: 'Press the button to roll!',
    notificationAfterRoll: 'Thanks for playing!'
  };

  // BehaviorSubject to track settings changes
  private settingsSubject: BehaviorSubject<AppSettings>;
  public settings$: Observable<AppSettings>;

  // Saved indicator subject
  private savedSubject = new BehaviorSubject<boolean>(false);
  public saved$ = this.savedSubject.asObservable();

  constructor(private storageService: StorageService, private fileService: FileService) {

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
      this.storageService.watchShowButtonTextRoll(),
      this.storageService.watchShowNotificationRolling(),
      this.storageService.watchShowNotificationWin(),
      this.storageService.watchShowButtonTextArduino(),
      this.storageService.watchShowNotificationAfterRoll(),
      this.storageService.watchButtonTextRoll(),
      this.storageService.watchNotificationRolling(),
      this.storageService.watchNotificationWin(),
      this.storageService.watchButtonTextArduino(),
      this.storageService.watchNotificationAfterRoll(),
    ]).pipe(
      map(([showPrizesList, showOdds, enableArduinoControl, enablePitySystem, showPityWarning, companyLogo, companyLogoSmall, colorTheme, showButtonTextRoll, showNotificationRolling, showNotificationWin, showButtonTextArduino, showNotificationAfterRoll, buttonTextRoll, notificationRolling, notificationWin, buttonTextArduino, notificationAfterRoll]) => ({
        showPrizesList,
        showOdds,
        enableArduinoControl,
        enablePitySystem,
        showPityWarning,
        companyLogo,
        companyLogoSmall,
        colorTheme,
        showButtonTextRoll,
        showNotificationRolling,
        showNotificationWin,
        showButtonTextArduino,
        showNotificationAfterRoll,
        buttonTextRoll,
        notificationRolling,
        notificationWin,
        buttonTextArduino,
        notificationAfterRoll
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
      showButtonTextRoll: this.storageService.getShowButtonTextRoll(),
      showNotificationRolling: this.storageService.getShowNotificationRolling(),
      showNotificationWin: this.storageService.getShowNotificationWin(),
      showButtonTextArduino: this.storageService.getShowButtonTextArduino(),
      showNotificationAfterRoll: this.storageService.getShowNotificationAfterRoll(),
      buttonTextRoll: this.storageService.getButtonTextRoll(),
      notificationRolling: this.storageService.getNotificationRolling(),
      notificationWin: this.storageService.getNotificationWin(),
      buttonTextArduino: this.storageService.getButtonTextArduino(),
      notificationAfterRoll: this.storageService.getNotificationAfterRoll(),
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
    this.storageService.setShowButtonTextRoll(settings.showButtonTextRoll);
    this.storageService.setShowNotificationRolling(settings.showNotificationRolling);
    this.storageService.setShowNotificationWin(settings.showNotificationWin);
    this.storageService.setShowButtonTextArduino(settings.showButtonTextArduino);
    this.storageService.setShowNotificationAfterRoll(settings.showNotificationAfterRoll);
    this.storageService.setButtonTextRoll(settings.buttonTextRoll);
    this.storageService.setNotificationRolling(settings.notificationRolling);
    this.storageService.setNotificationWin(settings.notificationWin);
    this.storageService.setButtonTextArduino(settings.buttonTextArduino);
    this.storageService.setNotificationAfterRoll(settings.notificationAfterRoll);
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
   * Export all application data (items, odds, prizes, settings) to JSON file
   */
  exportAllData(): void {
    try {
      const exportData: FullExportData = {
        items: this.storageService.getItems(),
        odds: this.storageService.getOdds(),
        prizes: this.storageService.getPrizes(),
        pityOdds: this.storageService.getPityOdds(),
        rollerCount: this.storageService.getRollerCount(),
        pityValue: this.storageService.getPityValue(),
        settings: this.getSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      this.fileService.exportJSON(exportData, `slot-machine-full-export-${Date.now()}.json`);
    } catch (error: any) {
      throw new Error(`Export failed: ${error.message || String(error)}`);
    }
  }

  /**
   * Import all application data from JSON file
   */
  async importAllData(): Promise<void> {
    try {
      const data = await this.fileService.importJSON();
      
      // Validate the imported data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      const fullData = data as FullExportData;
      
      // Import items if present
      if (Array.isArray(fullData.items)) {
        this.storageService.setItems(fullData.items);
      }
      
      // Import odds if present
      if (fullData.odds && typeof fullData.odds === 'object') {
        this.storageService.setOdds(fullData.odds);
      }
      
      // Import prizes if present
      if (Array.isArray(fullData.prizes)) {
        this.storageService.setPrizes(fullData.prizes);
      }
      
      // Import pity odds if present
      if (fullData.pityOdds && typeof fullData.pityOdds === 'object') {
        this.storageService.setPityOdds(fullData.pityOdds);
      }
      
      // Import roller count if present and valid
      if (typeof fullData.rollerCount === 'number' && fullData.rollerCount >= 1 && fullData.rollerCount <= 10) {
        this.storageService.setRollerCount(fullData.rollerCount);
      }
      
      // Import pity value if present and valid
      if (typeof fullData.pityValue === 'number' && fullData.pityValue >= 0 && fullData.pityValue <= 1000) {
        this.storageService.setPityValue(fullData.pityValue);
      }
      
      // Import settings if present
      if (fullData.settings && typeof fullData.settings === 'object') {
        this.saveSettings(fullData.settings);
      }
      
      this.showSavedIndicator();
    } catch (error: any) {
      throw new Error(`Import failed: ${error.message || String(error)}`);
    }
  }
}
