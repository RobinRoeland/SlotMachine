import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { ItemsService, SlotItem } from './items.service';

export interface OddsMap {
  [itemName: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class OddsService {
  private errorMessageSubject = new BehaviorSubject<string>('');

  public odds$: Observable<OddsMap>;
  public items$: Observable<SlotItem[]>;
  public rollerCount$: Observable<number>;
  public pityValue$: Observable<number>;
  public pityEnabled$: Observable<boolean>;
  public errorMessage$ = this.errorMessageSubject.asObservable();

  // Saved indicator subjects - separate for odds and settings
  private savedOddsSubject = new BehaviorSubject<boolean>(false);
  public savedOdds$ = this.savedOddsSubject.asObservable();
  
  private savedSettingsSubject = new BehaviorSubject<boolean>(false);
  public savedSettings$ = this.savedSettingsSubject.asObservable();

  constructor(
    private storage: StorageService,
    private itemsService: ItemsService
  ) {
    // Use observables directly from storage service and items service
    this.items$ = this.itemsService.items$;
    this.odds$ = this.storage.watchOdds();
    this.rollerCount$ = this.storage.watchRollerCount();
    this.pityValue$ = this.storage.watchPityValue();
    this.pityEnabled$ = this.storage.watchPityEnabled();
  }

  public updateOdds(itemName: string, weight: number): void {
    const currentOdds = { ...(this.storage.getOdds() || {}) };
    currentOdds[itemName] = weight;
    this.storage.setOdds(currentOdds);
    this.showSavedOddsIndicator();
  }

  public normalizeOdds(): { [itemName: string]: number } {
    const items = this.itemsService.getItems();
    const odds = this.storage.getOdds() || {};
    
    let total = 0;
    items.forEach((item: SlotItem) => {
      const weight = odds[item.name] || 1;
      total += weight;
    });

    // Handle edge case of no items
    if (total === 0) {
      return {};
    }

    const normalized: { [itemName: string]: number } = {};
    items.forEach((item: SlotItem) => {
      const weight = odds[item.name] || 1;
      normalized[item.name] = weight / total;
    });
    
    return normalized;
  }

  public resetToEqual(): void {
    const items = this.storage.getItems() || [];
    const newOdds: OddsMap = {};
    items.forEach((item: SlotItem) => {
      newOdds[item.name] = 1;
    });
    this.storage.setOdds(newOdds);
    this.showSavedOddsIndicator();
  }

  public updateRollerCount(count: number): void {
    if (count >= 1 && count <= 10) {
      this.storage.setRollerCount(count);
      this.showSavedSettingsIndicator();
      this.errorMessageSubject.next('');
    } else {
      this.errorMessageSubject.next('Roller count must be between 1 and 10');
    }
  }

  public updatePityValue(value: number): void {
    if (value >= 1 && value <= 1000) {
      this.storage.setPityValue(value);
      this.showSavedSettingsIndicator();
      this.errorMessageSubject.next('');
    } else {
      this.errorMessageSubject.next('Pity value must be between 1 and 1000');
    }
  }

  public getOddsForItem(itemName: string): number {
    const odds = this.storage.getOdds() || {};
    return odds[itemName] || 1;
  }

  /**
   * Show saved odds indicator for 2 seconds
   */
  private showSavedOddsIndicator(): void {
    this.savedOddsSubject.next(true);
    setTimeout(() => {
      this.savedOddsSubject.next(false);
    }, 2000);
  }

  /**
   * Show saved settings indicator for 2 seconds
   */
  private showSavedSettingsIndicator(): void {
    this.savedSettingsSubject.next(true);
    setTimeout(() => {
      this.savedSettingsSubject.next(false);
    }, 2000);
  }
}
