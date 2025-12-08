import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrizeService } from '../../Services/prize.service';
import { PrizeListComponent } from '../../Components/prizes/prize-list/prize-list.component';
import { AddPrizeModalComponent } from '../../Components/prizes/add-prize-modal/add-prize-modal.component';
import { BaseComponent } from '../../Services/base.component';
import { FileService } from '../../Services/file.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-prizes',
  standalone: true,
  imports: [CommonModule, PrizeListComponent, AddPrizeModalComponent],
  templateUrl: './prizes.component.html',
  styleUrl: './prizes.component.scss'
})
export class PrizesComponent extends BaseComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  showModal = false;
  showSaved = false;
  errorMessage = '';

  constructor(
    private prizeService: PrizeService,
    private fileService: FileService
  ) {
    super();
  }

  ngOnInit(): void {
    // Subscribe to saved indicator
    this.prizeService.saved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(saved => {
        this.showSaved = saved;
      });
  }

  openAddPrizeModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  async importPrizes(): Promise<void> {
    this.errorMessage = '';
    try {
      const data = await this.fileService.importJSON();
      
      // Validate the imported data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid prizes data format');
      }

      // Validate structure
      if (!data.prizes || !Array.isArray(data.prizes)) {
        throw new Error('Prizes data must contain a "prizes" array');
      }

      // Validate each prize
      for (const prize of data.prizes) {
        if (!prize.pattern || !Array.isArray(prize.pattern)) {
          throw new Error('Each prize must have a "pattern" array');
        }
        if (typeof prize.reward !== 'string') {
          throw new Error('Each prize must have a "reward" string');
        }
      }

      // Validate pityOdds if present
      if (data.pityOdds) {
        if (typeof data.pityOdds !== 'object') {
          throw new Error('pityOdds must be an object');
        }
      }

      // Import prizes and pity odds
      this.prizeService.importPrizes(data.prizes, data.pityOdds || {});
    } catch (err: any) {
      this.errorMessage = err.message || String(err);
      // Clear error after 5 seconds
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }
  }

  exportPrizes(): void {
    if (!this.isBrowser) {
      return;
    }

    this.errorMessage = '';
    try {
      const prizes = this.prizeService.getPrizes();
      const pityOdds = this.prizeService.getAllPityOdds();
      
      const exportData = {
        prizes,
        pityOdds
      };

      this.fileService.exportJSON(exportData, 'prizes.json');
    } catch (err: any) {
      this.errorMessage = err.message || String(err);
      // Clear error after 5 seconds
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }
  }
}
