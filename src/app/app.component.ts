import { Component } from '@angular/core';
import { SideBarComponent } from '../../Components/side-bar/side-bar.component'
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../Services/theme.service';
import { SettingsService } from '../../Services/settings.service';
import { TutorialService } from '../../Services/tutorial.service';
import { GamesService } from '../../Services/games.service';
import { TutorialModalComponent } from '../../Components/tutorial-modal/tutorial-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SideBarComponent,
    RouterOutlet,
    TutorialModalComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  pageTitle: string = '';
  showTutorial: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private tutorialService: TutorialService,
    private gamesService: GamesService
  ) {
    // Initialize theme on app startup
    const settings = this.settingsService.getSettings();
    if (settings.colorTheme === 'custom' && settings.customGradientColors && settings.customGradientColors.length > 0) {
      // For now, apply custom gradient only. In future, load full custom theme data
      this.themeService.applyCustomTheme({
        gradientColors: settings.customGradientColors,
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        textPrimaryColor: '#1e293b',
        textSecondaryColor: '#64748b',
        cardBackgroundColor: '#ffffff',
        borderColor: '#e5e7eb'
      });
    } else {
      this.themeService.applyTheme(settings.colorTheme);
    }

    // Subscribe to tutorial modal visibility
    this.tutorialService.showModal$.subscribe(show => {
      this.showTutorial = show;
    });

    // Subscribe to router events to get the current route's title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      map(route => route.snapshot.data['title'] || route.snapshot.title || '')
    ).subscribe(title => {
      this.pageTitle = title;
    });
  }

  ngOnInit() {
    // Set initial title
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle = route.snapshot.data['title'] || route.snapshot.title || '';

    // Show tutorial if not completed AND we're on a game route
    if (!this.tutorialService.isTutorialCompleted()) {
      // Try to show tutorial with retry logic for slow hosts (e.g., GitHub Pages)
      this.tryShowTutorial(0);
    }
  }

  private tryShowTutorial(attempt: number): void {
    const maxAttempts = 5;
    const delay = 500 + (attempt * 300); // Progressive delay: 500ms, 800ms, 1100ms, 1400ms, 1700ms
    
    setTimeout(() => {
      const currentUrl = this.router.url;
      const game = this.gamesService.getGameByRoute(currentUrl);
      
      // Only show tutorial if we're on a game route
      if (game) {
        const loaded = this.tutorialService.loadTutorialForGame(game.id);
        if (loaded && this.tutorialService.steps.length > 0) {
          this.tutorialService.showTutorialModal();
        } else if (attempt < maxAttempts - 1) {
          // Retry if tutorial wasn't loaded successfully
          this.tryShowTutorial(attempt + 1);
        }
      } else if (attempt < maxAttempts - 1) {
        // Retry if game not found yet
        this.tryShowTutorial(attempt + 1);
      }
    }, delay);
  }

  closeTutorial() {
    this.tutorialService.hideTutorialModal();
  }
}
