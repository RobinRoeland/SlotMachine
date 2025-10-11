import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OddsService } from '../../../Services/odds.service';
import { SlotItem } from '../../../Services/items.service';
import { OddsItemComponent } from '../odds-item/odds-item.component';

@Component({
  selector: 'app-odds-list',
  standalone: true,
  imports: [CommonModule, OddsItemComponent],
  templateUrl: './odds-list.component.html',
  styleUrl: './odds-list.component.scss'
})
export class OddsListComponent implements OnInit {
  items: SlotItem[] = [];
  normalizedOdds: { [key: string]: number } = {};

  constructor(private oddsService: OddsService) {}

  ngOnInit(): void {
    this.oddsService.items$.subscribe(items => {
      this.items = items;
      this.updateNormalizedOdds();
    });

    this.oddsService.odds$.subscribe(() => {
      this.updateNormalizedOdds();
    });
  }

  private updateNormalizedOdds(): void {
    this.normalizedOdds = this.oddsService.normalizeOdds();
  }

  getPercentage(itemName: string): number {
    return (this.normalizedOdds[itemName] || 0) * 100;
  }
}
