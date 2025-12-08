import { Component, Input, Output, EventEmitter, PLATFORM_ID, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../../Services/storage.service';
import { ArduinoService } from '../../../Services/arduino.service';
import { SettingsService } from '../../../Services/settings.service';
import { Item } from '../slot-machine-roller/slot-machine-roller.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'slot-machine-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-machine-controls.component.html',
  styleUrl: './slot-machine-controls.component.scss'
})
export class SlotMachineControlsComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private destroy$ = new Subject<void>();

  @Input() items: Item[] = [];
  @Output() rollStart = new EventEmitter<void>();

  isRolling: boolean = false;
  rollButtonText: string = 'ROLL';
  rollButtonDisabled: boolean = false;
  rollButtonClass: string = '';
  showArduinoInstruction: boolean = false;
  arduinoInstructionText: string = 'Press the button to roll!';
  arduinoInstructionClass: string = '';

  // Button text templates from settings
  private buttonTextRoll: string = 'ROLL';
  private notificationTextRolling: string = 'ROLLING...';
  private notificationTextWin: string = 'YOU WON: {reward}';
  private buttonTextArduino: string = 'Press the button to roll!';
  private showButtonTextRoll: boolean = true;
  private showNotificationTextRolling: boolean = true;
  private showNotificationTextWin: boolean = true;
  private showButtonTextArduino: boolean = true;

  // Arduino Controller (if available)
  private arduinoController: any = null;
  private statusSubscription: any = null;

  constructor(
    private storage: StorageService,
    private arduinoService: ArduinoService,
    private settingsService: SettingsService
  ) {
    // constructor body intentionally empty
  }

  ngOnInit(): void {
    // Only run in browser environment
    if (!this.isBrowser) {
      return;
    }

    // Subscribe to button text settings
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.showButtonTextRoll = settings.showButtonTextRoll;
        this.showNotificationTextRolling = settings.showNotificationRolling;
        this.showNotificationTextWin = settings.showNotificationWin;
        this.showButtonTextArduino = settings.showButtonTextArduino;
        this.buttonTextRoll = settings.buttonTextRoll || 'Roll';
        this.notificationTextRolling = settings.notificationRolling || 'Rolling...';
        this.notificationTextWin = settings.notificationWin || 'You won: {reward}!';
        this.buttonTextArduino = settings.buttonTextArduino || 'Press the button to roll!';
        
        // Update current button text if not rolling or winning
        if (!this.isRolling && this.rollButtonClass !== 'win-state') {
          this.rollButtonText = this.showButtonTextRoll ? this.buttonTextRoll : '';
        }
        
        // Update Arduino instruction text
        if (this.showArduinoInstruction && !this.isRolling && this.arduinoInstructionClass !== 'win-state') {
          this.arduinoInstructionText = this.showButtonTextArduino ? this.buttonTextArduino : '';
        }
      });

    // Check if Arduino control is enabled in settings using StorageService
    const arduinoEnabled = this.storage.getArduinoEnabled();

    if (arduinoEnabled) {
      // Subscribe to ArduinoService status to control instruction text
      this.statusSubscription = this.arduinoService.status$.subscribe(statusInfo => {
        this.showArduinoInstruction = statusInfo.status === 'connected';
        // Keep the instruction text stable; it will be updated during roll/win/loss states
        this.arduinoInstructionText = this.showArduinoInstruction ? (this.showButtonTextArduino ? this.buttonTextArduino : '') : (this.showButtonTextArduino ? this.buttonTextArduino : '');
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
    this.destroy$.next();
    this.destroy$.complete();
    
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
    this.rollButtonText = this.showNotificationTextRolling ? this.notificationTextRolling : '';
    this.isRolling = true;

    // Update Arduino instruction
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = this.showNotificationTextRolling ? this.notificationTextRolling : '';
    }

    // Emit roll start event
    this.rollStart.emit();
  }

  handleWin(reward: string): void {
    // Format win text by replacing {reward} placeholder
    const winText = this.showNotificationTextWin ? this.notificationTextWin.replace('{reward}', reward) : '';
    
    // Show win message
    this.rollButtonText = winText;
    this.rollButtonClass = 'win-state';
    this.isRolling = false;

    // Update Arduino instruction for win
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = winText;
      this.arduinoInstructionClass = 'win-state';
    }

    // Send win result to Arduino (prefer ArduinoService if available)
    if (this.arduinoService && (this.arduinoService as any).getConnectionStatus && (this.arduinoService as any).getConnectionStatus()) {
      this.arduinoService.sendResult(true, reward);
    } else if (this.arduinoController && this.arduinoController.isConnected) {
      this.arduinoController.sendResult(true, reward);
    }

    // Reset after 10 seconds (5s win notification + 5s after-roll notification)
    setTimeout(() => {
      this.rollButtonDisabled = false;
      this.rollButtonText = this.showButtonTextRoll ? this.buttonTextRoll : '';
      this.rollButtonClass = '';
      
      if (this.showArduinoInstruction) {
        this.arduinoInstructionText = this.showButtonTextArduino ? this.buttonTextArduino : '';
        this.arduinoInstructionClass = '';
      }
    }, 10000);
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
    this.rollButtonText = this.showButtonTextRoll ? this.buttonTextRoll : '';

    // Restore Arduino instruction
    if (this.showArduinoInstruction) {
      this.arduinoInstructionText = this.showButtonTextArduino ? this.buttonTextArduino : '';
    }
  }
}
