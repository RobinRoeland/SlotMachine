import { GameSettings } from '../games.service';

/**
 * Settings configuration for the Test Game
 */
export function getTestGameSettings(): GameSettings[] {
  return [
    {
      id: 'test-game-show-banner',
      label: 'Show Welcome Banner',
      description: 'Toggle a placeholder banner for this test game.',
      type: 'toggle',
      value: true,
      group: 'Display Settings'
    }
  ];
}
