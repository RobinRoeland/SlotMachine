import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrizeService } from '../../Services/prize.service';
import { PrizeListComponent } from '../../Components/prizes/prize-list/prize-list.component';
import { AddPrizeModalComponent } from '../../Components/prizes/add-prize-modal/add-prize-modal.component';

@Component({
  selector: 'app-prizes',
  standalone: true,
  imports: [CommonModule, PrizeListComponent, AddPrizeModalComponent],
  templateUrl: './prizes.component.html',
  styleUrl: './prizes.component.scss'
})
export class PrizesComponent {
  hasUnsavedChanges$ = this.prizeService.hasUnsavedChanges$;
  errorMessage = '';
  showModal = false;

  constructor(private prizeService: PrizeService) {}

  openAddPrizeModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePrizes(): void {
    try {
      this.prizeService.savePrizes();
      this.errorMessage = '';
    } catch (err: any) {
      this.errorMessage = 'Failed to save prizes: ' + err.message;
    }
  }
}
