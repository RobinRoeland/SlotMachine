/*
 * Arduino Slot Machine Controller Example
 * 
 * This sketch demonstrates how to control the slot machine from Arduino.
 * It can trigger rolls using a button and display results on serial monitor.
 * 
 * Hardware Setup:
 * - Connect a button to pin 2 (with internal pull-up)
 * - Connect a blue/yellow LED to pin 11 (for connection status)
 * - Connect an LED to pin 10 (for button cooldown indicator - optional)
 * 
 * Serial Communication:
 * - Baud rate: 9600
 * - Commands to send: "ROLL", "SPIN", "START", "PING", "STATUS"
 * - Responses received: "CONNECTED", "DISCONNECT", "WIN:prize", "LOSE", "PONG"
 * - Keepalive: Browser sends PING every 2s to maintain connection
 * - Timeout: Arduino disconnects after 3s of no data (dirty disconnect detection)
 * 
 * Button Behavior:
 * - Quick tap triggers roll (no need to hold)
 * - Dynamic cooldown: 7.2s for wins (includes message), 4.2s for losses
 * - 20ms debounce for clean detection
 * 
 * LED Behavior:
 * - Status LED (pin 11): ON = Connected, OFF = Disconnected
 * - Cooldown LED (pin 10): ON during cooldown (4.2s or 7.2s), OFF when ready
 * 
 * Results are displayed in Serial Monitor (9600 baud):
 * - "YOU WON: [prize name]" for wins
 * - "Better luck next time!" for losses
 */

// Pin definitions
const int BUTTON_PIN = 2;      // Button to trigger roll
const int STATUS_LED = 11;     // Blue/Yellow LED for connection status
const int COOLDOWN_LED = 10;   // LED to show button cooldown period

// Button state tracking
int lastButtonState = HIGH;
bool buttonPressed = false; // Track if we've already registered this press
unsigned long lastButtonPressTime = 0;
const unsigned long BUTTON_COOLDOWN_WIN = 7200; // Cooldown for wins (4s roll + 3s message)
const unsigned long BUTTON_COOLDOWN_LOSE = 4200; // Cooldown for losses (4s roll only)
unsigned long currentCooldown = BUTTON_COOLDOWN_LOSE; // Default to shorter cooldown

// Connection status
bool isConnected = false;
unsigned long lastSerialReceiveTime = 0;
const unsigned long CONNECTION_TIMEOUT = 3000; // Disconnect if no data for 3 seconds

// LED display timing
unsigned long cooldownLedTime = 0;

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Initialize pins
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(COOLDOWN_LED, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(STATUS_LED, LOW);
  digitalWrite(COOLDOWN_LED, LOW);
  
  // Wait for serial connection
  while (!Serial) {
    ; // Wait for serial port to connect
  }
  
  Serial.println("Arduino Slot Machine Controller Ready");
  Serial.println("Waiting for connection...");
}

void loop() {
  // Check for button press
  checkButton();
  
  // Check for incoming serial data
  checkSerial();
  
  // Update LED display
  updateLEDs();
}

void checkButton() {
  // Read button state
  int reading = digitalRead(BUTTON_PIN);
  
  // Detect button press on falling edge (HIGH to LOW transition)
  if (reading == LOW && lastButtonState == HIGH) {
    // Small delay for debounce
    delay(20);
    
    // Verify button is still pressed after debounce
    if (digitalRead(BUTTON_PIN) == LOW && !buttonPressed) {
      // Check cooldown to prevent rapid repeated presses
      unsigned long currentTime = millis();
      if (currentTime - lastButtonPressTime >= currentCooldown) {
        // Send roll command
        Serial.println("ROLL");
        Serial.println("Button pressed - Roll command sent!");
        
        // Update last press time and mark as pressed
        lastButtonPressTime = currentTime;
        buttonPressed = true;
        
        // Turn on cooldown LED to show button is on cooldown
        cooldownLedTime = currentTime;
        digitalWrite(COOLDOWN_LED, HIGH);
        
        // Reset to default cooldown (will be updated by WIN/LOSE message)
        currentCooldown = BUTTON_COOLDOWN_LOSE;
      } else {
        Serial.println("Button on cooldown!");
      }
    }
  }
  // Reset pressed flag when button is released
  else if (reading == HIGH && lastButtonState == LOW) {
    buttonPressed = false;
  }
  
  lastButtonState = reading;
}

