import { Component, EventEmitter, Output, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TutorialService, TutorialStep } from '../../Services/tutorial.service';
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
    
    if (step.targetSelector && step.placement !== 'center') {
      // Find the target element
      setTimeout(() => {
        const element = this.findElement(step.targetSelector!);
        if (element) {
          this.highlightedElement = element;
          this.showSpotlight = true;
          this.updateSpotlight(element);
          this.positionTooltip(element, step.placement || 'bottom');
          
          // Set up dynamic repositioning
          this.setupDynamicRepositioning(element, step.placement || 'bottom');
          
          // Add click listener if needed
          if (step.waitForAction && step.actionType === 'click') {
            this.setupClickListener(element);
          }
          
          // Add hover listener if needed (for sidebar or element hover detection)
          if (step.waitForAction && step.actionType === 'hover') {
            this.setupHoverListener(element);
          }
          
          // Add input listener if needed
          if (step.waitForAction && step.actionType === 'input') {
            this.setupInputListener(element);
          }
          
          this.cdr.detectChanges(); // Force update after setting up
        } else {
          // Element not found, center the tooltip
          this.centerTooltip();
          this.cdr.detectChanges();
        }
      }, 300);
    } else {
      // Center placement - still show dark overlay
      // If there's a targetSelector (like 'body'), show the overlay
      if (step.targetSelector) {
        setTimeout(() => {
          const element = this.findElement(step.targetSelector!);
          if (element) {
            this.highlightedElement = element;
            this.showSpotlight = true;
            this.updateSpotlight(element);
            this.centerTooltip();
            
            // Set up dynamic repositioning even for centered tooltips
            this.setupDynamicRepositioning(element, 'center');
            
            this.cdr.detectChanges();
          } else {
            this.showSpotlight = true; // Still show overlay even if element not found
            this.centerTooltip();
            this.cdr.detectChanges();
          }
        }, 300);
      } else {
        this.showSpotlight = false;
        this.centerTooltip();
        this.cdr.detectChanges(); // Force update
      }
    }
  }

  findElement(selector: string): HTMLElement | null {
    console.log('[Tutorial] Finding element with selector:', selector);
    
    // Handle :has-text() pseudo-selector
    if (selector.includes(':has-text(')) {
      const match = selector.match(/^(.+):has-text\("([^"]+)"\)$/);
      if (match) {
        const [, baseSelector, text] = match;
        const elements = document.querySelectorAll(baseSelector);
        console.log('[Tutorial] Found', elements.length, 'elements matching base selector');
        
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
                console.log('[Tutorial] Element', i, 'is accessible with z-index:', zIndex);
                
                if (zIndex > topmostZ) {
                  topmost = el;
                  topmostZ = zIndex;
                }
              } else {
                console.log('[Tutorial] Element', i, 'is hidden behind another element');
              }
            }
          }
        }
        
        if (topmost) {
          console.log('[Tutorial] Found topmost accessible element with z-index:', topmostZ);
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
      console.log('[Tutorial] Trying selector:', sel);
      const elements = document.querySelectorAll(sel);
      console.log('[Tutorial] Found', elements.length, 'matching elements');

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
            console.log('[Tutorial] Element', i, 'is accessible at z-index:', zIndex, 'position:', rect.top);

            if (zIndex > topmostZ) {
              topmost = element;
              topmostZ = zIndex;
            }
          } else {
            console.log('[Tutorial] Element', i, 'is hidden behind:', elementAtPoint?.tagName);
          }
        } else {
          console.log('[Tutorial] Element', i, 'is not visible');
        }
      }
    }

    if (topmost) {
      console.log('[Tutorial] Returning topmost accessible element with z-index:', topmostZ);
      return topmost;
    }

    console.log('[Tutorial] No accessible element found');
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

  setupClickListener(element: HTMLElement): void {
    // Clean up any existing listener first
    this.cleanup();
    
    this.clickListener = (e: Event) => {
      if (e.target === element || element.contains(e.target as Node)) {
        // User clicked the target element
        if (!this.isAdvancing) {
          this.isAdvancing = true;
          setTimeout(() => {
            this.nextStep();
            this.isAdvancing = false;
          }, 500);
        }
      }
    };
    
    document.addEventListener('click', this.clickListener, true);
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
    const hoverListener = (e: Event) => {
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

    // Default: text input
    const inputListener = (e: Event) => {
      const input = e.target as HTMLInputElement;
      // Check if input has some meaningful value (at least 2 characters)
      if (input.value && input.value.trim().length >= 2) {
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
  
  setupDynamicRepositioning(element: HTMLElement, placement: string): void {
    if (!this.isBrowser) return;
    
    console.log('[Tutorial] Setting up dynamic repositioning for placement:', placement);
    
    // Store the current placement
    this.currentPlacement = placement;
    
    // If observers don't exist yet, create them
    // Otherwise, just update the placement - observers will keep working
    const needsSetup = !this.windowResizeListener || !this.resizeObserver || !this.mutationObserver;
    
    if (!needsSetup) {
      console.log('[Tutorial] Observers already active, just updating placement');
      return;
    }
    
    console.log('[Tutorial] Creating new observers');
    
    const updatePositions = () => {
      console.log('[Tutorial] Updating positions - element exists:', !!this.highlightedElement);
      if (this.highlightedElement) {
        this.updateSpotlight(this.highlightedElement);
        this.positionTooltip(this.highlightedElement, this.currentPlacement);
        this.cdr.detectChanges();
      }
    };
    
    // Watch for window resize
    this.windowResizeListener = () => {
      console.log('[Tutorial] Window resized, updating positions');
      updatePositions();
    };
    window.addEventListener('resize', this.windowResizeListener);
    console.log('[Tutorial] Window resize listener added');
    
    // Watch for scroll events
    this.scrollListener = () => {
      console.log('[Tutorial] Scroll detected, updating positions');
      updatePositions();
    };
    window.addEventListener('scroll', this.scrollListener, true); // Use capture to catch all scrolls
    console.log('[Tutorial] Scroll listener added');
    
    // Watch for element size changes (e.g., sidebar expanding/collapsing, modals opening)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        console.log('[Tutorial] ResizeObserver triggered, entries:', entries.length);
        updatePositions();
      });
      
      // Observe the highlighted element itself
      this.resizeObserver.observe(element);
      console.log('[Tutorial] Observing element:', element.tagName, element.className);
      
      // Observe the sidebar since it affects layout
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        this.resizeObserver.observe(sidebar);
        console.log('[Tutorial] Observing sidebar');
      }
      
      // Observe any modal containers
      const modal = element.closest('.modal, .modal-content, .modal-overlay');
      if (modal) {
        this.resizeObserver.observe(modal as HTMLElement);
        console.log('[Tutorial] Observing modal container');
      }
      
      // Observe parent containers that might affect positioning
      let parent = element.parentElement;
      let depth = 0;
      while (parent && depth < 5) { // Check up to 5 levels up
        this.resizeObserver.observe(parent);
        parent = parent.parentElement;
        depth++;
      }
      console.log('[Tutorial] Observing', depth, 'parent containers');
    } else {
      console.log('[Tutorial] ResizeObserver not available');
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
          console.log('[Tutorial] MutationObserver detected change, updating positions');
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
        console.log('[Tutorial] MutationObserver watching sidebar');
      }
      
      // Observe body for general layout changes (modals, overlays, etc.)
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      console.log('[Tutorial] MutationObserver watching body');
      
      // Observe the element's parent for changes
      if (element.parentElement) {
        this.mutationObserver.observe(element.parentElement, {
          childList: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
        console.log('[Tutorial] MutationObserver watching element parent');
      }
    } else {
      console.log('[Tutorial] MutationObserver not available');
    }
    
    console.log('[Tutorial] Dynamic repositioning setup complete');
  }
  
  cleanupRepositioning(): void {
    console.log('[Tutorial] Cleaning up repositioning observers');
    
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
