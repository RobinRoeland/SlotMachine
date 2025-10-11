import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../../Services/storage.service';
import { ItemsService, SlotItem } from '../../../Services/items.service';
import { PrizeService } from '../../../Services/prize.service';
import { PrizePatternBuilderComponent } from '../prize-pattern-builder/prize-pattern-builder.component';

@Component({
  selector: 'app-add-prize-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PrizePatternBuilderComponent],
  templateUrl: './add-prize-modal.component.html',
  styleUrl: './add-prize-modal.component.scss'
})
export class AddPrizeModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  currentPattern: (SlotItem | '*' | null)[] = [];
  prizeReward = '';
  items: SlotItem[] = [];
  rollerCount = 4;
  probabilityText = '--';

  private destroy$ = new Subject<void>();

  constructor(
    private prizeService: PrizeService,
    private itemsService: ItemsService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.rollerCount = this.storage.getRollerCount();
    this.items = this.itemsService.getItems();

    // Watch for roller count changes
    this.storage.watchRollerCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.rollerCount = count;
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

  onPatternChange(pattern: (SlotItem | '*' | null)[]): void {
    this.currentPattern = pattern;
    this.updateProbability();
  }

  private updateProbability(): void {
    // Check if all slots are filled
    const allFilled = this.currentPattern.every(item => item !== null);

    if (!allFilled) {
      this.probabilityText = '--';
      return;
    }

    // Convert pattern to names
    const patternNames = this.currentPattern.map(item => {
      if (item === '*') return '*';
      if (item && typeof item === 'object' && 'name' in item) return item.name;
      return '*';
    });

    // Calculate probability
    const probability = this.prizeService.calculatePrizeProbability(patternNames, this.items);
    this.probabilityText = this.prizeService.formatProbability(probability);
  }

  onConfirm(): void {
    if (!this.prizeReward.trim()) {
      alert('Please enter a prize reward!');
      return;
    }

    // Check if all slots are filled
    const allFilled = this.currentPattern.every(item => item !== null);
    if (!allFilled) {
      alert('Please fill all pattern slots!');
      return;
    }

    // Convert pattern to array of names
    const patternNames = this.currentPattern.map(item => {
      if (item === '*') return '*';
      if (item && typeof item === 'object' && 'name' in item) return item.name;
      return '*';
    });

    this.prizeService.addPrize({
      pattern: patternNames,
      reward: this.prizeReward
    });

    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
