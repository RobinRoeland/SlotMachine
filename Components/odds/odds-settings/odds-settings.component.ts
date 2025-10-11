import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OddsService } from '../../../Services/odds.service';

@Component({
  selector: 'app-odds-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './odds-settings.component.html',
  styleUrl: './odds-settings.component.scss'
})
export class OddsSettingsComponent implements OnInit {
  rollerCount = 4;
  pityValue = 10;
  pityEnabled = false;
  
  hasUnsavedRollerCount$ = this.oddsService.hasUnsavedRollerCount$;
  hasUnsavedPityValue$ = this.oddsService.hasUnsavedPityValue$;

  constructor(private oddsService: OddsService) {}

  ngOnInit(): void {
    this.oddsService.rollerCount$.subscribe(count => {
      this.rollerCount = count || 4;
    });

    this.oddsService.pityValue$.subscribe(value => {
      this.pityValue = value || 10;
    });

    this.oddsService.pityEnabled$.subscribe(enabled => {
      this.pityEnabled = enabled || false;
    });
  }

  onRollerCountChange(): void {
    this.oddsService.updateRollerCount(this.rollerCount);
  }

  saveRollerCount(): void {
    this.oddsService.saveRollerCount();
  }

  onPityValueChange(): void {
    this.oddsService.updatePityValue(this.pityValue);
  }

  savePityValue(): void {
    this.oddsService.savePityValue();
  }
}
