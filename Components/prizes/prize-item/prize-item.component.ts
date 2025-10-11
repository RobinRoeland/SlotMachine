import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Prize } from '../../../Services/prize.service';
import { SlotItem } from '../../../Services/items.service';
import { PrizeService } from '../../../Services/prize.service';

@Component({
  selector: 'app-prize-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prize-item.component.html',
  styleUrl: './prize-item.component.scss'
})
export class PrizeItemComponent implements OnInit, OnChanges {
  @Input() prize!: Prize;
  @Input() index!: number;
  @Input() items: SlotItem[] = [];
  @Input() groupIndices: number[] = [];
  @Output() delete = new EventEmitter<void>();
  @Output() rewardChange = new EventEmitter<string>();

  probability = 0;
  probabilityText = '--';
  pityWeight = 1;
  pityPercentage = 0;

  constructor(private prizeService: PrizeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Update pity percentage when groupIndices or items change
    if (changes['groupIndices'] && !changes['groupIndices'].firstChange) {
      this.updatePityPercentage();
    }
    if (changes['items'] && !changes['items'].firstChange) {
      this.calculateProbability();
    }
  }

  ngOnInit(): void {
    this.calculateProbability();
    
    // Initialize pity weight from service
    this.pityWeight = this.prizeService.getPityOdds(this.index) || 1;
    
    // Calculate initial pity percentage
    this.updatePityPercentage();
    
    // Subscribe to pity odds changes to update weight and percentage
    this.prizeService.pityOdds$.subscribe(pityOdds => {
      this.pityWeight = pityOdds[this.index] || 1;
      this.updatePityPercentage();
    });
  }

  calculateProbability(): void {
    this.probability = this.prizeService.calculatePrizeProbability(this.prize.pattern, this.items);
    this.probabilityText = this.prizeService.formatProbability(this.probability);
  }

  updatePityPercentage(): void {
    // Check if groupIndices is set and not empty
    if (!this.groupIndices || this.groupIndices.length === 0) {
      this.pityPercentage = 0;
      return;
    }
    
    // Calculate normalized percentage for this prize within its group
    const normalizedOdds = this.prizeService.normalizePityOddsForGroup(this.groupIndices);
    this.pityPercentage = (normalizedOdds[this.index] || 0) * 100;
  }

  onRewardChange(value: string): void {
    this.rewardChange.emit(value);
  }

  onDelete(): void {
    this.delete.emit();
  }

  getItemObject(itemName: string): SlotItem | undefined {
    return this.items.find(item => item.name === itemName);
  }

  onWeightChange(): void {
    // Update the service with the new weight - this triggers reactive updates
    this.prizeService.updatePityOdds(this.index, this.pityWeight);
  }
}
