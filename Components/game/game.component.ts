import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotMachineComponent } from '../slot-machine/slot-machine/slot-machine.component';
import { PrizesSidebarComponent } from '../prizes/prizes-sidebar/prizes-sidebar.component';
import { ArduinoControlComponent } from '../arduino-control/arduino-control.component';
import { SettingsService } from '../../Services/settings.service';
import { GamesService } from '../../Services/games.service';

@Component({
  selector: 'game',
  standalone: true,
  imports: [
    SlotMachineComponent,
    PrizesSidebarComponent,
    ArduinoControlComponent,
    CommonModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent {
  public showPrizesSidebar: boolean;
  public enableArduinoControl: boolean;

  constructor(
    private settingsService: SettingsService,
    private gamesService: GamesService
  ) {
    // Load current settings
    const settings = this.settingsService.getSettings();

    // Apply settings to component state
    this.showPrizesSidebar = settings.showPrizesList;
    this.enableArduinoControl = settings.enableArduinoControl;

    // Record that this game was played
    this.gamesService.recordGamePlayed('slot-machine');
  }
}