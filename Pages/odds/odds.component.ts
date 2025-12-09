import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OddsService } from '../../Services/odds.service';
import { OddsSettingsComponent } from '../../Components/odds/odds-settings/odds-settings.component';
import { OddsListComponent } from '../../Components/odds/odds-list/odds-list.component';
import { BaseComponent } from '../../Services/base.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-odds',
  standalone: true,
  imports: [CommonModule, OddsSettingsComponent, OddsListComponent],
  templateUrl: './odds.component.html',
  styleUrl: './odds.component.scss'
})
export class OddsComponent extends BaseComponent {
  errorMessage$ = this.oddsService.errorMessage$;
  showSaved = false;

  constructor(private oddsService: OddsService) {
    super();
  }

  ngOnInit(): void {
    // Subscribe to saved indicator for odds
    this.oddsService.savedOdds$
      .pipe(takeUntil(this.destroy$))
      .subscribe(saved => {
        this.showSaved = saved;
      });
  }

  resetOdds(): void {
    this.oddsService.resetToEqual();
  }

  exportOdds(): void {
    this.oddsService.exportOdds();
  }

  async importOdds(): Promise<void> {
    await this.oddsService.importOdds();
  }
}
