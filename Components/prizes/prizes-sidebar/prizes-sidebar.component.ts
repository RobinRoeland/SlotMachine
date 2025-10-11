import { Component } from '@angular/core';
import { PrizelistDisplayComponent } from '../prizelist-display/prizelist-display.component'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'prizes-sidebar',
  standalone: true,
  imports: [
    PrizelistDisplayComponent,
    CommonModule
  ],
  templateUrl: './prizes-sidebar.component.html',
  styleUrl: './prizes-sidebar.component.scss'
})
export class PrizesSidebarComponent {
  isExpanded = false;

  togglePrizes() {
    this.isExpanded = !this.isExpanded;
  }
}
