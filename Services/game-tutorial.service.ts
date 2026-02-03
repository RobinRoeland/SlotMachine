import { Injectable } from '@angular/core';
import { TutorialStep } from './tutorial.service';

export type GameSpecificCompletionChecker = (
  step: TutorialStep,
  element: HTMLElement,
  steps: TutorialStep[]
) => boolean | null;

/**
 * Service for game-specific tutorial functionality
 * Handles completion checks and element validation for game-specific elements
 */
@Injectable({
  providedIn: 'root'
})
export class GameTutorialService {
  private completionCheckers = new Map<string, GameSpecificCompletionChecker>();

  /**
   * Register a game-specific completion checker
   */
  registerCompletionChecker(gameId: string, checker: GameSpecificCompletionChecker): void {
    this.completionCheckers.set(gameId, checker);
  }

  /**
   * Check if an element is in a modal or interactive context
   */
  isInModalContext(element: HTMLElement, targetSelector?: string): boolean {
    return !!(
      targetSelector === '.items-grid' || 
      targetSelector === '.item-card' ||
      element.closest('.modal, .item-picker-modal, .modal-content')
    );
  }

  /**
   * Check if an action is complete for game-specific elements
   * Returns null if not a game-specific element, or boolean if it is
   */
  checkGameSpecificActionCompletion(
    gameId: string | undefined,
    step: TutorialStep, 
    element: HTMLElement,
    steps: TutorialStep[]
  ): boolean | null {
    if (!gameId) {
      return null;
    }

    const checker = this.completionCheckers.get(gameId);
    if (!checker) {
      return null;
    }

    return checker(step, element, steps);
  }
}
