import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../../Services/storage.service';
import { ItemsService } from '../../../Services/items.service';
import { PrizeDisplayItemComponent } from '../prize-display-item/prize-display-item.component'
import { PrizeService } from '../../../Services/prize.service';

@Component({
  selector: 'prizelist-display',
  standalone: true,
  imports: [
    PrizeDisplayItemComponent,
    CommonModule
  ],
  templateUrl: './prizelist-display.component.html',
  styleUrl: './prizelist-display.component.scss'
})
export class PrizelistDisplayComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  filteredPrizes: { prize: any; originalIndex: number }[] = [];
  isPityRollNext: boolean = this.prizeService.isPityRollNext();
  showPityWarning: boolean = this.storage.getShowPityWarning();
  currentRollerCount: number = 4;
  items: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private storage: StorageService,
    private prizeService: PrizeService,
    private itemsService: ItemsService
  ) {}

  ngOnInit(): void {
    this.loadPrizes();

    // Watch for changes to prizes, items, roller count, and pity settings
    this.storage.watchPrizes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.itemsService.items$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.storage.watchRollerCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.storage.watchSpinsWithoutWin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.storage.watchPityEnabled()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.storage.watchPityValue()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPrizes());

    this.storage.watchShowPityWarning()
      .pipe(takeUntil(this.destroy$))
      .subscribe(show => this.showPityWarning = show);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPrizes() {
    if (!this.isBrowser) {
      return;
    }

    // Load data from services
    this.items = this.itemsService.getItems();
    const prizes = this.storage.getPrizes() || [];
    
    // Check if pity roll is upcoming (must match the trigger condition)
    const pityEnabled = this.storage.getPityEnabled();
    const pityValue = this.storage.getPityValue();
    const spinsWithoutWin = this.storage.getSpinsWithoutWin();
    this.isPityRollNext = pityEnabled && spinsWithoutWin >= pityValue;
    
    // Get current roller count
    this.currentRollerCount = this.storage.getRollerCount();
    
    // Filter prizes to only show those matching the current roller count, with original indices
    this.filteredPrizes = [];
    prizes.forEach((prize: any, index: number) => {
        if (prize.pattern && prize.pattern.length === this.currentRollerCount) {
          this.filteredPrizes.push({ prize: prize, originalIndex: index });
        }
    });
  }

  /**
   * Get the indices of all prizes in the current filtered group
   */
  getGroupIndices(): number[] {
    return this.filteredPrizes.map(item => item.originalIndex);
  }
}