void checkSerial() {
  // Check if data is available
  if (Serial.available() > 0) {
    lastSerialReceiveTime = millis(); // Update last receive time
    
    // Read the incoming string until newline
    String message = Serial.readStringUntil('\n');
    message.trim();
    
    // Process the message
    if (message.length() > 0) {
      Serial.print("Received: ");
      Serial.println(message);
      
      // Check for specific messages
      if (message == "CONNECTED") {
        isConnected = true;
        lastSerialReceiveTime = millis(); // Reset timeout timer
        digitalWrite(STATUS_LED, HIGH);
        Serial.println("Connected to slot machine!");
      }
      else if (message.startsWith("WIN:")) {
        // Extract prize name
        String prize = message.substring(4);
        Serial.print("YOU WON: ");
        Serial.println(prize);
        // Set longer cooldown for wins (includes 3s message display)
        currentCooldown = BUTTON_COOLDOWN_WIN;
      }
      else if (message == "WIN") {
        Serial.println("YOU WON!");
        // Set longer cooldown for wins (includes 3s message display)
        currentCooldown = BUTTON_COOLDOWN_WIN;
      }
      else if (message == "LOSE") {
        Serial.println("Better luck next time!");
        // Set shorter cooldown for losses (no extended message)
        currentCooldown = BUTTON_COOLDOWN_LOSE;
      }
      else if (message == "PONG") {
        Serial.println("Connection OK (Pong received)");
      }
      else if (message.startsWith("STATUS:")) {
        String status = message.substring(7);
        Serial.print("Status: ");
        Serial.println(status);
      }
      else if (message == "DISCONNECT" || message == "DISCONNECTED") {
        // Explicit disconnect command
        isConnected = false;
        digitalWrite(STATUS_LED, LOW);
        Serial.println("Disconnected from slot machine!");
        
        // Flush any remaining data and clear serial buffer
        Serial.flush();
        while (Serial.available() > 0) {
          Serial.read(); // Clear buffer
        }
      }
    }
  }
  
  // Detect disconnection when serial connection is lost
  // This works on most Arduino boards when the browser/serial monitor disconnects
  if (isConnected) {
    unsigned long currentTime = millis();
    
    #if defined(__AVR_ATmega32U4__) || defined(__AVR_ATmega16U4__)
      // Leonardo, Micro, Pro Micro - Serial becomes false when disconnected
      if (!Serial) {
        isConnected = false;
        digitalWrite(STATUS_LED, LOW);
        Serial.println("Connection lost (Serial port closed)");
        Serial.begin(9600); // Restart serial for next connection
      }
    #else
      // For Uno/Nano: Use timeout-based detection
      // If no data received for CONNECTION_TIMEOUT, assume disconnected
      // This catches page refreshes and crashes
      if (currentTime - lastSerialReceiveTime > CONNECTION_TIMEOUT) {
        isConnected = false;
        digitalWrite(STATUS_LED, LOW);
        Serial.println("Connection lost (timeout - dirty disconnect detected)");
        // Reset timer to prevent spam
        lastSerialReceiveTime = currentTime;
      }
    #endif
  }
}

void updateLEDs() {
  // Turn off cooldown LED after button cooldown period (uses current cooldown duration)
  if (cooldownLedTime > 0 && (millis() - cooldownLedTime) > currentCooldown) {
    digitalWrite(COOLDOWN_LED, LOW);
    cooldownLedTime = 0;
  }
}

// Alternative: Simple example without LEDs
/*
void simpleLoop() {
  // Check for button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(200); // Simple debounce
    Serial.println("ROLL");
  }
  
  // Check for responses
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    Serial.println(message);
  }
}
*/

