import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface TutorialStep {
  title: string;
  content: string;
  action: string;
  route?: string;  // Route to navigate to
  targetSelector?: string;  // CSS selector for element to highlight
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';  // Where to place the tooltip
  waitForAction?: boolean;  // Wait for user to perform action
  actionType?: 'click' | 'navigate' | 'input' | 'hover' | 'none';  // Type of action expected
}

/**
 * Service to manage the tutorial/onboarding experience
 */
@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
  
  private tutorialCompletedSubject: BehaviorSubject<boolean>;
  public tutorialCompleted$: Observable<boolean>;

  // Tutorial steps with interactive guidance
  public readonly steps: TutorialStep[] = [
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
      action: 'Waiting for hover...',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Navigate to Item Editor',
      content: 'Perfect! Now click on "Edit Items" in the sidebar to start adding items to your slot machine.',
      action: 'Waiting for navigation...',
      targetSelector: 'side-bar a[routerLink="/edit-items"]',
      placement: 'right',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'navigate'
    },
    {
      title: 'Add Your First Item',
      content: 'Great! Now click the "Add item" button to create your first slot machine symbol. Items can be anything - fruits, numbers, symbols, or custom images!',
      action: 'Waiting for click...',
      targetSelector: '.btn-add',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Enter Item Name',
      content: 'Perfect! A window should have opened. Now enter a name for your item in the highlighted field (like "Cherry", "7", or "Diamond").',
      action: 'Waiting for input...',
      targetSelector: '#newItemName, input[placeholder*="name"]',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Add an Image',
      content: 'Great job! Now let\'s add an image. Click on the highlighted area to select an image file from your device.\n\nYou can also drag and drop an image here!',
      action: 'Waiting for image...',
      targetSelector: '.drop-zone, input[type="file"]',
      placement: 'bottom',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Save Your Item',
      content: 'Excellent! Now click the "Add item" button at the bottom to save your item.',
      action: 'Waiting for click...',
      targetSelector: '.btn-add',
      placement: 'top',
      route: '/edit-items',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Open the Sidebar Menu',
      content: 'Hover your mouse over the logo in the top-left corner to open the navigation menu.',
      action: 'Waiting for hover...',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Navigate to Prizes',
      content: 'Awesome! Your first item is created! Now let\'s set up a winning combination. Hover over the logo again to open the sidebar, then click on "Edit Prizes".',
      action: 'Waiting for navigation...',
      targetSelector: 'side-bar a[routerLink="/edit-prizes"]',
      placement: 'right',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'navigate'
    },
    {
      title: 'Create Your First Prize',
      content: 'Excellent! Now click the "Add prize" button to create a winning pattern. You can make prizes for matching items, mixed patterns, or use wildcards!',
      action: 'Waiting for click...',
      targetSelector: '.add-button',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Set Prize Pattern',
      content: 'Awesome! You should now see the prize pattern builder.\n\nHover over the pattern builder area to continue.',
      action: 'Continue',
      targetSelector: 'app-prize-pattern-builder, .prize-pattern-builder, [class*="pattern"]',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'hover'
    },
    // Repeat slot selection and item selection steps 4 times for a 4-slot prize pattern
    {
      title: 'Click on Pattern Slot 1',
      content: 'Click on the first slot to select an item for your prize pattern.',
      action: 'Continue',
      targetSelector: '.pattern-slot',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Hover Over Item Grid 1',
      content: 'Hover over the item grid. Here are the available items for this slot.',
      action: 'Continue',
      targetSelector: '.items-grid',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Click on Item 1',
      content: 'Click on the highlighted item in the grid to select it for your prize pattern.',
      action: 'Continue',
      targetSelector: '.item-card',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Pattern Slot 2',
      content: 'Click on the second slot to select an item for your prize pattern.',
      action: 'Continue',
      targetSelector: '.pattern-slot:not(:has(img))',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 2',
      content: 'Click on the highlighted item in the grid to select it for your prize pattern.',
      action: 'Continue',
      targetSelector: '.item-card',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Pattern Slot 3',
      content: 'Click on the third slot to select an item for your prize pattern.',
      action: 'Continue',
      targetSelector: '.pattern-slot:not(:has(img))',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 3',
      content: 'Click on the highlighted item in the grid to select it for your prize pattern.',
      action: 'Continue',
      targetSelector: '.item-card',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Pattern Slot 4',
      content: 'Click on the fourth slot to select an item for your prize pattern.',
      action: 'Continue',
      targetSelector: '.pattern-slot:not(:has(img))',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Click on Item 4',
      content: 'Click on the highlighted item in the grid to select it for your prize pattern.',
      action: 'Continue',
      targetSelector: '.item-card',
      placement: 'top',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Name Your Prize',
      content: 'Excellent! Now enter a reward description in the highlighted field. For example: "10 Free Spins", "Grand Prize!", or "$100".',
      action: 'Waiting for input...',
      targetSelector: '#prizeReward, input[placeholder*="prize"]',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'input'
    },
    {
      title: 'Save Your Prize',
      content: 'Perfect! Now click the "Add Prize" button at the bottom to save your prize.',
      action: 'Waiting for click...',
      targetSelector: '.btn-confirm, button:has-text("Add Prize")',
      placement: 'bottom',
      route: '/edit-prizes',
      waitForAction: true,
      actionType: 'click'
    },
    {
      title: 'Optional: Adjust Odds',
      content: 'Want to fine-tune your slot machine? You can adjust how often each item appears in the "Edit Odds" section.\n\nClick on "Edit Odds" in the sidebar to check it out, or skip to see your machine in action!',
      action: 'Continue',
      placement: 'center',
      actionType: 'none'
    },
    {
      title: 'Open the Sidebar Menu',
      content: 'Hover your mouse over the logo in the top-left corner to open the navigation menu.',
      action: 'Waiting for hover...',
      targetSelector: '#toggleSidebar',
      placement: 'right',
      waitForAction: true,
      actionType: 'hover'
    },
    {
      title: 'Try Your Slot Machine!',
      content: 'Click on "Play" in the sidebar to test your machine and see if you can win your prize!',
      action: 'Waiting for navigation...',
      targetSelector: 'side-bar a[routerLink="/game"]',
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

  constructor(private storage: StorageService) {
    const completed = this.storage.getItem<boolean>(this.TUTORIAL_COMPLETED_KEY, false);
    this.tutorialCompletedSubject = new BehaviorSubject<boolean>(completed || false);
    this.tutorialCompleted$ = this.tutorialCompletedSubject.asObservable();
  }

  /**
   * Check if the tutorial has been completed or skipped
   */
  isTutorialCompleted(): boolean {
    return this.tutorialCompletedSubject.value;
  }

  /**
   * Mark the tutorial as completed
   */
  completeTutorial(): void {
    this.storage.setItem(this.TUTORIAL_COMPLETED_KEY, true);
    this.tutorialCompletedSubject.next(true);
  }

  /**
   * Reset the tutorial (allows user to see it again)
   */
  resetTutorial(): void {
    this.storage.setItem(this.TUTORIAL_COMPLETED_KEY, false);
    this.tutorialCompletedSubject.next(false);
  }

  /**
   * Get total number of steps
   */
  getTotalSteps(): number {
    return this.steps.length;
  }
}
