import { GameSettings } from '../games.service';

/**
 * Settings configuration for the Slot Machine game
 */
export function getSlotMachineSettings(): GameSettings[] {
  return [
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
    },
    {
      id: 'prize-machine-enable-arduino',
      label: 'Enable Arduino Control',
      description: 'Allow triggering rolls via Arduino board connected through USB. Requires a supported browser (Chrome, Edge, Opera).',
      type: 'toggle',
      value: false,
      group: 'Arduino Control'
    },
    {
      id: 'prize-machine-show-button-text-roll',
      label: 'Ready to Roll State',
      description: 'Show text when the game is ready and waiting for you to click roll.',
      type: 'toggle',
      value: true,
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-button-text-roll',
      label: 'Ready to Roll Text',
      description: 'Text to display on the button when you can click to start rolling.',
      type: 'text',
      value: 'Roll',
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-show-notification-rolling',
      label: 'Currently Rolling State',
      description: 'Show text while the slot machine reels are actively spinning.',
      type: 'toggle',
      value: true,
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-notification-rolling',
      label: 'Currently Rolling Text',
      description: 'Text to display while the reels are in motion (button is disabled).',
      type: 'text',
      value: 'Rolling...',
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-show-notification-win',
      label: 'Win Result State',
      description: 'Show a notification when a winning combination is hit and a prize is won.',
      type: 'toggle',
      value: true,
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-notification-win',
      label: 'Win Notification Text',
      description: 'Text to display when you win. Use "{reward}" to dynamically show the prize name.',
      type: 'text',
      value: 'You won: {reward}!',
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-show-notification-after-roll',
      label: 'After Roll Notification',
      description: 'Show a notification message after every roll is complete (win or loss).',
      type: 'toggle',
      value: false,
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-notification-after-roll',
      label: 'After Roll Text',
      description: 'Notification text that appears after every roll completes, regardless of the outcome.',
      type: 'text',
      value: 'Thanks for playing!',
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-show-button-text-arduino',
      label: 'Arduino Control State',
      description: 'Show instruction text when external Arduino hardware control is active.',
      type: 'toggle',
      value: true,
      group: 'Text Customization'
    },
    {
      id: 'prize-machine-button-text-arduino',
      label: 'Arduino Instruction Text',
      description: 'Text to display when waiting for Arduino physical button press.',
      type: 'text',
      value: 'Press the button to roll!',
      group: 'Text Customization'
    }
  ];
}
