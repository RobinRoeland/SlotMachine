import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotMachineComponent } from '../../Components/machine/slot-machine/slot-machine.component';
import { PrizesSidebarComponent } from '../../Components/prizes/prizes-sidebar/prizes-sidebar.component';
import { ArduinoControlComponent } from '../../Components/arduino-control/arduino-control.component';
import { SettingsService } from '../../Services/settings.service';
import { StorageService } from '../../Services/storage.service';

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
    private storage: StorageService
  ) {
    // Load current settings
    const settings = this.settingsService.getSettings();

    if(this.settingsService.hasSettings) {
      this.settingsService.resetToDefaults();
      this.storage.setItems([]);
      console.warn("Settings were undefined, resetting to defaults.");
    }

    // Apply settings to component state
    this.showPrizesSidebar = settings.showPrizesList;
    this.enableArduinoControl = settings.enableArduinoControl;
  }
}
