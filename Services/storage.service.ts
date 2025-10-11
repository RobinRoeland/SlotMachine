import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, EMPTY } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * Centralized localStorage service that provides reactive access to localStorage data.
 * All data is read from and written to localStorage immediately.
 * Components can subscribe to changes via observables.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Storage keys
  private readonly KEYS = {
    ITEMS_DRAFT: 'slot_items_draft',
    ODDS: 'slot_odds',
    PRIZES: 'slot_prizes',
    PITY_ODDS: 'slot_pity_odds',
    ROLLER_COUNT: 'slot_roller_count',
    PITY_VALUE: 'slot_pity_value',
    PITY_ENABLED: 'settings_enable_pity_system',
    SHOW_PITY_WARNING: 'settings_show_pity_warning',
    SPINS_WITHOUT_WIN: 'slot_spins_without_win',
    SHOW_ODDS: 'settings_show_odds',
    SHOW_PRIZES_LIST: 'settings_show_prizes_list',
    ARDUINO_ENABLED: 'settings_enable_arduino_control',
    COMPANY_LOGO: 'settings_company_logo',
    COMPANY_LOGO_SMALL: 'settings_company_logo_small'
  };

  // Subjects for each key to notify subscribers of changes
  private subjects = new Map<string, BehaviorSubject<any>>();

  constructor() {
    // Initialize subjects for all keys
    Object.values(this.KEYS).forEach(key => {
      const value = this.getItem(key);
      this.subjects.set(key, new BehaviorSubject(value));
    });

    // Listen for storage events from other tabs/windows (browser only)
    if (this.isBrowser) {
      fromEvent<StorageEvent>(window, 'storage').subscribe(event => {
        if (event.key && this.subjects.has(event.key)) {
          const newValue = this.parseValue(event.newValue);
          this.subjects.get(event.key)?.next(newValue);
        }
      });
    }
  }

  /**
   * Get an observable that emits whenever the value for a key changes
   */
  watch<T>(key: string): Observable<T> {
    if (!this.subjects.has(key)) {
      const value = this.getItem(key);
      this.subjects.set(key, new BehaviorSubject(value));
    }
    return this.subjects.get(key)!.asObservable();
  }

  /**
   * Get the current value for a key from localStorage
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    if (!this.isBrowser) {
      return defaultValue !== undefined ? defaultValue : null;
    }
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return defaultValue !== undefined ? defaultValue : null;
      }
      return this.parseValue(value);
    } catch (e) {
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  /**
   * Set a value in localStorage and notify all subscribers
   */
  setItem<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      
      // Notify subscribers
      if (this.subjects.has(key)) {
        this.subjects.get(key)!.next(value);
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Remove an item from localStorage and notify subscribers
   */
  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(key);
      if (this.subjects.has(key)) {
        this.subjects.get(key)!.next(null);
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Clear all localStorage and notify all subscribers
   */
  clear(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.clear();
      this.subjects.forEach(subject => subject.next(null));
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get the storage keys
   */
  get keys() {
    return this.KEYS;
  }

  /**
   * Parse a stored value (try JSON parse, otherwise return as string)
   */
  private parseValue(value: string | null): any {
    if (value === null) return null;
    
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      // If parsing fails, return as string
      return value;
    }
  }

  // Convenience methods for common operations

  getItems(): any[] {
    return this.getItem(this.KEYS.ITEMS_DRAFT, []) || [];
  }

  setItems(items: any[]): void {
    this.setItem(this.KEYS.ITEMS_DRAFT, items);
  }

  watchItems(): Observable<any[]> {
    return this.watch(this.KEYS.ITEMS_DRAFT);
  }

  getOdds(): { [key: string]: number } {
    return this.getItem(this.KEYS.ODDS, {}) || {};
  }

  setOdds(odds: { [key: string]: number }): void {
    this.setItem(this.KEYS.ODDS, odds);
  }

  watchOdds(): Observable<{ [key: string]: number }> {
    return this.watch(this.KEYS.ODDS);
  }

  getPrizes(): any[] {
    return this.getItem(this.KEYS.PRIZES, []) || [];
  }

  setPrizes(prizes: any[]): void {
    this.setItem(this.KEYS.PRIZES, prizes);
  }

  watchPrizes(): Observable<any[]> {
    return this.watch(this.KEYS.PRIZES);
  }

  getPityOdds(): { [key: number]: number } {
    return this.getItem(this.KEYS.PITY_ODDS, {}) || {};
  }

  setPityOdds(pityOdds: { [key: number]: number }): void {
    this.setItem(this.KEYS.PITY_ODDS, pityOdds);
  }

  watchPityOdds(): Observable<{ [key: number]: number }> {
    return this.watch(this.KEYS.PITY_ODDS);
  }

  getRollerCount(): number {
    const value = this.getItem<string>(this.KEYS.ROLLER_COUNT);
    return value ? parseInt(value as string, 10) : 4;
  }

  setRollerCount(count: number): void {
    this.setItem(this.KEYS.ROLLER_COUNT, count.toString());
  }

  watchRollerCount(): Observable<number> {
    return this.watch<string>(this.KEYS.ROLLER_COUNT).pipe(
      map(value => value ? parseInt(value as string, 10) : 4)
    );
  }

  getPityValue(): number {
    const value = this.getItem<string>(this.KEYS.PITY_VALUE);
    return value ? parseInt(value as string, 10) : 10;
  }

  setPityValue(value: number): void {
    this.setItem(this.KEYS.PITY_VALUE, value.toString());
  }

  watchPityValue(): Observable<number> {
    return this.watch<string>(this.KEYS.PITY_VALUE).pipe(
      map(value => value ? parseInt(value as string, 10) : 10)
    );
  }

  getPityEnabled(): boolean {
    const value = this.getItem(this.KEYS.PITY_ENABLED);
    if (value === null) return false;
    // Handle both boolean and string values
    return value === true || value === 'true';
  }

  setPityEnabled(enabled: boolean): void {
    this.setItem(this.KEYS.PITY_ENABLED, enabled.toString());
  }

  watchPityEnabled(): Observable<boolean> {
    return this.watch(this.KEYS.PITY_ENABLED).pipe(
      map(value => {
        if (value === null) return false;
        // Handle both boolean and string values
        return value === true || value === 'true';
      })
    );
  }

  getShowPityWarning(): boolean {
    const value = this.getItem(this.KEYS.SHOW_PITY_WARNING);
    if (value === null) return true; // Default to true
    // Handle both boolean and string values
    return value === true || value === 'true';
  }

  setShowPityWarning(show: boolean): void {
    this.setItem(this.KEYS.SHOW_PITY_WARNING, show.toString());
  }

  watchShowPityWarning(): Observable<boolean> {
    return this.watch(this.KEYS.SHOW_PITY_WARNING).pipe(
      map(value => {
        if (value === null) return true; // Default to true
        // Handle both boolean and string values
        return value === true || value === 'true';
      })
    );
  }

  getSpinsWithoutWin(): number {
    const value = this.getItem<string>(this.KEYS.SPINS_WITHOUT_WIN);
    return value ? parseInt(value as string, 10) : 0;
  }

  setSpinsWithoutWin(count: number): void {
    this.setItem(this.KEYS.SPINS_WITHOUT_WIN, count.toString());
  }

  watchSpinsWithoutWin(): Observable<number> {
    return this.watch<string>(this.KEYS.SPINS_WITHOUT_WIN).pipe(
      map(value => value ? parseInt(value as string, 10) : 0)
    );
  }

  getShowOdds(): boolean {
    const value = this.getItem(this.KEYS.SHOW_ODDS);
    if (value === null) return true;
    // Handle both boolean and string values
    return value === true || value === 'true';
  }

  setShowOdds(show: boolean): void {
    this.setItem(this.KEYS.SHOW_ODDS, show.toString());
  }

  watchShowOdds(): Observable<boolean> {
    return this.watch(this.KEYS.SHOW_ODDS).pipe(
      map(value => {
        if (value === null) return true;
        // Handle both boolean and string values
        return value === true || value === 'true';
      })
    );
  }

  getShowPrizesList(): boolean {
    const value = this.getItem(this.KEYS.SHOW_PRIZES_LIST);
    if (value === null) return true;
    // Handle both boolean and string values
    return value === true || value === 'true';
  }

  setShowPrizesList(show: boolean): void {
    this.setItem(this.KEYS.SHOW_PRIZES_LIST, show.toString());
  }

  watchShowPrizesList(): Observable<boolean> {
    return this.watch(this.KEYS.SHOW_PRIZES_LIST).pipe(
      map(value => {
        if (value === null) return true;
        // Handle both boolean and string values
        return value === true || value === 'true';
      })
    );
  }

  getArduinoEnabled(): boolean {
    const value = this.getItem(this.KEYS.ARDUINO_ENABLED);
    if (value === null) return false;
    // Handle both boolean and string values
    return value === true || value === 'true';
  }

  setArduinoEnabled(enabled: boolean): void {
    this.setItem(this.KEYS.ARDUINO_ENABLED, enabled.toString());
  }

  watchArduinoEnabled(): Observable<boolean> {
    return this.watch(this.KEYS.ARDUINO_ENABLED).pipe(
      map(value => {
        if (value === null) return false;
        // Handle both boolean and string values
        return value === true || value === 'true';
      })
    );
  }

  getCompanyLogo(): string {
    const value = this.getItem<string>(this.KEYS.COMPANY_LOGO);
    return value || '';
  }

  setCompanyLogo(logo: string): void {
    this.setItem(this.KEYS.COMPANY_LOGO, logo);
  }

  watchCompanyLogo(): Observable<string> {
    return this.watch<string>(this.KEYS.COMPANY_LOGO).pipe(
      map(value => value || '')
    );
  }

  getCompanyLogoSmall(): string {
    const value = this.getItem<string>(this.KEYS.COMPANY_LOGO_SMALL);
    return value || '';
  }

  setCompanyLogoSmall(logo: string): void {
    this.setItem(this.KEYS.COMPANY_LOGO_SMALL, logo);
  }

  watchCompanyLogoSmall(): Observable<string> {
    return this.watch<string>(this.KEYS.COMPANY_LOGO_SMALL).pipe(
      map(value => value || '')
    );
  }
}
