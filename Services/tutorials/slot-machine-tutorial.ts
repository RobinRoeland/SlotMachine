import { TutorialStep } from '../tutorial.service';

/**
 * Check if a pattern slot has been filled with an item
 */
function isPatternSlotFilled(element: HTMLElement): boolean {
  const img = element.querySelector('img');
  const wildcard = element.querySelector('.wildcard-icon');
  return img !== null || wildcard !== null;
}

/**
 * Slot machine specific completion checker
 */
export function checkSlotMachineCompletion(
  step: TutorialStep,
  element: HTMLElement,
  steps: TutorialStep[]
): boolean | null {
  if (!step.waitForAction) {
    return null;
  }

  switch (step.actionType) {
    case 'input':
      // Check if it's a pattern slot (for goalSelector on pattern builder)
      if (element.classList.contains('pattern-slot')) {
        return isPatternSlotFilled(element);
      }
      return null; // Not a game-specific element

    case 'click':
      // For pattern slot clicks, check if the slot has been filled
      if (step.targetSelector?.startsWith('.pattern-slot')) {
        return isPatternSlotFilled(element);
      }
      return null;

    case 'hover':
      // For item grid hovers, check if the CORRESPONDING pattern slot is complete
      if (step.targetSelector === '.items-grid') {
        const currentIndex = steps.indexOf(step);
        // Look for the next input step after this hover step
        for (let i = currentIndex + 1; i < steps.length; i++) {
          const futureStep = steps[i];
          if (futureStep.actionType === 'input' && 
              futureStep.targetSelector === '.items-grid' && 
              futureStep.goalSelector) {
            const patternSlot = document.querySelector(futureStep.goalSelector) as HTMLElement;
            if (patternSlot) {
              return isPatternSlotFilled(patternSlot);
            }
            break; // Found the corresponding input step, stop looking
          }
          // If we hit another click or hover step, this isn't the right input step
          if (futureStep.actionType === 'click' || futureStep.actionType === 'hover') {
            break;
          }
        }
      }
      return null;

    default:
      return null;
  }
}

/**
 * Tutorial steps for the Slot Machine game
 */
