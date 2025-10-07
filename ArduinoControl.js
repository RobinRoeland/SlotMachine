// Arduino Control Integration for Slot Machine
// Uses Web Serial API to communicate with Arduino

class ArduinoController {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.onRollCallback = null;
        this.statusCallbacks = []; // Support multiple callbacks
        this.readableStreamClosed = null;
        this.writableStreamClosed = null;
        this.keepaliveInterval = null;
    }

    // Check if Web Serial API is supported
    isSupported() {
        return 'serial' in navigator;
    }

    // Connect to Arduino
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Serial API not supported in this browser. Use Chrome, Edge, or Opera.');
        }

        try {
            // If we still have a port reference, make sure it's closed first
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
            this.port = await navigator.serial.requestPort();
            
            // Check if port is already open (shouldn't be, but just in case)
            if (this.port.readable || this.port.writable) {
                console.log('Port appears to be open already, closing it first...');
                try {
                    await this.port.close();
                    // Wait a bit for port to fully close
                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (e) {
                    console.warn('Could not close port:', e);
                }
            }
            
            // Add timeout wrapper for port opening with retry logic
            const openPortWithRetry = async (port, retries = 2) => {
                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        console.log(`Opening port (attempt ${attempt}/${retries})...`);
                        await port.open({ baudRate: 9600 });
                        console.log('Port opened successfully');
                        return;
                    } catch (error) {
                        if (error.message && error.message.includes('already open')) {
                            console.log(`Port still locked, waiting before retry ${attempt}/${retries}...`);
                            if (attempt < retries) {
                                // Wait progressively longer on each retry
                                await new Promise(resolve => setTimeout(resolve, 800 * attempt));
                                // Try to close it again
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
            };
            
            // Open the port with retry logic
            await openPortWithRetry(this.port);
            
            // Set up the text decoder/encoder first (before delay)
            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();
            
            const textEncoder = new TextEncoderStream();
            this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();
            
            // Mark as connected immediately so we can send/receive
            this.isConnected = true;
            
            // Start listening for commands
            this.listenForCommands();
            
            // Update UI to connected state right away
            this._triggerStatusCallbacks('connected');
            
            // Wait for Arduino to reset and boot up (Arduino resets when serial connection opens)
            // This delay is crucial for proper communication
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Send connection confirmation after Arduino has booted
            try {
                await this.send('CONNECTED\n');
                console.log('Sent CONNECTED message to Arduino');
            } catch (error) {
                console.warn('Could not send CONNECTED message, but connection is established:', error);
            }
            
            // Start keepalive to prevent timeout (Arduino detects disconnect after 3s of no data)
            this.startKeepalive();
            
            return true;
        } catch (error) {
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
            
            this._triggerStatusCallbacks('error', error.message);
            throw error;
        }
    }

    // Disconnect from Arduino
    async disconnect() {
        console.log('Starting disconnect process...');
        
        try {
            // Send disconnect notification to Arduino before closing
            if (this.isConnected && this.writer) {
                try {
                    await this.send('DISCONNECT\n');
                    console.log('Sent DISCONNECT message to Arduino');
                    // Give Arduino time to process the message
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.warn('Could not send DISCONNECT message:', error);
                }
            }
            
            // Mark as disconnected first to stop the listen loop
            this.isConnected = false;
            
            // Stop keepalive
            this.stopKeepalive();
            
            // Wait a moment for listen loop to exit
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Close reader and release lock
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
            
            // Close writer and release lock
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
            const closePipes = async () => {
                const promises = [];
                if (this.readableStreamClosed) {
                    promises.push(this.readableStreamClosed.catch(e => console.log('Readable stream closed:', e.message)));
                }
                if (this.writableStreamClosed) {
                    promises.push(this.writableStreamClosed.catch(e => console.log('Writable stream closed:', e.message)));
                }
                if (promises.length > 0) {
                    await Promise.race([
                        Promise.all(promises),
                        new Promise(resolve => setTimeout(resolve, 500)) // Timeout after 500ms
                    ]);
                }
            };
            
            await closePipes();
            this.readableStreamClosed = null;
            this.writableStreamClosed = null;
            
            // Close port - this is critical
            if (this.port) {
                try {
                    await this.port.close();
                    console.log('Serial port closed successfully');
                } catch (e) {
                    console.error('Error closing port:', e);
                }
                this.port = null;
            }
            
            // Update UI
            this._triggerStatusCallbacks('disconnected');
            console.log('Arduino disconnected successfully');
            
            // Add a cooldown period to ensure port is fully released
            // This prevents "already open" errors on quick reconnect
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error('Error during disconnect:', error);
            // Still try to clean up
            this.isConnected = false;
            this.reader = null;
            this.writer = null;
            this.port = null;
            this._triggerStatusCallbacks('disconnected');
        }
    }

    // Listen for commands from Arduino
    async listenForCommands() {
        try {
            let buffer = '';
            
            while (this.isConnected) {
                try {
                    const { value, done } = await this.reader.read();
                    
                    if (done) {
                        console.log('Arduino reader stream ended');
                        if (this.isConnected) {
                            // Unexpected disconnect
                            this.isConnected = false;
                            this._triggerStatusCallbacks('disconnected');
                        }
                        break;
                    }
                    
                    // Add received data to buffer
                    buffer += value;
                    
                    // Process complete lines (commands ending with newline)
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const command = buffer.substring(0, newlineIndex).trim();
                        buffer = buffer.substring(newlineIndex + 1);
                        
                        if (command) {
                            await this.handleCommand(command);
                        }
                    }
                } catch (readError) {
                    // Check if this is expected (disconnect) or unexpected error
                    if (this.isConnected) {
                        console.error('Error reading from Arduino:', readError);
                        this.isConnected = false;
                        this._triggerStatusCallbacks('error', readError.message);
                    }
                    break;
                }
            }
            console.log('Listen loop ended');
        } catch (error) {
            console.error('Listen loop error:', error);
            if (this.isConnected) {
                this.isConnected = false;
                this._triggerStatusCallbacks('error', error.message);
            }
        }
    }

    // Handle incoming commands
    async handleCommand(command) {
        console.log('Received command from Arduino:', command);
        
        // Parse command (format: "COMMAND" or "COMMAND:PARAM")
        const parts = command.split(':');
        const cmd = parts[0].toUpperCase();
        const param = parts[1] || null;
        
        switch (cmd) {
            case 'ROLL':
            case 'SPIN':
            case 'START':
                // Trigger slot roll
                if (this.onRollCallback) {
                    this.onRollCallback();
                }
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
    async send(data) {
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

    // Set callback for when roll is requested
    onRoll(callback) {
        this.onRollCallback = callback;
    }

    // Set callback for status changes (supports multiple callbacks)
    onStatusChange(callback) {
        if (callback && typeof callback === 'function') {
            this.statusCallbacks.push(callback);
        }
    }
    
    // Helper to trigger all status callbacks
    _triggerStatusCallbacks(status, message) {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status, message);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    // Send win/lose result to Arduino
    async sendResult(isWin, prize = null) {
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
    startKeepalive() {
        // Send a PING every 2 seconds (Arduino times out after 3s)
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
    stopKeepalive() {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
            console.log('Keepalive stopped');
        }
    }
}

// UI Controller for Arduino connection
class ArduinoUI {
    constructor(controller) {
        this.controller = controller;
        this.connectButton = null;
        this.statusIndicator = null;
        this.statusText = null;
    }

    initialize() {
        // Create UI elements
        this.createUI();
        
        // Set up event listeners
        this.connectButton.addEventListener('click', () => this.toggleConnection());
        
        // Set up status callback
        this.controller.onStatusChange((status, message) => {
            this.updateStatus(status, message);
        });
        
        // Check if supported
        if (!this.controller.isSupported()) {
            this.updateStatus('unsupported', 'Web Serial API not supported. Use Chrome, Edge, or Opera.');
            this.connectButton.disabled = true;
        }
        
        // Disconnect on page unload/refresh to clean up properly
        window.addEventListener('beforeunload', (event) => {
            if (this.controller.isConnected) {
                // Send disconnect message synchronously (async won't complete in time)
                if (this.controller.writer) {
                    try {
                        // Use synchronous approach for page unload
                        const encoder = new TextEncoder();
                        const writer = this.controller.writer;
                        writer.write('DISCONNECT\n');
                    } catch (e) {
                        console.warn('Could not send disconnect on unload:', e);
                    }
                }
            }
        });
        
        // Also handle visibility change (page hidden/closed)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.controller.isConnected) {
                // Page is being hidden, try to disconnect
                if (this.controller.writer) {
                    try {
                        this.controller.send('DISCONNECT\n').catch(() => {});
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
        });
    }

    createUI() {
        // Find or create container in the page
        const header = document.querySelector('.content .header');
        if (!header) return;
        
        const arduinoPanel = document.createElement('div');
        arduinoPanel.className = 'arduino-control-panel';
        arduinoPanel.innerHTML = `
            <div class="arduino-status">
                <div class="arduino-status-indicator" id="arduinoStatusIndicator"></div>
                <span class="arduino-status-text" id="arduinoStatusText">Arduino Disconnected</span>
            </div>
            <button id="arduinoConnectButton" class="arduino-connect-button">Connect Arduino</button>
        `;
        
        header.appendChild(arduinoPanel);
        
        this.connectButton = document.getElementById('arduinoConnectButton');
        this.statusIndicator = document.getElementById('arduinoStatusIndicator');
        this.statusText = document.getElementById('arduinoStatusText');
    }

    async toggleConnection() {
        if (this.controller.isConnected) {
            // Disconnect
            this.connectButton.disabled = true;
            this.updateStatus('disconnecting', 'Disconnecting...');
            await this.controller.disconnect();
            // Wait a moment before re-enabling button (port release cooldown)
            await new Promise(resolve => setTimeout(resolve, 500));
            this.connectButton.disabled = false;
        } else {
            // Connect
            try {
                this.updateStatus('connecting', 'Connecting to Arduino...');
                this.connectButton.disabled = true;
                await this.controller.connect();
                // Status will be updated by the controller's callback
            } catch (error) {
                console.error('Connection error:', error);
                const errorMsg = error.message || 'Failed to connect';
                this.updateStatus('error', errorMsg);
                this.connectButton.disabled = false;
            }
        }
    }

    updateStatus(status, message) {
        const statusMap = {
            'connected': {
                indicator: 'connected',
                text: 'Arduino Connected',
                buttonText: 'Disconnect Arduino',
                disabled: false
            },
            'disconnected': {
                indicator: 'disconnected',
                text: 'Arduino Disconnected',
                buttonText: 'Connect Arduino',
                disabled: false
            },
            'disconnecting': {
                indicator: 'connecting',
                text: 'Disconnecting...',
                buttonText: 'Disconnecting...',
                disabled: true
            },
            'connecting': {
                indicator: 'connecting',
                text: message || 'Connecting...',
                buttonText: 'Connecting...',
                disabled: true
            },
            'error': {
                indicator: 'error',
                text: message || 'Connection Error',
                buttonText: 'Connect Arduino',
                disabled: false
            },
            'unsupported': {
                indicator: 'error',
                text: message || 'Not Supported',
                buttonText: 'Not Available',
                disabled: true
            }
        };
        
        const config = statusMap[status] || statusMap['disconnected'];
        
        if (this.statusIndicator) {
            this.statusIndicator.className = 'arduino-status-indicator ' + config.indicator;
        }
        
        if (this.statusText) {
            this.statusText.textContent = config.text;
        }
        
        if (this.connectButton) {
            this.connectButton.textContent = config.buttonText;
            this.connectButton.disabled = config.disabled;
        }
    }
}

// Export for use in SlotMachine.js
window.ArduinoController = ArduinoController;
window.ArduinoUI = ArduinoUI;

