import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotItem } from '../../../Services/items.service';

@Component({
  selector: 'items-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './items-grid.component.html',
  styleUrl: './items-grid.component.scss'
})
export class ItemsGridComponent {
  @Input() items: SlotItem[] = [];
}
