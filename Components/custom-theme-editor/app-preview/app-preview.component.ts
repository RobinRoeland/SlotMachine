import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from '../../../Pages/home/home.component';
import { SideBarComponent } from '../../side-bar/side-bar.component';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, HomeComponent, SideBarComponent],
  templateUrl: './app-preview.component.html',
  styleUrl: '../../../src/app/app.component.scss' // Reuse app component styles for preview consistency
})
export class AppPreviewComponent {}
