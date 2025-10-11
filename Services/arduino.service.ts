import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ArduinoStatus = 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'error' | 'unsupported';

export interface ArduinoStatusInfo {
  status: ArduinoStatus;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArduinoService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isConnected: boolean = false;
  private readableStreamClosed: any = null;
  private writableStreamClosed: any = null;
  private keepaliveInterval: any = null;

  private statusSubject = new BehaviorSubject<ArduinoStatusInfo>({
    status: 'disconnected'
  });

  private rollRequestSubject = new BehaviorSubject<boolean>(false);

  public status$: Observable<ArduinoStatusInfo> = this.statusSubject.asObservable();
  public rollRequest$: Observable<boolean> = this.rollRequestSubject.asObservable();

  constructor() {
    // Set up page unload handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.handlePageUnload();
      });

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && this.isConnected) {
            this.send('DISCONNECT\n').catch(() => {});
          }
        });
      }
    }
  }

  // Check if Web Serial API is supported
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  // Connect to Arduino
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      const error = 'Web Serial API not supported in this browser. Use Chrome, Edge, or Opera.';
      this.statusSubject.next({ status: 'unsupported', message: error });
      throw new Error(error);
    }

    try {
      this.statusSubject.next({ status: 'connecting', message: 'Connecting to Arduino...' });

      // Clean up existing port
      if (this.port) {
        console.log('Cleaning up existing port...');
        try {
          await this.port.close();
        } catch (e) {
          console.warn('Error closing existing port:', e);
        }
        this.port = null;
      }

      // Request port from user
      this.port = await (navigator as any).serial.requestPort();

      // Check if port is already open
      if (this.port.readable || this.port.writable) {
        console.log('Port appears to be open already, closing it first...');
        try {
          await this.port.close();
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {
          console.warn('Could not close port:', e);
        }
      }

      // Open the port with retry logic
      await this.openPortWithRetry(this.port);

      // Set up text decoder/encoder
      const textDecoder = new TextDecoderStream();
      this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      // Mark as connected
      this.isConnected = true;

      // Start listening for commands
      this.listenForCommands();

      // Update status
      this.statusSubject.next({ status: 'connected', message: 'Arduino Connected' });

      // Wait for Arduino to reset and boot up
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send connection confirmation
      try {
        await this.send('CONNECTED\n');
        console.log('Sent CONNECTED message to Arduino');
      } catch (error) {
        console.warn('Could not send CONNECTED message, but connection is established:', error);
      }

      // Start keepalive
      this.startKeepalive();

      return true;
    } catch (error: any) {
      console.error('Failed to connect to Arduino:', error);
      this.isConnected = false;

      // Clean up if connection failed
      if (this.port) {
        try {
          await this.port.close();
        } catch (closeError) {
          console.error('Error closing port after failed connection:', closeError);
        }
        this.port = null;
      }

      this.statusSubject.next({ 
        status: 'error', 
        message: error.message || 'Failed to connect to Arduino' 
      });
      throw error;
    }
  }

  // Open port with retry logic
  private async openPortWithRetry(port: any, retries: number = 2): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Opening port (attempt ${attempt}/${retries})...`);
        await port.open({ baudRate: 9600 });
        console.log('Port opened successfully');
        return;
      } catch (error: any) {
        if (error.message && error.message.includes('already open')) {
          console.log(`Port still locked, waiting before retry ${attempt}/${retries}...`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 800 * attempt));
            try {
              await port.close();
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
              console.warn('Could not close during retry:', e);
            }
          } else {
            throw new Error('Port is still in use. Please wait a moment and try again.');
          }
        } else {
          throw error;
        }
      }
    }
  }

  // Disconnect from Arduino
  async disconnect(): Promise<void> {
    console.log('Starting disconnect process...');

    try {
      this.statusSubject.next({ status: 'disconnecting', message: 'Disconnecting...' });

      // Send disconnect notification
      if (this.isConnected && this.writer) {
        try {
          await this.send('DISCONNECT\n');
          console.log('Sent DISCONNECT message to Arduino');
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Could not send DISCONNECT message:', error);
        }
      }

      // Mark as disconnected
      this.isConnected = false;

      // Stop keepalive
      this.stopKeepalive();

      // Wait for listen loop to exit
      await new Promise(resolve => setTimeout(resolve, 50));

      // Close reader
      if (this.reader) {
        try {
          await this.reader.cancel();
          this.reader.releaseLock();
          console.log('Reader canceled and released');
        } catch (e) {
          console.warn('Error with reader:', e);
        }
        this.reader = null;
      }

      // Close writer
      if (this.writer) {
        try {
          await this.writer.close();
          console.log('Writer closed');
        } catch (e) {
          console.warn('Error closing writer:', e);
        }
        this.writer = null;
      }

      // Wait for pipes to close
      await this.closePipes();
      this.readableStreamClosed = null;
      this.writableStreamClosed = null;

      // Close port
      if (this.port) {
        try {
          await this.port.close();
          console.log('Serial port closed successfully');
        } catch (e) {
          console.error('Error closing port:', e);
        }
        this.port = null;
      }

      // Update status
      this.statusSubject.next({ status: 'disconnected', message: 'Arduino Disconnected' });
      console.log('Arduino disconnected successfully');

      // Cooldown period
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error during disconnect:', error);
      this.isConnected = false;
      this.reader = null;
      this.writer = null;
      this.port = null;
      this.statusSubject.next({ status: 'disconnected', message: 'Arduino Disconnected' });
    }
  }

  private async closePipes(): Promise<void> {
    const promises: Promise<any>[] = [];
    if (this.readableStreamClosed) {
      promises.push(this.readableStreamClosed.catch((e: any) => console.log('Readable stream closed:', e.message)));
    }
    if (this.writableStreamClosed) {
      promises.push(this.writableStreamClosed.catch((e: any) => console.log('Writable stream closed:', e.message)));
    }
    if (promises.length > 0) {
      await Promise.race([
        Promise.all(promises),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    }
  }

  // Listen for commands from Arduino
  private async listenForCommands(): Promise<void> {
    try {
      let buffer = '';

      while (this.isConnected) {
        try {
          const { value, done } = await this.reader.read();

          if (done) {
            console.log('Arduino reader stream ended');
            if (this.isConnected) {
              this.isConnected = false;
              this.statusSubject.next({ status: 'disconnected', message: 'Arduino Disconnected' });
            }
            break;
          }

          // Add received data to buffer
          buffer += value;

          // Process complete lines
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const command = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);

            if (command) {
              await this.handleCommand(command);
            }
          }
        } catch (readError) {
          if (this.isConnected) {
            console.error('Error reading from Arduino:', readError);
            this.isConnected = false;
            this.statusSubject.next({ 
              status: 'error', 
              message: 'Connection lost' 
            });
          }
          break;
        }
      }
      console.log('Listen loop ended');
    } catch (error) {
      console.error('Listen loop error:', error);
      if (this.isConnected) {
        this.isConnected = false;
        this.statusSubject.next({ 
          status: 'error', 
          message: 'Connection error' 
        });
      }
    }
  }

  // Handle incoming commands
  private async handleCommand(command: string): Promise<void> {
    console.log('Received command from Arduino:', command);

    const parts = command.split(':');
    const cmd = parts[0].toUpperCase();
    const param = parts[1] || null;

    switch (cmd) {
      case 'ROLL':
      case 'SPIN':
      case 'START':
        // Trigger slot roll
        this.rollRequestSubject.next(true);
        break;

      case 'PING':
        // Respond to ping
        await this.send('PONG\n');
        break;

      case 'STATUS':
        // Send current status
        const status = this.isConnected ? 'READY' : 'NOT_READY';
        await this.send(`STATUS:${status}\n`);
        break;

      default:
        console.warn('Unknown command:', command);
        await this.send(`UNKNOWN:${command}\n`);
    }
  }

  // Send data to Arduino
  async send(data: string): Promise<boolean> {
    if (!this.isConnected || !this.writer) {
      console.warn('Cannot send - Arduino not connected');
      return false;
    }

    try {
      await this.writer.write(data);
      return true;
    } catch (error) {
      console.error('Error sending to Arduino:', error);
      return false;
    }
  }

  // Send win/lose result to Arduino
  async sendResult(isWin: boolean, prize?: string): Promise<void> {
    if (!this.isConnected) return;

    if (isWin && prize) {
      await this.send(`WIN:${prize}\n`);
    } else if (isWin) {
      await this.send('WIN\n');
    } else {
      await this.send('LOSE\n');
    }
  }

  // Start keepalive to prevent Arduino timeout
  private startKeepalive(): void {
    this.keepaliveInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('PING\n').catch(err => {
          console.warn('Keepalive ping failed:', err);
        });
      }
    }, 2000);
    console.log('Keepalive started (2s interval)');
  }

  // Stop keepalive
  private stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
      console.log('Keepalive stopped');
    }
  }

  // Handle page unload
  private handlePageUnload(): void {
    if (this.isConnected && this.writer) {
      try {
        const encoder = new TextEncoder();
        this.writer.write('DISCONNECT\n');
      } catch (e) {
        console.warn('Could not send disconnect on unload:', e);
      }
    }
  }

  // Get current connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
