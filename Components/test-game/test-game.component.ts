import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'test-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-game.component.html',
  styleUrl: './test-game.component.scss'
})
export class TestGameComponent {
  readonly title = 'Test Game';
  readonly description = 'This is a placeholder game to show that multiple games can be registered.';
}
