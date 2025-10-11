import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ItemsService, SlotItem } from '../../../Services/items.service';
import { PrizeService, Prize } from '../../../Services/prize.service';
import { PrizeItemComponent } from '../prize-item/prize-item.component';

interface PrizeGroup {
  rollerCount: number;
  prizes: { prize: Prize; index: number }[];
  indices: number[]; // Add indices array for the group
}

@Component({
  selector: 'app-prize-list',
  standalone: true,
  imports: [CommonModule, PrizeItemComponent],
  templateUrl: './prize-list.component.html',
  styleUrl: './prize-list.component.scss'
})
export class PrizeListComponent implements OnInit, OnDestroy {
  prizeGroups: PrizeGroup[] = [];
  items: SlotItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private prizeService: PrizeService,
    private itemsService: ItemsService
  ) {}

  ngOnInit(): void {
    // Load items immediately
    this.items = this.itemsService.getItems();
    
    // Subscribe to prizes changes
    this.prizeService.prizes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prizes => {
        this.groupPrizes(prizes);
      });

    // Watch for items changes
    this.itemsService.items$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.items = items;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private groupPrizes(prizes: Prize[]): void {
    // Handle null or empty prizes array
    if (!prizes || !Array.isArray(prizes)) {
      this.prizeGroups = [];
      return;
    }

    const grouped: { [key: number]: { prize: Prize; index: number }[] } = {};
    
    prizes.forEach((prize, index) => {
      const rollerCount = prize.pattern.length;
      if (!grouped[rollerCount]) {
        grouped[rollerCount] = [];
      }
      grouped[rollerCount].push({ prize, index });
    });

    this.prizeGroups = Object.keys(grouped)
      .map(key => parseInt(key))
      .sort((a, b) => a - b)
      .map(rollerCount => ({
        rollerCount,
        prizes: grouped[rollerCount],
        indices: grouped[rollerCount].map(item => item.index)
      }));
  }

  onDeletePrize(index: number): void {
    this.prizeService.deletePrize(index);
  }

  onRewardChange(index: number, reward: string): void {
    const prizes = this.prizeService.getPrizes();
    const prize = { ...prizes[index], reward };
    this.prizeService.updatePrize(index, prize);
  }
}
