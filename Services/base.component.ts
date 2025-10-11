import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base component class that provides automatic subscription cleanup
 * Components can extend this to get the destroy$ Subject automatically
 * 
 * Usage:
 * ```typescript
 * export class MyComponent extends BaseComponent implements OnInit {
 *   ngOnInit() {
 *     this.someService.data$
 *       .pipe(takeUntil(this.destroy$))
 *       .subscribe(data => {...});
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
