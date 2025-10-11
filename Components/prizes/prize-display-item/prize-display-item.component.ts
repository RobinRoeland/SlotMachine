import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { StorageService } from '../../../Services/storage.service';
import { ItemsService, SlotItem } from '../../../Services/items.service';
import { PrizeService } from '../../../Services/prize.service';

interface PrizeItem {
  name: string;
  imageSrc?: string;
}

@Component({
  selector: 'prize-display-item',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './prize-display-item.component.html',
  styleUrls: ['./prize-display-item.component.scss']
})

export class PrizeDisplayItemComponent implements OnInit, OnDestroy {
  @Input() prizeItem!: { prize: any; originalIndex: number };
  @Input() showOdds: boolean = this.storage.getShowOdds();
  @Input() isPityRollNext: boolean = this.prizeService.isPityRollNext();
  @Input() showPityWarning: boolean = this.storage.getShowPityWarning();
  @Input() items: PrizeItem[] = [];
  @Input() groupIndices: number[] = []; // Indices of all prizes in the same roller count group

  private destroy$ = new Subject<void>();

  constructor(
    private prizeService: PrizeService,
    private itemsService: ItemsService,
    private storage: StorageService
  ) {}

  ngOnInit() {
    // Load items from ItemsService if not provided
    if (!this.items || this.items.length === 0) {
      this.items = this.itemsService.getItems();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getItemImage(itemName: string): string | undefined {
    const item = this.items.find(i => i.name === itemName);
    return item?.imageSrc;
  }

  calculateProbability(): string {
    // Load items from ItemsService to ensure we have the latest
    const items: SlotItem[] = this.itemsService.getItems();
    
    // Calculate probability using the pattern and deduplicated items
    const probability = this.prizeService.calculatePrizeProbability(
      this.prizeItem.prize.pattern, 
      items
    );

    return this.prizeService.formatProbability(probability);
  }

  getPityChance(): string {
    // If no group indices provided, calculate them based on roller count
    if (!this.groupIndices || this.groupIndices.length === 0) {
      // Get all prizes and filter by roller count
      const allPrizes = this.storage.getPrizes() || [];
      const currentRollerCount = this.prizeItem.prize.pattern.length;
      this.groupIndices = allPrizes
        .map((prize, index) => ({ prize, index }))
        .filter(item => item.prize.pattern && item.prize.pattern.length === currentRollerCount)
        .map(item => item.index);
    }
    
    // Get normalized odds for this prize within its group
    const normalizedOdds = this.prizeService.normalizePityOddsForGroup(this.groupIndices);
    const percentage = (normalizedOdds[this.prizeItem.originalIndex] || 0) * 100;
    
    // Format as percentage
    return percentage.toFixed(1) + '%';
  }
}
