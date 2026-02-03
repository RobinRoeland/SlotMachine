import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesService } from '../../Services/games.service';

@Component({
  selector: 'test-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-game.component.html',
  styleUrl: './test-game.component.scss'
})
export class TestGameComponent implements OnInit {
  readonly title = 'Test Game';
  readonly description = 'This is a placeholder game to show that multiple games can be registered.';
  showBanner = true;

  constructor(private gamesService: GamesService) {}

  ngOnInit(): void {
    // Record that this game was played
    this.gamesService.recordGamePlayed('test-game');

    // Get the banner setting
    const bannerSetting = this.gamesService.getGameSetting('test-game', 'test-game-show-banner');
    this.showBanner = bannerSetting !== undefined ? bannerSetting : true;

    // Subscribe to game changes to update settings
    this.gamesService.games$.subscribe(games => {
      const testGame = games.find(g => g.id === 'test-game');
      if (testGame) {
        const setting = testGame.gameSettings?.find(s => s.id === 'test-game-show-banner');
        if (setting !== undefined) {
          this.showBanner = setting.value;
        }
      }
    });
  }
}
