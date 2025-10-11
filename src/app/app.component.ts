import { Component } from '@angular/core';
import { SideBarComponent } from '../../Components/side-bar/side-bar.component'
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../Services/theme.service';
import { SettingsService } from '../../Services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SideBarComponent,
    RouterOutlet
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  pageTitle: string = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService,
    private settingsService: SettingsService
  ) {
    // Initialize theme on app startup
    const currentTheme = this.settingsService.getSettings().colorTheme;
    this.themeService.applyTheme(currentTheme);

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
  }
}
