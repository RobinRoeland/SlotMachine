import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotMachineComponent } from '../../Components/machine/slot-machine/slot-machine.component';
import { PrizesSidebarComponent } from '../../Components/prizes/prizes-sidebar/prizes-sidebar.component';
import { ArduinoControlComponent } from '../../Components/arduino-control/arduino-control.component';
import { SettingsService } from '../../Services/settings.service';

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
    private settingsService: SettingsService
  ) {
    // Load current settings
    const settings = this.settingsService.getSettings();

    // Apply settings to component state
    this.showPrizesSidebar = settings.showPrizesList;
    this.enableArduinoControl = settings.enableArduinoControl;
  }
}