export function getSlotMachineTutorialSteps(): TutorialStep[] {
  return [
    {
      title: 'Welcome to Slot Machine! 🎰',
      content: 'Let\'s take a quick interactive tour! I\'ll guide you step-by-step through adding items and prizes.\n\nThis tutorial will show you exactly where to click and what to do. You can skip at any time by clicking the X button.',
      action: 'Start Tour',
      placement: 'center',
      actionType: 'none'
    },
    {
      title: 'Open the Sidebar Menu',
      content: 'First, hover your mouse over the logo in the top-left corner to open the navigation menu. This menu gives you access to all the main features.',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Navigate to Item Editor',
      content: 'Perfect! Now click on "Edit Items" in the sidebar to start adding items to your slot machine.',
      targetSelector: 'nav.nav a[href="/edit-items"]',
      placement: 'right',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'navigate'
    },
    {
      title: 'Add Your First Item',
      content: 'Great! Now click the "Add item" button to create your first slot machine symbol. Items can be anything - fruits, numbers, symbols, or custom images!',
      targetSelector: '.btn-add',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Enter Item Name',
      content: 'Perfect! A window should have opened. Now enter a name for your item in the highlighted field (like "Cherry", "7", or "Diamond").',
      targetSelector: '#newItemName, input[placeholder*="name"]',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Add an Image',
      content: 'Great job! Now let\'s add an image. Click on the highlighted area to select an image file from your device.\n\nYou can also drag and drop an image here!',
      action: 'Waiting for an image...',
      targetSelector: '.drop-zone, input[type="file"]',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Save Your Item',
      content: 'Excellent! Now click the "Add item" button at the bottom to save your item.',
      targetSelector: '.btn-add',
      placement: 'top',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Open the Sidebar Menu',
      content: 'Hover your mouse over the logo in the top-left corner to open the navigation menu.',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Navigate to Prizes',
      content: 'Awesome! Your first item is created! Now let\'s set up a winning combination. Hover over the logo again to open the sidebar, then click on "Edit Prizes".',
      targetSelector: 'nav.nav a[href="/edit-prizes"]',
      placement: 'right',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'navigate'
    },
    {
      title: 'Create Your First Prize',
      content: 'Excellent! Now click the "Add prize" button to create a winning pattern. You can make prizes for matching items, mixed patterns, or use wildcards!',
      targetSelector: '.add-button',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Set Prize Pattern',
      content: 'Awesome! You should now see the prize pattern builder.\n\nHover over the pattern builder area to continue.',
      targetSelector: 'app-prize-pattern-builder, .prize-pattern-builder, [class*="pattern"]',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Click on Pattern Slot 1',
      content: 'Click on the first slot to select an item for your prize pattern.',
      targetSelector: '.pattern-slot:nth-child(1)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Hover Over Item Grid 1',
      content: 'Hover over the item grid. Here are the available items for this slot.',
      targetSelector: '.items-grid',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Click on Item 1',
      content: 'Click on an item in the grid to select it for your prize pattern.',
      action: 'Waiting for an item...',
      targetSelector: '.items-grid',
      goalSelector: '.pattern-slot:nth-child(1)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Click on Pattern Slot 2',
      content: 'Click on the second slot to select an item for your prize pattern.',
      targetSelector: '.pattern-slot:nth-child(2)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 2',
      content: 'Click on an item in the grid to select it for your prize pattern.',
      action: 'Waiting for an item...',
      targetSelector: '.items-grid',
      goalSelector: '.pattern-slot:nth-child(2)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Click on Pattern Slot 3',
      content: 'Click on the third slot to select an item for your prize pattern.',
      targetSelector: '.pattern-slot:nth-child(3)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 3',
      content: 'Click on an item in the grid to select it for your prize pattern.',
      action: 'Waiting for an item...',
      targetSelector: '.items-grid',
      goalSelector: '.pattern-slot:nth-child(3)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Click on Pattern Slot 4',
      content: 'Click on the fourth slot to select an item for your prize pattern.',
      targetSelector: '.pattern-slot:nth-child(4)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 4',
      content: 'Click on an item in the grid to select it for your prize pattern.',
      action: 'Waiting for an item...',
      targetSelector: '.items-grid',
      goalSelector: '.pattern-slot:nth-child(4)',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Name Your Prize',
      content: 'Excellent! Now enter a reward description in the highlighted field. For example: "10 Free Spins", "Grand Prize!", or "$100".',
      targetSelector: '#prizeReward, input[placeholder*="prize"]',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Save Your Prize',
      content: 'Perfect! Now click the "Add Prize" button at the bottom to save your prize.',
      targetSelector: '.btn-confirm, button:has-text("Add Prize")',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Optional: Adjust Odds',
      content: 'Want to fine-tune your slot machine? You can adjust how often each item appears in the "Edit Odds" section.\n\nClick on "Edit Odds" in the sidebar to check it out, or skip to see your machine in action!',
      placement: 'center',
      actionType: 'none'
    },
    {
      title: 'Open the Sidebar Menu',
      content: 'Hover your mouse over the logo in the top-left corner to open the navigation menu.',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Try Your Slot Machine!',
      content: 'Click on "Play" in the sidebar to test your machine and see if you can win your prize!',
      targetSelector: 'nav.nav a[href="/game"]',
      placement: 'right',
      route: '/game',
      waitForAction: true,
      actionType: 'navigate'
    },
    {
      title: 'Ready to Play! 🎰',
      content: 'Amazing work! You\'ve successfully created your first slot machine!\n\n' +
               '✨ Here\'s what you can do next:\n' +
               '✓ Click the "Spin" button to test your machine\n' +
               '✓ Add more items for variety\n' +
               '✓ Create more prizes with different patterns\n' +
               '✓ Adjust odds to fine-tune winning chances\n' +
               '✓ Customize themes in Settings\n\n' +
               'Have fun and good luck! 🍀',
      action: 'Finish Tutorial',
      placement: 'center',
      route: '/game',
      actionType: 'none'
    }
  ];
}
