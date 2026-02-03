import { Component, EventEmitter, Output, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TutorialService, TutorialStep } from '../../Services/tutorial.service';
import { GameTutorialService } from '../../Services/game-tutorial.service';
import { SafeHtmlPipe } from '../../Pipes/safe-html.pipe';

@Component({
  selector: 'tutorial-modal',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './tutorial-modal.component.html',
  styleUrl: './tutorial-modal.component.scss'
})
export class TutorialModalComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  
  @Output() close = new EventEmitter<void>();

  currentStep: number = 0;
  steps: TutorialStep[] = [];
  totalSteps: number = 0;
  highlightedElement: HTMLElement | null = null;
  tooltipPosition: { top: string; left: string; transform: string } = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  showSpotlight: boolean = false;
  spotlightStyle: any = {};
  arrowStyle: any = {}; // Position for the pointer arrow
  
  // For detecting user actions
  private clickListener: ((e: Event) => void) | null = null;
  private isAdvancing: boolean = false; // Prevent double-advancing
  
  // For dynamic repositioning
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private windowResizeListener: (() => void) | null = null;
  private scrollListener: (() => void) | null = null;
  private currentPlacement: string = 'bottom'; // Store current placement

  constructor(
    private tutorialService: TutorialService,
    private gameTutorialService: GameTutorialService,
    private router: Router
  ) {
    this.steps = this.tutorialService.steps;
    this.totalSteps = this.tutorialService.getTotalSteps();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Listen for route changes
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe((event) => {
          // Check if this navigation completes the current step
          // This will automatically call setupCurrentStep for the next step if needed
          this.checkStepCompletion();
          
          // If checkStepCompletion didn't advance (e.g., we're just refreshing or on wrong page),
          // update the UI for current step
          if (!this.isAdvancing) {
            setTimeout(() => this.setupCurrentStep(), 100);
          }
        });

      // Initial setup for first step
      setTimeout(() => this.setupCurrentStep(), 100);
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.cleanupRepositioning(); // Clean up observers when component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentStepData(): TutorialStep {
    return this.steps[this.currentStep];
  }

  get progress(): number {
    return ((this.currentStep + 1) / this.totalSteps) * 100;
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.totalSteps - 1;
  }

  setupCurrentStep(): void {
    if (!this.isBrowser) return;

    this.cleanup();
    
    const step = this.currentStepData;
    
    // Look ahead to check if future steps are already completed
    // If a future step is completed, skip current and intermediate steps
    const stepsToSkip = this.checkAheadForCompletedSteps();
    if (stepsToSkip > 0) {
      this.isAdvancing = false;
      (this as any)._nextStepTimeout = null;
      // Skip multiple steps at once
      this.currentStep += stepsToSkip;
      if (this.currentStep >= this.totalSteps) {
        this.completeTutorial();
        return;
      }
      this.cdr.detectChanges();
      setTimeout(() => {
        this.setupCurrentStep();
      }, 100);
      return;
    }
    
    // Check if current step is already completed, skip it
    // But NEVER skip if it's an input step (user must see the feedback)
    const isCurrentCompleted = this.isStepCompleted(step);
    if (isCurrentCompleted && step.actionType !== 'input') {
      this.isAdvancing = false;
      (this as any)._nextStepTimeout = null;
      setTimeout(() => {
        this.nextStep();
      }, 100);
      return;
    }
    
    // Check if we're on the right route
    if (step.route && !this.router.url.includes(step.route)) {
      // Not on the right page yet - show centered tooltip with navigation instruction
      this.showSpotlight = false;
      this.highlightedElement = null;
      this.centerTooltip();
      this.cdr.detectChanges(); // Force update
      
      // If we need to highlight an element for navigation, try to find it
      if (step.targetSelector && step.actionType === 'navigate') {
        setTimeout(() => {
          const element = this.findElement(step.targetSelector!);
          if (element) {
            this.highlightedElement = element;
            this.showSpotlight = true;
            this.updateSpotlight(element);
            this.positionTooltip(element, step.placement || 'bottom');
            
            // Set up dynamic repositioning for navigation elements too
            this.setupDynamicRepositioning(element, step.placement || 'bottom');
            
            this.cdr.detectChanges(); // Force update after finding element
          }
        }, 300);
      }
      return;
    }
    
    // If this is a navigation step and we're already on the page, auto-advance
    if (step.actionType === 'navigate' && step.route && this.router.url.includes(step.route)) {
      // Reset isAdvancing flag and clear debounce timeout to ensure we can advance
      this.isAdvancing = false;
      (this as any)._nextStepTimeout = null;
      setTimeout(() => {
        this.nextStep();
      }, 300);
      return;
    }
    
    if (step.targetSelector && step.placement !== 'center') {
      // Find the target element
      setTimeout(() => {
        const element = this.findElement(step.targetSelector!);
        
        // If element not found by findElement, check if it exists anywhere on the page
        if (!element) {
          // Try basic querySelector to see if element exists at all
          const basicElement = document.querySelector(step.targetSelector!) as HTMLElement;
          
          // Check if element is in a modal or interactive context - if so, don't do visibility checks
          if (basicElement && this.gameTutorialService.isInModalContext(basicElement, step.targetSelector)) {
            this.showSpotlight = false;
            this.centerTooltip();
            
            // For completion check, use goalSelector if it exists (for input actions)
            let elementToCheck = basicElement;
            if (step.actionType === 'input' && step.goalSelector) {
              const goalElement = document.querySelector(step.goalSelector) as HTMLElement;
              if (goalElement) {
                elementToCheck = goalElement;
              }
            }
            
            // Still set up event listeners if needed
            if (this.isActionCompleted(step, elementToCheck)) {
              this.isAdvancing = false;
              (this as any)._nextStepTimeout = null;
              setTimeout(() => {
                this.nextStep();
              }, 300);
              return;
            }
            
            // Determine the element to attach event listeners to
            const goalElement = step.goalSelector 
              ? this.findElement(step.goalSelector) || document.querySelector(step.goalSelector) as HTMLElement || basicElement
              : basicElement;
            
            if (step.waitForAction && step.actionType === 'input') {
              this.setupInputListener(goalElement);
            }
            
            this.cdr.detectChanges();
            return;
          }
          
          if (basicElement) {
            // Check if element is reasonably visible (at least 50% in viewport)
            const rect = basicElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            
            // Calculate how much of the element is visible
            const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
            const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
            const elementArea = rect.width * rect.height;
            const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
            const visibilityRatio = elementArea > 0 ? visibleArea / elementArea : 0;
            
            // If element is at least 50% visible, use it without scroll step
            if (visibilityRatio >= 0.5) {
              // Use the basicElement even though findElement couldn't find it
              setTimeout(() => {
                this.highlightedElement = basicElement;
                this.showSpotlight = true;
                this.updateSpotlight(basicElement);
                this.positionTooltip(basicElement, step.placement || 'bottom');
                this.setupDynamicRepositioning(basicElement, step.placement || 'bottom');
                
                if (this.isActionCompleted(step, basicElement)) {
                  this.isAdvancing = false;
                  (this as any)._nextStepTimeout = null;
                  setTimeout(() => {
                    this.nextStep();
                  }, 300);
                  return;
                }
                
                // Add click listener if needed
                if (step.waitForAction && step.actionType === 'click') {
                  this.setupClickListener(basicElement);
                }
                
                // Add hover listener if needed
                if (step.waitForAction && step.actionType === 'hover') {
                  this.setupHoverListener(basicElement);
                }
                
                // Add input listener if needed
                if (step.waitForAction && step.actionType === 'input') {
                  this.setupInputListener(basicElement);
                }
                
                // Add scroll listener if needed
                if (step.waitForAction && step.actionType === 'scroll') {
                  this.setupScrollListener(basicElement);
                }
                
                this.cdr.detectChanges();
              }, 200);
              return;
            }
            
            // Element exists but is less than 50% visible - check if we should insert scroll step
            // Don't insert scroll steps for elements that will appear through interaction
            // (e.g., items in a modal that opens when you click a pattern slot)
            if (this.gameTutorialService.isInModalContext(basicElement, step.targetSelector)) {
              // Just center the tooltip and wait for user interaction
              this.showSpotlight = false;
              this.centerTooltip();
              this.cdr.detectChanges();
              return;
            }
            
            // Check if we've already inserted a scroll step for this selector
            const alreadyHasScrollStep = this.currentStep > 0 && 
                                        this.steps[this.currentStep - 1]?.actionType === 'scroll' &&
                                        this.steps[this.currentStep - 1]?.targetSelector === step.targetSelector;
            
            if (alreadyHasScrollStep) {
              // Just setup the scroll listener without inserting
              this.setupScrollListener(basicElement);
              this.showSpotlight = false;
              this.centerTooltip();
              this.cdr.detectChanges();
              return;
            }
            
            const scrollStep: TutorialStep = {
              title: 'Scroll to Continue',
              content: `Scroll down to find the highlighted element on the page.`,
              targetSelector: step.targetSelector,
              placement: step.placement,
              route: step.route,
              waitForAction: true,
              actionType: 'scroll'
            };
            
            // Insert the scroll step before the current step
            this.steps.splice(this.currentStep, 0, scrollStep);
            this.totalSteps = this.steps.length;
            
            // Setup the scroll listener for the newly inserted step
            this.setupScrollListener(basicElement);
            this.showSpotlight = false;
            this.centerTooltip();
            this.cdr.detectChanges();
            return;
          } else {
            // Element not found at all, center the tooltip
            this.centerTooltip();
            this.cdr.detectChanges();
            return;
          }
        }
        
        if (element) {
          // Element is in viewport, proceed normally
          // Wait for scroll to complete before highlighting
          setTimeout(() => {
            this.highlightedElement = element;
            this.showSpotlight = true;
            this.updateSpotlight(element);
            this.positionTooltip(element, step.placement || 'bottom');
            
            // Set up dynamic repositioning
            this.setupDynamicRepositioning(element, step.placement || 'bottom');
            
            // Check if action has already been completed before setting up listeners
            if (this.isActionCompleted(step, element)) {
              this.isAdvancing = false;
              (this as any)._nextStepTimeout = null;
              setTimeout(() => {
                this.nextStep();
              }, 300);
              return;
            }
            
            // Determine the element to attach event listeners to
            // Use goalSelector if provided, otherwise fall back to targetSelector
            const goalElement = step.goalSelector 
              ? this.findElement(step.goalSelector) || element
              : element;
            
            // Add click listener if needed
            if (step.waitForAction && step.actionType === 'click') {
              this.setupClickListener(goalElement);
            }
            
            // Add hover listener if needed (for sidebar or element hover detection)
            if (step.waitForAction && step.actionType === 'hover') {
              this.setupHoverListener(goalElement);
            }
            
            // Add input listener if needed
            if (step.waitForAction && step.actionType === 'input') {
              this.setupInputListener(goalElement);
            }
            
            // Add scroll listener if needed
            if (step.waitForAction && step.actionType === 'scroll') {
              this.setupScrollListener(goalElement);
            }
            
            this.cdr.detectChanges(); // Force update after setting up
          }, 200);
        }
      }, 300);
    } else {
      // Center placement - no spotlight, just centered tooltip with dark overlay
      this.showSpotlight = false;
      this.centerTooltip();
      this.cdr.detectChanges(); // Force update
    }
  }

  findElement(selector: string): HTMLElement | null {
    // Handle :has-text() pseudo-selector
    if (selector.includes(':has-text(')) {
      const match = selector.match(/^(.+):has-text\("([^"]+)"\)$/);
      if (match) {
        const [, baseSelector, text] = match;
        const elements = document.querySelectorAll(baseSelector);
        
        let topmost: HTMLElement | null = null;
        let topmostZ = -Infinity;
        
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          if (el.textContent?.includes(text)) {
            // Check if element is visible and not hidden behind other elements
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (isVisible) {
              // Check what element is actually at this position (considering z-index)
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const elementAtPoint = document.elementFromPoint(centerX, centerY);
              
              // Check if this element or one of its children is at the point
              const isAccessible = el === elementAtPoint || el.contains(elementAtPoint);
              
              if (isAccessible) {
                // Get computed z-index and position in stacking context
                const zIndex = this.getEffectiveZIndex(el);
                
                if (zIndex > topmostZ) {
                  topmost = el;
                  topmostZ = zIndex;
                }
              }
            }
          }
        }
        
        if (topmost) {
          return topmost;
        }
      }
      return null;
    }
    
    // Try multiple selectors separated by comma
    const selectors = selector.split(',').map(s => s.trim());

    let topmost: HTMLElement | null = null;
    let topmostZ = -Infinity;

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;

        // Ignore elements inside the tutorial tooltip itself
        let parent = element.parentElement;
        let isInTutorialTooltip = false;
        while (parent) {
          if (parent.classList.contains('tutorial-tooltip')) {
            isInTutorialTooltip = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (isInTutorialTooltip) {
          continue;
        }

        // Check if element is visible
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        if (isVisible) {
          // Check what element is actually at this position (considering z-index and overlays)
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const elementAtPoint = document.elementFromPoint(centerX, centerY);

          // Check if this element or one of its children is at the point
          let isAccessible = element === elementAtPoint || element.contains(elementAtPoint);

          // If the element at the point is a parent of the candidate element (except .tutorial-tooltip), treat as accessible
          if (!isAccessible && elementAtPoint) {
            let ancestor: HTMLElement | null = element.parentElement;
            while (ancestor) {
              if (ancestor === elementAtPoint) {
                if (!ancestor.classList.contains('tutorial-tooltip')) {
                  isAccessible = true;
                }
                break;
              }
              ancestor = ancestor.parentElement;
            }

            // Also allow if elementAtPoint is a parent or sibling DIV (except .tutorial-tooltip)
            if (!isAccessible && elementAtPoint.nodeName === 'DIV' && elementAtPoint.classList &&
                !elementAtPoint.classList.contains('tutorial-tooltip')) {
              isAccessible = true;
            }
          }

          if (isAccessible) {
            // Get computed z-index and position in stacking context
            const zIndex = this.getEffectiveZIndex(element);

            if (zIndex > topmostZ) {
              topmost = element;
              topmostZ = zIndex;
            }
          }
        }
      }
    }

    if (topmost) {
      return topmost;
    }

    return null;
  }
  
  getEffectiveZIndex(element: HTMLElement): number {
    let zIndex = 0;
    let current: HTMLElement | null = element;
    
    while (current) {
      const style = window.getComputedStyle(current);
      const z = parseInt(style.zIndex, 10);
      
      if (!isNaN(z)) {
        zIndex += z;
      }
      
      // Check if element is in a modal or overlay
      if (current.classList.contains('modal') || 
          current.classList.contains('modal-content') ||
          current.classList.contains('modal-overlay')) {
        zIndex += 10000; // Modals are typically high z-index
      }
      
      current = current.parentElement;
    }
    
    return zIndex;
  }

  updateSpotlight(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const padding = 8;
    
    this.spotlightStyle = {
      top: `${rect.top + window.scrollY - padding}px`,
      left: `${rect.left + window.scrollX - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`
    };
    
    // Position arrow to point at the center of the highlighted element
    this.updateArrowPosition(element);
  }
  
  updateArrowPosition(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const arrowSize = 40; // Size of the arrow SVG
    
    // Position arrow above and centered on the element
    this.arrowStyle = {
      top: `${rect.top + window.scrollY - arrowSize - 10}px`,
      left: `${rect.left + window.scrollX + (rect.width / 2) - (arrowSize / 2)}px`
    };
  }

  positionTooltip(element: HTMLElement, placement: string): void {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 480;
    const tooltipMaxHeight = 400;
    const gap = 20;
    const padding = 20; // Padding from viewport edges

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let transform = '';

    switch (placement) {
      case 'center':
        // Always center in viewport for 'center' placement
        top = window.scrollY + window.innerHeight / 2;
        left = window.scrollX + window.innerWidth / 2;
        transform = 'translate(-50%, -50%)';
        break;
      case 'top':
        top = rect.top + window.scrollY - tooltipMaxHeight - gap;
        left = rect.left + window.scrollX + rect.width / 2;
        transform = 'translateX(-50%)';
        if (top < window.scrollY + padding) {
          top = rect.bottom + window.scrollY + gap;
        }
        break;
      case 'bottom':
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + window.scrollX + rect.width / 2;
        transform = 'translateX(-50%)';
        if (top + tooltipMaxHeight > window.scrollY + viewportHeight - padding) {
          top = rect.top + window.scrollY - tooltipMaxHeight - gap;
        }
        break;
      case 'left':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - tooltipWidth - gap;
        transform = 'translateY(-50%)';
        if (left < window.scrollX + padding) {
          left = rect.right + window.scrollX + gap;
        }
        break;
      case 'right':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX + gap;
        transform = 'translateY(-50%)';
        if (left + tooltipWidth > window.scrollX + viewportWidth - padding) {
          left = rect.left + window.scrollX - tooltipWidth - gap;
          if (left < window.scrollX + padding) {
            left = window.scrollX + viewportWidth / 2;
            transform = 'translate(-50%, -50%)';
          }
        }
        const tooltipTop = top - tooltipMaxHeight / 2;
        if (tooltipTop < window.scrollY + padding) {
          top = window.scrollY + tooltipMaxHeight / 2 + padding;
        } else if (tooltipTop + tooltipMaxHeight > window.scrollY + viewportHeight - padding) {
          top = window.scrollY + viewportHeight - tooltipMaxHeight / 2 - padding;
        }
        break;
    }

    // Final boundary checks for horizontal position (unchanged for non-center)
    if (placement !== 'center' && transform.includes('translateX(-50%)')) {
      const tooltipLeft = left - tooltipWidth / 2;
      if (tooltipLeft < window.scrollX + padding) {
        left = window.scrollX + tooltipWidth / 2 + padding;
      } else if (tooltipLeft + tooltipWidth > window.scrollX + viewportWidth - padding) {
        left = window.scrollX + viewportWidth - tooltipWidth / 2 - padding;
      }
    }

    this.tooltipPosition = {
      top: `${top}px`,
      left: `${left}px`,
      transform
    };
  }

  centerTooltip(): void {
    this.showSpotlight = false;
    this.tooltipPosition = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  setupScrollListener(element: HTMLElement): void {
    this.cleanup();
    
    const checkElementInView = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      
      // Element must be fully visible within viewport
      const isInViewport = (
        rect.top >= 0 &&
        rect.bottom <= viewportHeight &&
        rect.left >= 0 &&
        rect.right <= viewportWidth
      );
      
      if (isInViewport && !this.isAdvancing) {
        this.isAdvancing = true;
        window.removeEventListener('scroll', checkElementInView, true);
        setTimeout(() => {
          this.nextStep();
          this.isAdvancing = false;
        }, 300);
      }
    };
    
    // Listen for scroll events on window and all scrollable containers
    window.addEventListener('scroll', checkElementInView, true);
  }

  setupClickListener(element: HTMLElement): void {
    // Clean up any existing listener first
    this.cleanup();
    
    const currentStepIndex = this.currentStep; // Capture current step
    const clickListener = (e: Event) => {
      // Ignore if we've moved to a different step
      if (this.currentStep !== currentStepIndex) {
        document.removeEventListener('click', clickListener, true);
        return;
      }
      
      const clickedElement = e.target === element || element.contains(e.target as Node);
      
      // Check if user clicked the highlighted element OR if the goal is now achieved
      if (clickedElement) {
        if (!this.isAdvancing) {
          this.isAdvancing = true;
          setTimeout(() => {
            this.nextStep();
            this.isAdvancing = false;
          }, 500);
        }
      }
    };
    
    this.clickListener = clickListener;
    document.addEventListener('click', clickListener, true);
  }
  
  setupHoverListener(element?: HTMLElement): void {
    // Clean up any existing listener first
    this.cleanup();

    // If no element provided, fallback to sidebar expansion logic
    if (!element) {
      const checkInterval = setInterval(() => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('sidebar-collapsed')) {
          clearInterval(checkInterval);
          if (!this.isAdvancing) {
            this.isAdvancing = true;
            setTimeout(() => {
              this.nextStep();
              this.isAdvancing = false;
            }, 500);
          }
        }
      }, 100);
      (this as any).hoverCheckInterval = checkInterval;
      return;
    }

    // Otherwise, listen for mouseover on the highlighted element
    const currentStepIndex = this.currentStep; // Capture current step
    const hoverListener = (e: Event) => {
      // Ignore if we've moved to a different step
      if (this.currentStep !== currentStepIndex) {
        element.removeEventListener('mouseover', hoverListener);
        return;
      }
      
      if (!this.isAdvancing) {
        this.isAdvancing = true;
        setTimeout(() => {
          this.nextStep();
          this.isAdvancing = false;
        }, 500);
      }
      element.removeEventListener('mouseover', hoverListener);
    };
    element.addEventListener('mouseover', hoverListener);
    // Store for cleanup
    (this as any).hoverListener = hoverListener;
    (this as any).hoverElement = element;
  }
  
  setupInputListener(element: HTMLElement): void {
    // Clean up any existing listener first
    this.cleanup();

    // Special handling for .drop-zone file input
    if (element.classList.contains('drop-zone')) {
      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const fileListener = (e: Event) => {
          if (fileInput.files && fileInput.files.length > 0) {
            if (!this.isAdvancing) {
              this.isAdvancing = true;
              setTimeout(() => {
                this.nextStep();
                this.isAdvancing = false;
              }, 800);
            }
            fileInput.removeEventListener('change', fileListener);
          }
        };
        fileInput.addEventListener('change', fileListener);
        // Store for cleanup
        (this as any).inputListener = fileListener;
        (this as any).inputElement = fileInput;
        return;
      }
    }

    // Default: text input or custom input events
    const currentStepIndex = this.currentStep; // Capture current step
    const inputListener = (e: Event) => {
      // Ignore if we've moved to a different step
      if (this.currentStep !== currentStepIndex) {
        element.removeEventListener('input', inputListener);
        return;
      }
      
      const target = e.target as HTMLElement;
      
      // Check if it's a real input element with a value
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        // For actual input elements, check if input has meaningful value (at least 2 characters)
        if (target.value && target.value.trim().length >= 2) {
          if (!this.isAdvancing) {
            this.isAdvancing = true;
            setTimeout(() => {
              this.nextStep();
              this.isAdvancing = false;
            }, 800); // Give user time to see what they typed
          }
          // Remove listener after detection
          element.removeEventListener('input', inputListener);
        }
      } else {
        // For other elements (like pattern slots), any input event is valid
        if (!this.isAdvancing) {
          this.isAdvancing = true;
          setTimeout(() => {
            this.nextStep();
            this.isAdvancing = false;
          }, 500);
        }
        // Remove listener after detection
        element.removeEventListener('input', inputListener);
      }
    };
    element.addEventListener('input', inputListener);
    // Store for cleanup
    (this as any).inputListener = inputListener;
    (this as any).inputElement = element;
  }

  checkStepCompletion(): void {
    if (this.isAdvancing) {
      return; // Already advancing, skip
    }
    
    const step = this.currentStepData;
    
    if (step.waitForAction && step.actionType === 'navigate') {
      if (step.route && this.router.url.includes(step.route)) {
        // User navigated to the correct page
        this.isAdvancing = true;
        setTimeout(() => {
          this.nextStep();
          this.isAdvancing = false;
        }, 800);
      }
    }
  }

  nextStep(): void {
    // Debounce: prevent advancing again within 500ms
    if ((this as any)._nextStepTimeout) {
      return;
    }
    (this as any)._nextStepTimeout = setTimeout(() => {
      (this as any)._nextStepTimeout = null;
    }, 500);

    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.cdr.detectChanges(); // Force update before setup
      this.setupCurrentStep();
    } else {
      this.completeTutorial();
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.cdr.detectChanges(); // Force update before setup
      this.setupCurrentStep();
    }
  }

  skipTutorial(): void {
    this.tutorialService.completeTutorial();
    this.close.emit();
  }

  completeTutorial(): void {
    this.tutorialService.completeTutorial();
    this.close.emit();
  }

  onActionClick(): void {
    const step = this.currentStepData;
    
    if (step.route && step.actionType === 'navigate') {
      // Navigate to the specified route
      this.router.navigate([step.route]);
    } else if (!step.waitForAction) {
      // Just move to next step
      this.nextStep();
    }
  }

  /**
   * Get the action button text based on the step's actionType
   */
  getActionText(step: TutorialStep): string {
    // If action is explicitly set, use it
    if (step.action) {
      return step.action;
    }

    // Generate action text based on actionType
    if (step.waitForAction) {
      switch (step.actionType) {
        case 'click':
          return 'Waiting for click...';
        case 'navigate':
          return 'Waiting for navigation...';
        case 'input':
          return 'Waiting for input...';
        case 'hover':
          return 'Waiting for hover...';
        case 'scroll':
          return 'Waiting for scroll...';
        default:
          return 'Continue';
      }
    }

    return step.action || 'Continue';
  }

  /**
   * Check if a step has already been completed
   */
  isStepCompleted(step: TutorialStep): boolean {
    // Check if we need to be on a specific route
    if (step.route && !this.router.url.includes(step.route)) {
      // If actionType is navigate and we're already on the page, it's completed
      if (step.actionType === 'navigate') {
        return false; // We'll handle this separately in setupCurrentStep
      }
      return false; // Not on the right page, not completed
    }

    // For navigate actions, check if already on target page
    if (step.actionType === 'navigate' && step.route && this.router.url.includes(step.route)) {
      return true;
    }

    // Determine which selector to use for completion check
    // For most actions, check the targetSelector (what's being highlighted)
    // But for input actions, use goalSelector if it exists (what receives the input)
    const selectorToCheck = (step.actionType === 'input' && step.goalSelector && step.goalSelector !== step.targetSelector) 
      ? step.goalSelector 
      : step.targetSelector;

    // Find the element if there's a selector
    if (selectorToCheck) {
      // First try findElement (handles custom selectors like :has-text())
      let element = this.findElement(selectorToCheck);
      
      // If findElement didn't find it and selector doesn't have custom pseudo-selectors, try basic querySelector
      if (!element && !selectorToCheck.includes(':has-text(')) {
        try {
          element = document.querySelector(selectorToCheck) as HTMLElement;
        } catch (e) {
          return false;
        }
      }
      
      if (element) {
        return this.isActionCompleted(step, element);
      } else {
        // Element not found - for input steps, this means not complete
        if (step.actionType === 'input') {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Look ahead at the next 2 steps to see if any are already completed.
   * Only skips if ALL intermediate steps are also completed.
   * Returns the number of steps to skip (0 if none should be skipped)
   * 
   * IMPORTANT: Never skip if current step or any intermediate step is an input action
   * Input steps require user feedback and should always be shown
   */
  checkAheadForCompletedSteps(): number {
    const currentStep = this.steps[this.currentStep];
    
    // NEVER look ahead if current step is an input action
    // Input steps must always be shown for user feedback
    if (currentStep.actionType === 'input') {
      return 0;
    }
    
    const lookAheadSteps = 2;
    
    for (let i = 1; i <= lookAheadSteps; i++) {
      const futureStepIndex = this.currentStep + i;
      if (futureStepIndex >= this.totalSteps) {
        break; // No more steps to check
      }
      
      const futureStep = this.steps[futureStepIndex];
      
      // Check if this future step is completed
      const isFutureStepCompleted = 
        (futureStep.actionType === 'navigate' && futureStep.route && this.router.url.includes(futureStep.route)) ||
        this.isStepCompleted(futureStep);
      
      if (isFutureStepCompleted) {
        // Check if ALL intermediate steps (between current and future, exclusive) are also completed
        // IMPORTANT: Never skip through input steps - they must be shown to user
        let allIntermediateCompleted = true;
        let hasInputStep = false;
        
        // Only check steps strictly between current and future (not including current or future)
        for (let j = this.currentStep + 1; j < futureStepIndex; j++) {
          const intermediateStep = this.steps[j];
          
          // Check if intermediate step is an input action
          if (intermediateStep.actionType === 'input') {
            hasInputStep = true;
            allIntermediateCompleted = false;
            break;
          }
          
          if (!this.isStepCompleted(intermediateStep)) {
            allIntermediateCompleted = false;
            break;
          }
        }
        
        // Only skip if all intermediate steps are completed AND no input steps in between
        if (allIntermediateCompleted && !hasInputStep) {
          return i;
        }
      }
    }
    
    return 0; // No future steps are completed with all intermediates complete
  }

  /**
   * Check if an action for a specific element has been completed
   */
  isActionCompleted(step: TutorialStep, element: HTMLElement): boolean {
    if (!step.waitForAction) {
      return false;
    }

    // Check game-specific action completion first
    const gameSpecificResult = this.gameTutorialService.checkGameSpecificActionCompletion(
      this.tutorialService.currentGameId,
      step, 
      element, 
      this.steps
    );
    
    if (gameSpecificResult !== null) {
      return gameSpecificResult;
    }

    // Fall back to generic action checks
    switch (step.actionType) {
      case 'input':
        // Generic input element check
        const inputElement = element as HTMLInputElement;
        return !!(inputElement.value && inputElement.value.trim().length >= 2);

      case 'hover':
        if (step.targetSelector === '#toggleSidebar') {
          const sidebar = document.querySelector('.sidebar');
          return !!(sidebar && !sidebar.classList.contains('sidebar-collapsed'));
        }
        return false;

      case 'navigate':
        return !!(step.route && this.router.url.includes(step.route));

      default:
        return false;
    }
  }
  
  setupDynamicRepositioning(element: HTMLElement, placement: string): void {
    if (!this.isBrowser) return;
    
    // Store the current placement
    this.currentPlacement = placement;
    
    // If observers don't exist yet, create them
    // Otherwise, just update the placement - observers will keep working
    const needsSetup = !this.windowResizeListener || !this.resizeObserver || !this.mutationObserver;
    
    if (!needsSetup) {
      return;
    }
    
    
    const updatePositions = () => {
      if (this.highlightedElement) {
        this.updateSpotlight(this.highlightedElement);
        this.positionTooltip(this.highlightedElement, this.currentPlacement);
        this.cdr.detectChanges();
      }
    };
    
    // Watch for window resize
    this.windowResizeListener = () => {
      updatePositions();
    };
    window.addEventListener('resize', this.windowResizeListener);
    
    // Watch for scroll events
    this.scrollListener = () => {
      updatePositions();
    };
    window.addEventListener('scroll', this.scrollListener, true); // Use capture to catch all scrolls
    
    // Watch for element size changes (e.g., sidebar expanding/collapsing, modals opening)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        updatePositions();
      });
      
      // Observe the highlighted element itself
      this.resizeObserver.observe(element);
      
      // Observe the sidebar since it affects layout
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        this.resizeObserver.observe(sidebar);
      }
      
      // Observe any modal containers
      const modal = element.closest('.modal, .modal-content, .modal-overlay');
      if (modal) {
        this.resizeObserver.observe(modal as HTMLElement);
      }
      
      // Observe parent containers that might affect positioning
      let parent = element.parentElement;
      let depth = 0;
      while (parent && depth < 5) { // Check up to 5 levels up
        this.resizeObserver.observe(parent);
        parent = parent.parentElement;
        depth++;
      }
    }
    
    // Watch for DOM changes that might affect positioning
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver((mutations) => {
        // Check if any mutation affects visibility or position
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLElement;
            // Update if class or style changed
            if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
              shouldUpdate = true;
              break;
            }
          } else if (mutation.type === 'childList') {
            // Update if children were added/removed (e.g., modal opening)
            shouldUpdate = true;
            break;
          }
        }
        
        if (shouldUpdate) {
          // Small delay to let animations complete
          setTimeout(() => updatePositions(), 100);
        }
      });
      
      // Observe the sidebar for class changes (collapsed/expanded)
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        this.mutationObserver.observe(sidebar, {
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      }
      
      // Observe body for general layout changes (modals, overlays, etc.)
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      
      // Observe the element's parent for changes
      if (element.parentElement) {
        this.mutationObserver.observe(element.parentElement, {
          childList: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      }
    }
  }
  
  cleanupRepositioning(): void {
    if (this.windowResizeListener) {
      window.removeEventListener('resize', this.windowResizeListener);
      this.windowResizeListener = null;
    }
    
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  private cleanup(): void {
    // Clean up action listeners only (NOT repositioning observers)
    // Repositioning observers should stay active throughout the tutorial
    
    // Remove tutorial-active class from previously highlighted element
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('tutorial-active');
    }
    
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
      this.clickListener = null;
    }
    
    // Clear hover check interval if it exists
    if ((this as any).hoverCheckInterval) {
      clearInterval((this as any).hoverCheckInterval);
      (this as any).hoverCheckInterval = null;
    }
    // Remove hover listener if it exists
    if ((this as any).hoverListener && (this as any).hoverElement) {
      (this as any).hoverElement.removeEventListener('mouseover', (this as any).hoverListener);
      (this as any).hoverListener = null;
      (this as any).hoverElement = null;
    }
    
    // Clear input listener if it exists
    if ((this as any).inputListener && (this as any).inputElement) {
      (this as any).inputElement.removeEventListener('input', (this as any).inputListener);
      (this as any).inputListener = null;
      (this as any).inputElement = null;
    }
  }
}
