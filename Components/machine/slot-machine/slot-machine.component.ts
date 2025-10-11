import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { SlotMachineControlsComponent } from '../slot-machine-controls/slot-machine-controls.component'
import { SlotMachineRollersComponent } from '../slot-machine-rollers/slot-machine-rollers.component'
import { Item } from '../slot-machine-roller/slot-machine-roller.component';
import { StorageService } from '../../../Services/storage.service';
import { ItemsService } from '../../../Services/items.service';
import { ArduinoService } from '../../../Services/arduino.service';
import { Subscription } from 'rxjs';

export interface Prize {
  pattern: string[];
  reward: string;
}

@Component({
  selector: 'slot-machine',
  standalone: true,
  imports: [
    SlotMachineControlsComponent,
    SlotMachineRollersComponent
  ],
  templateUrl: './slot-machine.component.html',
  styleUrl: './slot-machine.component.scss'
})
export class SlotMachineComponent implements OnInit, OnDestroy {
  @ViewChild(SlotMachineRollersComponent) rollersComponent!: SlotMachineRollersComponent;
  @ViewChild(SlotMachineControlsComponent) controlsComponent!: SlotMachineControlsComponent;

  items: Item[] = [];
  rollerCount: number = 4;
  isRolling: boolean = false;
  
  private rollRequestSubscription?: Subscription;

  constructor(
    private storage: StorageService,
    private itemsService: ItemsService,
    private arduinoService: ArduinoService
  ) {}

  ngOnInit(): void {
    // Load roller count from StorageService
    this.rollerCount = this.storage.getRollerCount();
    
    // Load items
    this.items = this.itemsService.getItems();
    
    // Subscribe to Arduino roll requests
    this.rollRequestSubscription = this.arduinoService.rollRequest$.subscribe(
      (shouldRoll: boolean) => {
        if (shouldRoll && !this.isRolling) {
          this.onRollStart();
        }
      }
    );
  }
  
  ngOnDestroy(): void {
    if (this.rollRequestSubscription) {
      this.rollRequestSubscription.unsubscribe();
    }
  }

  checkForWin(centerItems: string[]): Prize | null {
    // Load prizes from StorageService
    let prizes = this.storage.getPrizes() || [];

    // Filter prizes by roller count
    prizes = prizes.filter(prize => 
      prize.pattern && prize.pattern.length === centerItems.length
    );

    // Check if current result matches any prize
    for (const prize of prizes) {
      let matches = true;
      for (let j = 0; j < prize.pattern.length; j++) {
        if (prize.pattern[j] !== '*' && prize.pattern[j] !== centerItems[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return prize;
      }
    }

    return null;
  }

  onRollComplete(centerItems: string[]): void {
    // Check pity system using StorageService
    const pityEnabled = this.storage.getPityEnabled();
    const spinsWithoutWin = this.storage.getSpinsWithoutWin();

    // Check for win
    const winningPrize = this.checkForWin(centerItems);

    if (winningPrize) {
      // Reset counter using StorageService (this will trigger observables)
      this.storage.setSpinsWithoutWin(0);
      
      // Send win result to Arduino
      this.arduinoService.sendResult(true, winningPrize.reward);
      
      // Notify controls of win
      if (this.controlsComponent) {
        this.controlsComponent.handleWin(winningPrize.reward);
      }
    } else {
      // Increment counter using StorageService (this will trigger observables)
      if (pityEnabled) {
        const newCount = spinsWithoutWin + 1;
        this.storage.setSpinsWithoutWin(newCount);
      }
      
      // Send lose result to Arduino
      this.arduinoService.sendResult(false);
      
      // Notify controls of loss
      if (this.controlsComponent) {
        this.controlsComponent.handleLoss();
      }
    }
  }

  onRollStart(): void {
    this.isRolling = true;
    if (this.rollersComponent) {
      this.rollersComponent.startRoll();
    }
  }
}
