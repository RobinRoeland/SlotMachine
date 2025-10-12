import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrizeService } from '../../Services/prize.service';
import { PrizeListComponent } from '../../Components/prizes/prize-list/prize-list.component';
import { AddPrizeModalComponent } from '../../Components/prizes/add-prize-modal/add-prize-modal.component';
import { BaseComponent } from '../../Services/base.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-prizes',
  standalone: true,
  imports: [CommonModule, PrizeListComponent, AddPrizeModalComponent],
  templateUrl: './prizes.component.html',
  styleUrl: './prizes.component.scss'
})
export class PrizesComponent extends BaseComponent {
  showModal = false;
  showSaved = false;

  constructor(private prizeService: PrizeService) {
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
}
