import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface SlotItem {
  name: string;
  imageSrc: string;
}

/**
 * Service to manage slot items
 * Provides centralized access to items with reactive updates
 */
@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  // Observable stream of items
  public items$: Observable<SlotItem[]>;

  // Saved indicator subject
  private savedSubject = new BehaviorSubject<boolean>(false);
  public saved$ = this.savedSubject.asObservable();

  constructor(private storage: StorageService) {
    this.items$ = this.storage.watchItems();
  }

  /**
   * Get current items synchronously
   */
  getItems(): SlotItem[] {
    return this.storage.getItems() || [];
  }

  /**
   * Set items in storage
   */
  setItems(items: SlotItem[]): void {
    this.storage.setItems(items);
    this.showSavedIndicator();
  }

  /**
   * Get a specific item by name
   */
  getItemByName(name: string): SlotItem | undefined {
    return this.getItems().find(item => item.name === name);
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
}
