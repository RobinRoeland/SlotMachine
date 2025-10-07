// Arduino Control Integration for Slot Machine
// Uses Web Serial API to communicate with Arduino

class ArduinoController {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.onRollCallback = null;
        this.statusCallback = null;
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
            // Request port from user
            this.port = await navigator.serial.requestPort();
            
            // Open the port with standard Arduino baud rate
            await this.port.open({ baudRate: 9600 });
            
            this.isConnected = true;
            
            // Set up the text decoder/encoder
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();
            
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();
            
            // Start listening for commands
            this.listenForCommands();
            
            // Send connection confirmation
            await this.send('CONNECTED\n');
            
            if (this.statusCallback) {
                this.statusCallback('connected');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to connect to Arduino:', error);
            this.isConnected = false;
            if (this.statusCallback) {
                this.statusCallback('error', error.message);
            }
            throw error;
        }
    }

    // Disconnect from Arduino
    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            
            if (this.writer) {
                await this.writer.close();
                this.writer = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            
            if (this.statusCallback) {
                this.statusCallback('disconnected');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    // Listen for commands from Arduino
    async listenForCommands() {
        try {
            let buffer = '';
            
            while (true) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    console.log('Arduino disconnected');
                    this.isConnected = false;
                    if (this.statusCallback) {
                        this.statusCallback('disconnected');
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
            }
        } catch (error) {
            console.error('Error reading from Arduino:', error);
            this.isConnected = false;
            if (this.statusCallback) {
                this.statusCallback('error', error.message);
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

    // Set callback for status changes
    onStatusChange(callback) {
        this.statusCallback = callback;
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
            await this.controller.disconnect();
        } else {
            try {
                this.updateStatus('connecting', 'Connecting...');
                this.connectButton.disabled = true;
                await this.controller.connect();
            } catch (error) {
                this.updateStatus('error', error.message);
            } finally {
                this.connectButton.disabled = false;
            }
        }
    }

    updateStatus(status, message) {
        const statusMap = {
            'connected': {
                indicator: 'connected',
                text: 'Arduino Connected',
                buttonText: 'Disconnect Arduino'
            },
            'disconnected': {
                indicator: 'disconnected',
                text: 'Arduino Disconnected',
                buttonText: 'Connect Arduino'
            },
            'connecting': {
                indicator: 'connecting',
                text: 'Connecting...',
                buttonText: 'Connecting...'
            },
            'error': {
                indicator: 'error',
                text: message || 'Connection Error',
                buttonText: 'Connect Arduino'
            },
            'unsupported': {
                indicator: 'error',
                text: message || 'Not Supported',
                buttonText: 'Not Available'
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
        }
    }
}

// Export for use in SlotMachine.js
window.ArduinoController = ArduinoController;
window.ArduinoUI = ArduinoUI;

