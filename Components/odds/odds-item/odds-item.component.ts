import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OddsService } from '../../../Services/odds.service';
import { SlotItem } from '../../../Services/items.service';

@Component({
  selector: 'app-odds-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './odds-item.component.html',
  styleUrl: './odds-item.component.scss'
})
export class OddsItemComponent implements OnInit {
  @Input() item!: SlotItem;
  @Input() percentage: number = 0;
  
  weight: number = 1;

  constructor(private oddsService: OddsService) {}

  ngOnInit(): void {
    this.weight = this.oddsService.getOddsForItem(this.item.name);
    
    this.oddsService.odds$.subscribe(odds => {
      this.weight = odds[this.item.name] || 1;
    });
  }

  onWeightChange(): void {
    this.oddsService.updateOdds(this.item.name, this.weight);
  }
}
