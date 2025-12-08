import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OddsService } from '../../../Services/odds.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-odds-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './odds-settings.component.html',
  styleUrl: './odds-settings.component.scss'
})
export class OddsSettingsComponent implements OnInit {
  rollerCount = 4;
  pityValue = 0;
  pityEnabled = false;
  showSaved = false;
  
  private destroy$ = new Subject<void>();

  constructor(private oddsService: OddsService) {}

  ngOnInit(): void {
    this.oddsService.rollerCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.rollerCount = count ?? 4;
    });

    this.oddsService.pityValue$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.pityValue = value ?? 0;
    });

    this.oddsService.pityEnabled$.pipe(takeUntil(this.destroy$)).subscribe(enabled => {
      this.pityEnabled = enabled ?? false;
    });

    // Subscribe to saved indicator for settings
    this.oddsService.savedSettings$.pipe(takeUntil(this.destroy$)).subscribe(saved => {
      this.showSaved = saved;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRollerCountChange(): void {
    this.oddsService.updateRollerCount(this.rollerCount);
  }

  onPityValueChange(): void {
    this.oddsService.updatePityValue(this.pityValue);
  }
}
