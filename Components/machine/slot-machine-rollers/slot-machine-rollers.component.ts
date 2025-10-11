import { Component, Input, Output, EventEmitter, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../../Services/storage.service';
import { SlotMachineRollerComponent, Item } from "../slot-machine-roller/slot-machine-roller.component";

import { RangePipe } from '../../../Pipes/range.pipe'

@Component({
  selector: 'app-slot-machine-rollers',
  standalone: true,
  imports: [
    // Components
    SlotMachineRollerComponent,
    CommonModule,
    // Pipes
    RangePipe
  ],
  templateUrl: './slot-machine-rollers.component.html',
  styleUrl: './slot-machine-rollers.component.scss'
})
export class SlotMachineRollersComponent {
  @Input() items: Item[] = [];
  @Input() rollerCount: number = 4;
  @Input() isRolling: boolean = false;
  @Output() rollComplete = new EventEmitter<string[]>();
  
  @ViewChildren(SlotMachineRollerComponent) rollers!: QueryList<SlotMachineRollerComponent>;

  constructor(private storage: StorageService) {}

  startRoll(): void {
    // Check pity system using StorageService
    const pityEnabled = this.storage.getPityEnabled();
    const pityValue = this.storage.getPityValue();
    const spinsWithoutWin = this.storage.getSpinsWithoutWin();
    const forcePity = pityEnabled && spinsWithoutWin >= pityValue;

    // Start rolling animation on all rollers
    const totalDuration = 4000; // 4 seconds
    
    this.rollers.forEach(roller => {
      roller.startRolling(totalDuration);
    });

    // After animation completes
    setTimeout(() => {
      // If pity is active, force a winning combination BEFORE stopping
      if (forcePity) {
        this.forcePityWin();
      }
      
      // Stop rolling AFTER setting the target items
      this.rollers.forEach(roller => {
        roller.stopRolling();
      });

      // Get center items from all rollers
      const centerItems: string[] = [];
      this.rollers.forEach(roller => {
        centerItems.push(roller.getCenterItem());
      });

      // Emit completion event with center items
      this.rollComplete.emit(centerItems);
    }, totalDuration);
  }

  forcePityWin(): void {
    // Load prizes and pity odds from StorageService
    const allPrizes = this.storage.getPrizes() || [];
    const pityOdds = this.storage.getPityOdds() || {};

    // Build array of valid prizes with their original indices
    const validPrizes: {prize: any, originalIndex: number}[] = [];
    allPrizes.forEach((prize, index) => {
      if (prize.pattern && prize.pattern.length === this.rollerCount) {
        validPrizes.push({ prize, originalIndex: index });
      }
    });

    if (validPrizes.length === 0) {
      return;
    }

    // Calculate total weight
    let totalWeight = 0;
    validPrizes.forEach(item => {
      totalWeight += pityOdds[item.originalIndex] || 1;
    });

    // Select a weighted random prize
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedPrize = validPrizes[0].prize;

    for (const item of validPrizes) {
      currentWeight += pityOdds[item.originalIndex] || 1;
      if (random <= currentWeight) {
        selectedPrize = item.prize;
        break;
      }
    }

    // Set each roller to show the prize pattern
    this.rollers.forEach((roller, index) => {
      let targetItemName = selectedPrize.pattern[index];
      
      // If wildcard, pick a random item
      if (targetItemName === '*') {
        targetItemName = this.items[Math.floor(Math.random() * this.items.length)].name;
      }
      
      // Find the target item
      const targetItem = this.items.find(item => item.name === targetItemName);
      
      if (targetItem) {
        roller.setCenterItem(targetItem);
      }
    });
  }
}
