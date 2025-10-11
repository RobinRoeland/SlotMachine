import { Component, Input, Output, EventEmitter, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../../Services/storage.service';
import { ArduinoService } from '../../../Services/arduino.service';
import { Item } from '../slot-machine-roller/slot-machine-roller.component';

@Component({
  selector: 'slot-machine-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-machine-controls.component.html',
  styleUrl: './slot-machine-controls.component.scss'
})
export class SlotMachineControlsComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @Input() items: Item[] = [];
  @Output() rollStart = new EventEmitter<void>();

  isRolling: boolean = false;
  rollButtonText: string = 'ROLL';
  rollButtonDisabled: boolean = false;
  rollButtonClass: string = '';
  showArduinoInstruction: boolean = false;
  arduinoInstructionText: string = 'Press the button to roll!';
  arduinoInstructionClass: string = '';

  // Arduino Controller (if available)
  private arduinoController: any = null;
  private statusSubscription: any = null;

  constructor(private storage: StorageService, private arduinoService: ArduinoService) {
    // constructor body intentionally empty
  }

  ngOnInit(): void {
    // Only run in browser environment
    if (!this.isBrowser) {
      return;
    }

    // Check if Arduino control is enabled in settings using StorageService
    const arduinoEnabled = this.storage.getArduinoEnabled();

    if (arduinoEnabled) {
      // Subscribe to ArduinoService status to control instruction text
      this.statusSubscription = this.arduinoService.status$.subscribe(statusInfo => {
        this.showArduinoInstruction = statusInfo.status === 'connected';
        // Keep the instruction text stable; it will be updated during roll/win/loss states
        this.arduinoInstructionText = this.showArduinoInstruction ? 'Press the button to roll!' : 'Press the button to roll!';
        this.arduinoInstructionClass = '';
      });

      // Legacy fallback: if window ArduinoController exists, keep hooking it but prefer service events
      if ((window as any).ArduinoController && (window as any).ArduinoUI) {
        this.arduinoController = new (window as any).ArduinoController();
        const arduinoUI = new (window as any).ArduinoUI(this.arduinoController);
        arduinoUI.initialize();

        // Set up status change callback for legacy controller
        this.arduinoController.onStatusChange((status: string) => {
          this.showArduinoInstruction = status === 'connected';
        });

        // Set up roll callback: legacy controller forwards presses to UI only
        this.arduinoController.onRoll(() => {
          if (!this.rollButtonDisabled && this.items && this.items.length > 0) {
            this.onRollClick();
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.statusSubscription && typeof this.statusSubscription.unsubscribe === 'function') {
      this.statusSubscription.unsubscribe();
    }
  }
  onRollClick(): void {
    if (this.rollButtonDisabled || !this.items || this.items.length === 0) {
      return;
    }

    // Disable button during roll
    this.rollButtonDisabled = true;
    this.rollButtonText = 'ROLLING...';
    this.isRolling = true;

    // Update Arduino instruction
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = 'ROLLING...';
    }

    // Emit roll start event
    this.rollStart.emit();
  }

  handleWin(reward: string): void {
    // Show win message
    this.rollButtonText = `YOU WON: ${reward}`;
    this.rollButtonClass = 'win-state';
    this.isRolling = false;

    // Update Arduino instruction for win
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = `YOU WON: ${reward}`;
      this.arduinoInstructionClass = 'win-state';
    }

    // Send win result to Arduino (prefer ArduinoService if available)
    if (this.arduinoService && (this.arduinoService as any).getConnectionStatus && (this.arduinoService as any).getConnectionStatus()) {
      this.arduinoService.sendResult(true, reward);
    } else if (this.arduinoController && this.arduinoController.isConnected) {
      this.arduinoController.sendResult(true, reward);
    }

    // Reset after 3 seconds
    setTimeout(() => {
      this.rollButtonDisabled = false;
      this.rollButtonText = 'ROLL';
      this.rollButtonClass = '';
      
      if (this.showArduinoInstruction) {
        this.arduinoInstructionText = 'Press the button to roll!';
        this.arduinoInstructionClass = '';
      }
    }, 3000);
  }

  handleLoss(): void {
    this.isRolling = false;

    // Send lose result to Arduino (prefer ArduinoService if available)
    if (this.arduinoService && (this.arduinoService as any).getConnectionStatus && (this.arduinoService as any).getConnectionStatus()) {
      this.arduinoService.sendResult(false);
    } else if (this.arduinoController && this.arduinoController.isConnected) {
      this.arduinoController.sendResult(false);
    }

    // Re-enable button
    this.rollButtonDisabled = false;
    this.rollButtonText = 'ROLL';

    // Restore Arduino instruction
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = 'Press the button to roll!';
    }
  }
}
