import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OddsService } from '../../Services/odds.service';
import { OddsSettingsComponent } from '../../Components/odds/odds-settings/odds-settings.component';
import { OddsListComponent } from '../../Components/odds/odds-list/odds-list.component';

@Component({
  selector: 'app-odds',
  standalone: true,
  imports: [CommonModule, OddsSettingsComponent, OddsListComponent],
  templateUrl: './odds.component.html',
  styleUrl: './odds.component.scss'
})
export class OddsComponent {
  hasUnsavedChanges$ = this.oddsService.hasUnsavedChanges$;
  errorMessage$ = this.oddsService.errorMessage$;

  constructor(private oddsService: OddsService) {}

  resetOdds(): void {
    this.oddsService.resetToEqual();
  }

  saveOdds(): void {
    this.oddsService.saveOdds();
  }
}
