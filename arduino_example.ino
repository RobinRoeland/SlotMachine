/*
 * Arduino Slot Machine Controller Example
 * 
 * This sketch demonstrates how to control the slot machine from Arduino.
 * It can trigger rolls using a button and display results on LEDs or serial monitor.
 * 
 * Hardware Setup:
 * - Connect a button to pin 2 (with internal pull-up)
 * - Connect a green LED to pin 13 (for wins)
 * - Connect a red LED to pin 12 (for losses)
 * - Connect a yellow LED to pin 11 (for connection status)
 * 
 * Serial Communication:
 * - Baud rate: 9600
 * - Commands to send: "ROLL", "SPIN", "START", "PING", "STATUS"
 * - Responses received: "CONNECTED", "WIN:prize", "LOSE", "PONG"
 */

// Pin definitions
const int BUTTON_PIN = 2;      // Button to trigger roll
const int WIN_LED = 13;        // Green LED for wins
const int LOSE_LED = 12;       // Red LED for losses  
const int STATUS_LED = 11;     // Yellow LED for connection status

// Button debouncing
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;
int lastButtonState = HIGH;
int buttonState = HIGH;

// Connection status
bool isConnected = false;

// LED display timing
unsigned long ledDisplayTime = 0;
const unsigned long LED_DISPLAY_DURATION = 3000; // 3 seconds

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Initialize pins
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(WIN_LED, OUTPUT);
  pinMode(LOSE_LED, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(WIN_LED, LOW);
  digitalWrite(LOSE_LED, LOW);
  digitalWrite(STATUS_LED, LOW);
  
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
  
  // Check if button state has changed
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }
  
  // If enough time has passed, check if state is stable
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If button state has changed
    if (reading != buttonState) {
      buttonState = reading;
      
      // If button is pressed (LOW because of pull-up)
      if (buttonState == LOW && isConnected) {
        // Send roll command
        Serial.println("ROLL");
        Serial.println("Button pressed - Roll command sent!");
        
        // Brief feedback on status LED
        digitalWrite(STATUS_LED, LOW);
        delay(100);
        digitalWrite(STATUS_LED, HIGH);
      }
    }
  }
  
  lastButtonState = reading;
}

void checkSerial() {
  // Check if data is available
  if (Serial.available() > 0) {
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
        digitalWrite(STATUS_LED, HIGH);
        Serial.println("Connected to slot machine!");
      }
      else if (message.startsWith("WIN:")) {
        // Extract prize name
        String prize = message.substring(4);
        Serial.print("YOU WON: ");
        Serial.println(prize);
        
        // Turn on win LED
        digitalWrite(WIN_LED, HIGH);
        digitalWrite(LOSE_LED, LOW);
        ledDisplayTime = millis();
      }
      else if (message == "WIN") {
        Serial.println("YOU WON!");
        digitalWrite(WIN_LED, HIGH);
        digitalWrite(LOSE_LED, LOW);
        ledDisplayTime = millis();
      }
      else if (message == "LOSE") {
        Serial.println("Better luck next time!");
        digitalWrite(LOSE_LED, HIGH);
        digitalWrite(WIN_LED, LOW);
        ledDisplayTime = millis();
      }
      else if (message == "PONG") {
        Serial.println("Connection OK (Pong received)");
      }
      else if (message.startsWith("STATUS:")) {
        String status = message.substring(7);
        Serial.print("Status: ");
        Serial.println(status);
      }
    }
  }
}

void updateLEDs() {
  // Turn off win/lose LEDs after display duration
  if (ledDisplayTime > 0 && (millis() - ledDisplayTime) > LED_DISPLAY_DURATION) {
    digitalWrite(WIN_LED, LOW);
    digitalWrite(LOSE_LED, LOW);
    ledDisplayTime = 0;
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

