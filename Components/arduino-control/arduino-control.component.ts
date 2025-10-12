import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArduinoService, ArduinoStatusInfo } from '../../Services/arduino.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'arduino-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arduino-control.component.html',
  styleUrl: './arduino-control.component.scss'
})
export class ArduinoControlComponent implements OnInit, OnDestroy {
  statusInfo: ArduinoStatusInfo = { status: 'disconnected' };
  isConnecting: boolean = false;
  isSupported: boolean = false;
  isMobile: boolean = false;
  
  private statusSubscription?: Subscription;

  constructor(public arduinoService: ArduinoService) {}

  ngOnInit(): void {
    this.isMobile = this.isMobileDevice();
    this.isSupported = this.arduinoService.isSupported();
    
    // Subscribe to status changes
    this.statusSubscription = this.arduinoService.status$.subscribe(
      (statusInfo: ArduinoStatusInfo) => {
        this.statusInfo = statusInfo;
        this.isConnecting = statusInfo.status === 'connecting' || statusInfo.status === 'disconnecting';
      }
    );

    // Set initial status if not supported
    if (!this.isSupported) {
      this.statusInfo = {
        status: 'unsupported',
        message: 'Web Serial API not supported. Use Chrome, Edge, or Opera.'
      };
    }
  }

  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileScreen = window.innerWidth <= 768;
    return isMobileUA || isMobileScreen;
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  async toggleConnection(): Promise<void> {
    if (this.arduinoService.getConnectionStatus()) {
      // Disconnect
      await this.arduinoService.disconnect();
    } else {
      // Connect
      try {
        await this.arduinoService.connect();
      } catch (error: any) {
        console.error('Connection error:', error);
      }
    }
  }

  getStatusIndicatorClass(): string {
    return `arduino-status-indicator ${this.statusInfo.status}`;
  }

  getStatusText(): string {
    if (this.statusInfo.message) {
      return this.statusInfo.message;
    }

    switch (this.statusInfo.status) {
      case 'connected':
        return 'Arduino Connected';
      case 'disconnected':
        return 'Arduino Disconnected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnecting':
        return 'Disconnecting...';
      case 'error':
        return 'Connection Error';
      case 'unsupported':
        return 'Not Supported';
      default:
        return 'Arduino Disconnected';
    }
  }

  getButtonText(): string {
    switch (this.statusInfo.status) {
      case 'connected':
        return 'Disconnect Arduino';
      case 'connecting':
        return 'Connecting...';
      case 'disconnecting':
        return 'Disconnecting...';
      case 'unsupported':
        return 'Not Available';
      default:
        return 'Connect Arduino';
    }
  }

  isButtonDisabled(): boolean {
    return this.isConnecting || !this.isSupported || this.isMobile;
  }
}
