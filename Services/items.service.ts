import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  }

  /**
   * Get a specific item by name
   */
  getItemByName(name: string): SlotItem | undefined {
    return this.getItems().find(item => item.name === name);
  }

  /**
   * Get item image by name
   */
  getItemImage(name: string): string | undefined {
    return this.getItemByName(name)?.imageSrc;
  }

  /**
   * Check if an item exists
   */
  hasItem(name: string): boolean {
    return this.getItems().some(item => item.name === name);
  }

  /**
   * Get all item names
   */
  getItemNames(): string[] {
    return this.getItems().map(item => item.name);
  }
}
