import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { ItemsService, SlotItem } from './items.service';

export interface Prize {
  pattern: string[];
  reward: string;
}

export interface PityOdds {
  [index: number]: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrizeService {
  prizes$: Observable<Prize[]>;
  pityOdds$: Observable<PityOdds>;

  // Saved indicator subject
  private savedSubject = new BehaviorSubject<boolean>(false);
  public saved$ = this.savedSubject.asObservable();

  constructor(
    private storage: StorageService,
    private itemsService: ItemsService
  ) {
    // Use observables directly from storage service
    this.prizes$ = this.storage.watchPrizes();
    this.pityOdds$ = this.storage.watchPityOdds();

    // Initialize pity odds for prizes that don't have them
    const prizes = this.storage.getPrizes() || [];
    const pityOdds = this.storage.getPityOdds() || {};
    let updated = false;
    prizes.forEach((_, index) => {
      if (pityOdds[index] === undefined) {
        pityOdds[index] = 1;
        updated = true;
      }
    });
    if (updated) {
      this.storage.setPityOdds(pityOdds);
    }
  }

  getPrizes(): Prize[] {
    return this.storage.getPrizes() || [];
  }

  getPityOdds(prizeIndex: number): number {
    return (this.storage.getPityOdds() || {})[prizeIndex] || 1;
  }

  addPrize(prize: Prize): void {
    const prizes = [...(this.storage.getPrizes() || []), prize];
    this.storage.setPrizes(prizes);

    const pityOdds = { ...(this.storage.getPityOdds() || {}) };
    pityOdds[prizes.length - 1] = 1;
    this.storage.setPityOdds(pityOdds);

    this.showSavedIndicator();
  }

  updatePrize(index: number, prize: Prize): void {
    const prizes = [...(this.storage.getPrizes() || [])];
    prizes[index] = prize;
    this.storage.setPrizes(prizes);
    this.showSavedIndicator();
  }

  deletePrize(index: number): void {
    const prizes = [...(this.storage.getPrizes() || [])];
    prizes.splice(index, 1);
    this.storage.setPrizes(prizes);

    // Rebuild pity odds without the deleted prize
    const oldPityOdds = this.storage.getPityOdds() || {};
    const newPityOdds: PityOdds = {};
    Object.keys(oldPityOdds).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex < index) {
        newPityOdds[keyIndex] = oldPityOdds[keyIndex];
      } else if (keyIndex > index) {
        newPityOdds[keyIndex - 1] = oldPityOdds[keyIndex];
      }
    });
    this.storage.setPityOdds(newPityOdds);

    this.showSavedIndicator();
  }

  updatePityOdds(index: number, value: number): void {
    const pityOdds = { ...(this.storage.getPityOdds() || {}) };
    pityOdds[index] = value;
    this.storage.setPityOdds(pityOdds);
    this.showSavedIndicator();
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

  /**
   * Calculate the probability of a prize pattern occurring
   * @param pattern The prize pattern (item names or '*' for wildcards)
   * @param items Optional items array - if not provided, will load from ItemsService
   */
  calculatePrizeProbability(pattern: string[], items?: SlotItem[]): number {
    // Use provided items or load from service
    const itemsArray = items || this.itemsService.getItems();
    
    // Load odds from localStorage via StorageService
    const storedOdds = this.storage.getOdds() || {};

    // Calculate normalized odds (sum to 1)
    let totalWeight = 0;
    itemsArray.forEach(item => {
      totalWeight += storedOdds[item.name] || 1;
    });

    // Handle edge case of no items
    if (totalWeight === 0) {
      return 0;
    }

    const normalizedOdds: { [key: string]: number } = {};
    itemsArray.forEach(item => {
      const weight = storedOdds[item.name] || 1;
      normalizedOdds[item.name] = weight / totalWeight;
    });

    // Calculate pattern probability (multiply probabilities for each position)
    let probability = 1;
    pattern.forEach(itemName => {
      if (itemName === '*') {
        // Wildcard matches anything, probability is 1
        probability *= 1;
      } else {
        // Specific item probability
        probability *= (normalizedOdds[itemName] || 0);
      }
    });

    return probability;
  }

  formatProbability(probability: number): string {
    const percentage = probability * 100;
    // Always show as percentage, even for very small values
    if (percentage < 1) {
        for(let i = 0; i <= 6; i++) {
            if (percentage >= parseFloat(0 + '0.' + '0'.repeat(i) + '1')) {
                return percentage.toFixed(i + 2) + '%';
            }
        }   
    }
    
    return percentage.toFixed(0) + '%';
  }

  normalizePityOddsForGroup(prizeIndices: number[]): { [index: number]: number } {
    const pityOdds = this.storage.getPityOdds() || {};
    
    let total = 0;
    prizeIndices.forEach(index => {
      const weight = pityOdds[index] || 1;
      total += weight;
    });

    const normalized: { [index: number]: number } = {};
    prizeIndices.forEach(index => {
      const weight = pityOdds[index] || 1;
      normalized[index] = weight / total;
    });
    
    return normalized;
  }

  /**
   * Check if the next roll will be a pity roll
   * Returns true if pity system is enabled and the threshold has been reached
   */
  isPityRollNext(): boolean {
    const pityEnabled = this.storage.getPityEnabled();
    const pityValue = this.storage.getPityValue() || 10;
    const spinsWithoutWin = this.storage.getSpinsWithoutWin() || 0;
    
    return pityEnabled && spinsWithoutWin >= pityValue;
  }
}
