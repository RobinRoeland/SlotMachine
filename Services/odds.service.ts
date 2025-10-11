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

  public hasUnsavedChanges$: Observable<boolean>;
  public hasUnsavedRollerCount$: Observable<boolean>;
  public hasUnsavedPityValue$: Observable<boolean>;

  private savedOdds: OddsMap = {};
  private savedRollerCount: number = 4;
  private savedPityValue: number = 10;
  
  private savedRollerCountSubject: BehaviorSubject<number>;
  private savedPityValueSubject: BehaviorSubject<number>;

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

    // Initialize saved values with proper null handling
    this.savedOdds = this.storage.getOdds() || {};
    this.savedRollerCount = this.storage.getRollerCount() || 4;
    this.savedPityValue = this.storage.getPityValue() || 10;
    
    this.savedRollerCountSubject = new BehaviorSubject<number>(this.savedRollerCount);
    this.savedPityValueSubject = new BehaviorSubject<number>(this.savedPityValue);

    // Set up observables for unsaved changes
    this.hasUnsavedChanges$ = this.odds$.pipe(
      map(odds => JSON.stringify(odds || {}) !== JSON.stringify(this.savedOdds)),
      distinctUntilChanged()
    );

    this.hasUnsavedRollerCount$ = combineLatest([
      this.rollerCount$,
      this.savedRollerCountSubject
    ]).pipe(
      map(([current, saved]) => current !== saved),
      distinctUntilChanged()
    );

    this.hasUnsavedPityValue$ = combineLatest([
      this.pityValue$,
      this.savedPityValueSubject
    ]).pipe(
      map(([current, saved]) => current !== saved),
      distinctUntilChanged()
    );
  }

  public updateOdds(itemName: string, weight: number): void {
    const currentOdds = { ...(this.storage.getOdds() || {}) };
    currentOdds[itemName] = weight;
    this.storage.setOdds(currentOdds);
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
  }

  public saveOdds(): void {
    try {
      const odds = this.storage.getOdds() || {};
      this.savedOdds = JSON.parse(JSON.stringify(odds));
      this.errorMessageSubject.next('');
    } catch (err: any) {
      this.errorMessageSubject.next('Failed to save odds: ' + err.message);
    }
  }

  public updateRollerCount(count: number): void {
    this.storage.setRollerCount(count);
  }

  public saveRollerCount(): void {
    const count = this.storage.getRollerCount() || 4;
    if (count >= 1 && count <= 10) {
      this.savedRollerCount = count;
      this.savedRollerCountSubject.next(count);
      this.errorMessageSubject.next('');
    } else {
      this.errorMessageSubject.next('Roller count must be between 1 and 10');
    }
  }

  public updatePityValue(value: number): void {
    this.storage.setPityValue(value);
  }

  public savePityValue(): void {
    const value = this.storage.getPityValue() || 10;
    if (value >= 1 && value <= 1000) {
      this.savedPityValue = value;
      this.savedPityValueSubject.next(value);
      this.errorMessageSubject.next('');
    } else {
      this.errorMessageSubject.next('Pity value must be between 1 and 1000');
    }
  }

  public getOddsForItem(itemName: string): number {
    const odds = this.storage.getOdds() || {};
    return odds[itemName] || 1;
  }
}
