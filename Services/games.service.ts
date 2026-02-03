import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  category?: 'game' | 'general';
}

export interface GameSettings {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  value?: any;
  options?: Array<{ label: string; value: any }>;
  group?: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  lastPlayed?: Date;
  playCount: number;
  navigationItems?: NavItem[];
  gameSettings?: GameSettings[];
}

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private games: Game[] = [
    {
      id: 'slot-machine',
      name: 'Prize Machine',
      description: 'A customizable slot machine game with prizes, odds, and Arduino integration',
      route: '/game',
      icon: '🎰',
      playCount: 0,
      navigationItems: [
        { label: 'Play', route: '/game', icon: '🎮', category: 'game' },
        { label: 'Edit Items', route: '/edit-items', icon: '🎨', category: 'game' },
        { label: 'Edit Odds', route: '/edit-odds', icon: '📊', category: 'game' },
        { label: 'Edit Prizes', route: '/edit-prizes', icon: '🏆', category: 'game' },
        { label: 'Settings', route: '/settings', icon: '⚙️', category: 'general' }
      ],
      gameSettings: [
        {
          id: 'prize-machine-display-settings',
          label: 'Show Prizes List',
          description: 'Display the list of available prizes on the right side of the play page.',
          type: 'toggle',
          value: true,
          group: 'Display Settings'
        },
        {
          id: 'prize-machine-show-odds',
          label: 'Show Win Chances',
          description: 'Display the probability of winning each prize in the prizes list.',
          type: 'toggle',
          value: false,
          group: 'Display Settings'
        },
        {
          id: 'prize-machine-pity-system',
          label: 'Enable Pity System',
          description: 'Automatically grant a win after reaching the pity threshold set in Edit Odds.',
          type: 'toggle',
          value: false,
          group: 'Pity System'
        },
        {
          id: 'prize-machine-show-pity-warning',
          label: 'Show Pity Warning',
          description: 'Display a warning message when the next roll is guaranteed to be a win.',
          type: 'toggle',
          value: false,
          group: 'Pity System'
        }
      ]
    },
    {
      id: 'test-game',
      name: 'Test Game',
      description: 'A simple placeholder game to verify multi-game support.',
      route: '/test-game',
      icon: '🧪',
      playCount: 0,
      navigationItems: [
        { label: 'Play', route: '/test-game', icon: '🎮', category: 'game' },
        { label: 'Settings', route: '/settings', icon: '⚙️', category: 'general' }
      ],
      gameSettings: [
        {
          id: 'test-game-show-banner',
          label: 'Show Welcome Banner',
          description: 'Toggle a placeholder banner for this test game.',
          type: 'toggle',
          value: true,
          group: 'Display Settings'
        }
      ]
    }
  ];

  private gamesSubject = new BehaviorSubject<Game[]>(this.games);
  public games$ = this.gamesSubject.asObservable();
  
  private currentGameSubject = new BehaviorSubject<Game | null>(null);
  public currentGame$ = this.currentGameSubject.asObservable();

  constructor() {
    this.loadGameStats();
  }

  getGames(): Game[] {
    return [...this.games];
  }

  getGames$(): Observable<Game[]> {
    return this.games$;
  }

  getGame(id: string): Game | undefined {
    return this.games.find(game => game.id === id);
  }

  setCurrentGame(game: Game | null): void {
    this.currentGameSubject.next(game);
  }

  getCurrentGame(): Game | null {
    return this.currentGameSubject.value;
  }

  recordGamePlayed(gameId: string): void {
    const game = this.games.find(g => g.id === gameId);
    if (game) {
      game.playCount++;
      game.lastPlayed = new Date();
      this.saveGameStats();
      this.gamesSubject.next([...this.games]);
    }
  }

  addGame(game: Game): void {
    this.games.push(game);
    this.gamesSubject.next([...this.games]);
    this.saveGameStats();
  }

  private loadGameStats(): void {
    const statsJson = localStorage.getItem('game-stats');
    if (statsJson) {
      try {
        const stats = JSON.parse(statsJson);
        this.games.forEach(game => {
          const savedStats = stats[game.id];
          if (savedStats) {
            game.playCount = savedStats.playCount || 0;
            game.lastPlayed = savedStats.lastPlayed ? new Date(savedStats.lastPlayed) : undefined;
          }
        });
        this.gamesSubject.next([...this.games]);
      } catch (error) {
        console.error('Error loading game stats:', error);
      }
    }
  }

  private saveGameStats(): void {
    const stats: Record<string, { playCount: number; lastPlayed?: string }> = {};
    this.games.forEach(game => {
      stats[game.id] = {
        playCount: game.playCount,
        lastPlayed: game.lastPlayed?.toISOString()
      };
    });
    localStorage.setItem('game-stats', JSON.stringify(stats));
  }

  getGameByRoute(route: string): Game | undefined {
    let game = this.games.find(g => route.startsWith(g.route));
    
    if (!game) {
      game = this.games.find(g => 
        g.navigationItems?.some(item => item.route === route || route.startsWith(item.route))
      );
    }
    
    return game;
  }

  getNavigationItems(gameId: string): NavItem[] {
    const game = this.games.find(g => g.id === gameId);
    return game?.navigationItems || [];
  }
}
