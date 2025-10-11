import { Component, HostBinding, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { SettingsService } from '../../Services/settings.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'side-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit, OnDestroy {
  isCollapsed = true; // Tracks sidebar state
  isAtTop = true; // Tracks if page is scrolled to top
  companyLogo$: Observable<string>;
  companyLogoSmall$: Observable<string>;
  private routerSubscription?: Subscription;
  private hoverTimeout?: number;

  @HostBinding('class.sidebar-collapsed')
  get collapsed() {
    return this.isCollapsed;
  }

  @HostBinding('class.at-top')
  get atTop() {
    return this.isAtTop;
  }

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.companyLogo$ = this.settingsService.settings$.pipe(
      map(settings => settings.companyLogo)
    );
    this.companyLogoSmall$ = this.settingsService.settings$.pipe(
      map(settings => settings.companyLogoSmall)
    );
  }

  ngOnInit() {
    // Close sidebar on navigation (mobile)
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobile()) {
        this.isCollapsed = true;
      }
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.clearHoverTimeout();
  }

  // Listen for window resize to close sidebar on mobile
  @HostListener('window:resize')
  onResize() {
    if (this.isMobile() && !this.isCollapsed) {
      this.isCollapsed = true;
    }
  }

  onSidebarMouseEnter() {
    this.clearHoverTimeout();
    if (this.isCollapsed) {
      this.isCollapsed = false;
    }
  }

  onSidebarMouseLeave() {
    this.clearHoverTimeout();
    // Add a small delay before collapsing to prevent accidental collapse
    this.hoverTimeout = window.setTimeout(() => {
      if (!this.isMobile()) {
        this.isCollapsed = true;
      }
    }, 300);
  }

  onToggleClick() {
    // On mobile, clicking toggles the sidebar
    if (this.isMobile()) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  private clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = undefined;
    }
  }

  private isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth <= 480;
    }
    return false;
  }
}
