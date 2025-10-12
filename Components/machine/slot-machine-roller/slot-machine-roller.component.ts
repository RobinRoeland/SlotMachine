import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../../Services/storage.service';

export interface Item {
  name: string;
  imageSrc: string;
}

@Component({
  selector: 'slot-machine-roller',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './slot-machine-roller.component.html',
  styleUrls: ['./slot-machine-roller.component.scss'],
})
export class SlotMachineRollerComponent {
  @Input() items: Item[] = [];
  @Input() isRolling: boolean = false;
  @ViewChild('rollerContent', { static: false }) rollerContent?: ElementRef;

  displayItems: Item[] = [];
  currentlyRolling: boolean = this.isRolling;
  private updateInterval: any;
  private animationTimeout: any; // Track the animation setTimeout
  private forcedCenterItem: Item | null = null; // Track forced item for pity wins

  constructor(private storage: StorageService) {}

  ngOnInit(): void {
    // Only generate items if we have items to work with
    if (this.items.length > 0) {
      this.generateDisplayItems();
    }
  }

  ngOnChanges(): void {
    // Only regenerate display items if we're not currently rolling
    // This prevents overwriting the final state after stopRolling()
    if (this.items.length > 0 && !this.currentlyRolling && this.displayItems.length === 0) {
      this.generateDisplayItems();
    }
  }

  generateDisplayItems(): void {
    // Always generate exactly 5 items to maintain height
    this.displayItems = [];
    
    // If we have 5 or more items, ensure all display items are distinct
    if (this.items.length >= 5) {
      // Shuffle items and take first 5
      const shuffled = [...this.items].sort(() => Math.random() - 0.5);
      this.displayItems = shuffled.slice(0, 5);
    } else if (this.items.length > 0) {
      // If fewer than 5 items, show all available items (may have duplicates if < 5)
      // Fill with distinct items first
      const availableItems = [...this.items];
      for (let i = 0; i < 5 && availableItems.length > 0; i++) {
        // Pick a random item from remaining available items
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        this.displayItems.push(availableItems[randomIndex]);
        availableItems.splice(randomIndex, 1);
        
        // If we've used all items and still need more, reset the pool
        if (availableItems.length === 0 && this.displayItems.length < 5) {
          availableItems.push(...this.items);
        }
      }
    }
  }

  getWeightedItem(items: Item[]): Item | null {
    if (!items || items.length === 0) return null;

    // Load odds from StorageService
    const storedOdds = this.storage.getOdds() || {};

    // Calculate total weight
    let totalWeight = 0;
    items.forEach(item => {
      totalWeight += storedOdds[item.name] || 1;
    });

    // Select random item based on weights
    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const item of items) {
      currentWeight += storedOdds[item.name] || 1;
      if (random <= currentWeight) {
        return item;
      }
    }

    // Fallback to first item
    return items[0];
  }

  startRolling(totalDuration: number): void {
    this.currentlyRolling = true;
    
    // Clear any forced item from previous roll
    this.forcedCenterItem = null;
    
    const startTime = Date.now();
    
    // Gradually slow down the rolling
    const scheduleNextUpdate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalDuration) {
        return; // Stop scheduling
      }

      // Calculate progress (0 to 1)
      const progress = elapsed / totalDuration;

      // Ease out: slow down over time
      // Speed goes from 50ms to 400ms per item
      const currentInterval = 50 + (350 * progress * progress);

      if (this.rollerContent) {
        const contentEl = this.rollerContent.nativeElement;
        
        // Add transition for smooth sliding
        contentEl.style.transition = `transform ${currentInterval}ms linear`;
        contentEl.style.transform = `translateY(-20%)`;
        
        // After the slide animation completes, update the items array
        this.animationTimeout = setTimeout(() => {
          // Check if we should still be rolling (stopRolling might have been called)
          if (!this.currentlyRolling) {
            return;
          }
          
          // Remove transition temporarily to snap back to position
          contentEl.style.transition = 'none';
          contentEl.style.transform = 'translateY(0)';
          
          // Shift all items up and add new item at bottom
          for (let i = 0; i < this.displayItems.length - 1; i++) {
            this.displayItems[i] = this.displayItems[i + 1];
          }
          
          const newItem = this.getWeightedItem(this.items);
          if (newItem) {
            this.displayItems[this.displayItems.length - 1] = newItem;
          }
          
          // If we have a forced center item, ensure it stays at center (index 2)
          if (this.forcedCenterItem && this.displayItems.length > 2) {
            this.displayItems[2] = this.forcedCenterItem;
          }
          
          // Force change detection
          this.displayItems = [...this.displayItems];
          
          // Schedule next update
          this.updateInterval = setTimeout(scheduleNextUpdate, 10);
        }, currentInterval);
      } else {
        // Fallback without animation
        for (let i = 0; i < this.displayItems.length - 1; i++) {
          this.displayItems[i] = this.displayItems[i + 1];
        }
        const newItem = this.getWeightedItem(this.items);
        if (newItem) {
          this.displayItems[this.displayItems.length - 1] = newItem;
        }
        this.updateInterval = setTimeout(scheduleNextUpdate, currentInterval);
      }
    };

    // Start the rolling cycle
    scheduleNextUpdate();
  }

  stopRolling(): void {
    this.currentlyRolling = false;
    
    // Clear any pending updates (both timeouts)
    if (this.updateInterval) {
      clearTimeout(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Reset animation
    if (this.rollerContent) {
      const contentEl = this.rollerContent.nativeElement;
      contentEl.style.animation = 'none';
      contentEl.style.transform = 'translateY(0)';
    }
  }

  getCenterItem(): string {
    // Center item is at index 2
    if (this.displayItems.length > 2) {
      return this.displayItems[2].name;
    }
    return '';
  }

  setCenterItem(item: Item): void {
    // Set the center item (index 2) to the target
    this.forcedCenterItem = item;
    if (this.displayItems.length > 2) {
      this.displayItems[2] = item;
      // Force change detection
      this.displayItems = [...this.displayItems];
    }
  }

  clearForcedItem(): void {
    this.forcedCenterItem = null;
  }
}
