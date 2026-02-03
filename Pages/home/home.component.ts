import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamesService, Game } from '../../Services';

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  games$ = this.gamesService.getGames$();

  constructor(private gamesService: GamesService) {}

  trackByGameId(_: number, game: Game): string {
    return game.id;
  }
}
