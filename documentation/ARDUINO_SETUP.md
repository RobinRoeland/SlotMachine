# Arduino Slot Machine Control - Setup Guide

This guide explains how to control the slot machine using an Arduino board via USB serial connection.

## Features

- ✅ Trigger slot rolls from Arduino (button press, sensor, etc.)
- ✅ Receive win/lose results back to Arduino
- ✅ Display results on LEDs, LCD, or other outputs
- ✅ Real-time serial communication
- ✅ Easy browser-based connection (no drivers needed)

## Browser Requirements

The Arduino integration uses the **Web Serial API**, which is supported in:
- ✅ Google Chrome (v89+)
- ✅ Microsoft Edge (v89+)
- ✅ Opera (v76+)
- ❌ Firefox (not supported yet)
- ❌ Safari (not supported yet)

**Important:** Make sure you're using one of the supported browsers!

## Hardware Setup

### Basic Setup (Button Only)
1. Connect a push button between **pin 2** and **GND** on your Arduino
2. The sketch uses internal pull-up resistors, so no external resistor needed
3. **For 4-pin buttons**: See [BUTTON_WIRING_GUIDE.md](BUTTON_WIRING_GUIDE.md) for detailed wiring instructions

### Full Setup (with LEDs)
1. **Button**: Connect between pin 2 and GND
2. **Blue/Yellow LED** (Connection Status): Connect to pin 11 with 220Ω resistor
   - **ON** = Connected to browser
   - **OFF** = Disconnected
3. **LED** (Button Cooldown - Optional): Connect to pin 10 with 220Ω resistor
   - **ON** = Button on cooldown (4.2s for loss, 7.2s for win)
   - **OFF** = Button ready (can press now)

```
Arduino Pin Layout:
  Pin 2  → Button (with internal pull-up)
  Pin 10 → LED (Button Cooldown - optional, ON for 4.2s/7.2s, OFF when ready)
  Pin 11 → Blue/Yellow LED (Connection Status - ON when connected, OFF when disconnected)
  GND    → Common ground for all components
```

### LED Behavior Summary

| LED | Pin | Purpose | When ON | When OFF |
|-----|-----|---------|---------|----------|
| Status | 11 | Connection | Connected to browser | Disconnected |
| Cooldown | 10 | Button ready (optional) | Cooldown active (4.2s loss, 7.2s win) | Button ready to press |

**Note:** Win/loss results are displayed in the Serial Monitor, not on LEDs.

## Software Setup

### Step 1: Upload Arduino Sketch

1. Open `arduino_example.ino` in the Arduino IDE
2. Connect your Arduino board via USB
3. Select your board type: **Tools → Board → Arduino Uno** (or your board)
4. Select your COM port: **Tools → Port → COM[X]** (or /dev/ttyUSB[X] on Linux)
5. Click **Upload** button

### Step 2: Enable Arduino Control in Settings

1. Open `SlotMachine.html` in a supported browser (Chrome, Edge, or Opera)
2. Navigate to **Settings** from the sidebar
3. Find the **Arduino Control** section
4. Toggle **Enable Arduino Control** to ON
5. You'll see "✓ Settings saved"
6. Navigate back to **Prize Machine** from the sidebar

### Step 3: Connect Arduino

1. You should now see an "Arduino Disconnected" status at the top
2. Click the **Connect Arduino** button
3. A popup will appear asking you to select a serial port
4. Select your Arduino's COM port (usually shows as "Arduino Uno" or similar)
5. Click **Connect**
6. The status should change to "Arduino Connected" with a green indicator

### Step 4: Test the Connection

1. Notice the roll button is now hidden
2. A pulsing message appears: "Press the button to roll!"
3. Press the button connected to your Arduino
4. The slot machine should start rolling!
5. After the roll completes:
   - The instruction will show the result
   - Check the Arduino serial monitor:
     - If you won: "YOU WON: [prize name]"
     - If you lost: "Better luck next time!"
6. The instruction will resume pulsing, ready for the next roll

## Communication Protocol

### Commands (Arduino → Browser)

Send these commands from Arduino to control the slot machine:

| Command | Description | Example |
|---------|-------------|---------|
| `ROLL` | Trigger a slot roll | `Serial.println("ROLL");` |
| `SPIN` | Alternative command for roll | `Serial.println("SPIN");` |
| `START` | Another alternative for roll | `Serial.println("START");` |
| `PING` | Test connection (returns PONG) | `Serial.println("PING");` |
| `STATUS` | Request current status | `Serial.println("STATUS");` |

### Responses (Browser → Arduino)

The browser sends these responses back to Arduino:

| Response | Description | When Sent |
|----------|-------------|-----------|
| `CONNECTED` | Connection established | When Arduino first connects |
| `DISCONNECT` | Connection closing | When user clicks disconnect button |
| `WIN` | Roll resulted in a win | After winning roll |
| `WIN:[prize]` | Roll won with prize name | After winning roll with prize details |
| `LOSE` | Roll resulted in no win | After losing roll |
| `PONG` | Response to PING | When Arduino sends PING |
| `STATUS:READY` | System is ready | When Arduino requests status |

## Example Arduino Code

### Simple Button Example
```cpp
const int BUTTON_PIN = 2;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // Check if button is pressed
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("ROLL");
    delay(200); // Simple debounce
  }
  
  // Check for responses
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    // Do something with the message
    Serial.println(message);
  }
}
```

### Automatic Timer Example
```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  // Trigger a roll every 10 seconds
  Serial.println("ROLL");
  delay(10000);
}
```

### Sensor-Based Example
```cpp
const int PIR_SENSOR = 3; // Motion sensor

void setup() {
  Serial.begin(9600);
  pinMode(PIR_SENSOR, INPUT);
}

void loop() {
  // Trigger roll when motion is detected
  if (digitalRead(PIR_SENSOR) == HIGH) {
    Serial.println("ROLL");
    delay(5000); // Wait before detecting again
  }
}
```

## Troubleshooting

### "I don't see the Connect Arduino button"
- Go to **Settings** page
- Make sure **Enable Arduino Control** is toggled ON
- Return to the Prize Machine page
- The Arduino connection panel should now appear at the top

### "Web Serial API not supported"
- Make sure you're using Chrome, Edge, or Opera (not Firefox or Safari)
- Update your browser to the latest version

### "No port appears in the selection dialog"
- Make sure Arduino is connected via USB
- Check if Arduino appears in Arduino IDE (Tools → Port)
- Try a different USB cable
- On Windows, check Device Manager for COM ports
- On Linux, check `/dev/ttyUSB*` or `/dev/ttyACM*`

### "Stuck on 'Connecting...' and never connects"
- **Most common cause**: Close the Arduino Serial Monitor if it's open - only one program can connect at a time
- **Port in use**: Make sure no other program is using the COM port (PuTTY, Tera Term, etc.)
- **Wrong baud rate**: Verify your Arduino sketch uses `Serial.begin(9600)` (9600 baud)
- **Arduino not responding**: Try unplugging and replugging the Arduino
- **Connection timeout**: The browser will now timeout after 5 seconds - check browser console (F12) for error details
- **Driver issues**: On Windows, ensure Arduino drivers are installed
- If timeout occurs, try reconnecting - the Arduino resets when the serial port opens and needs a moment to boot up

### "Connection established but button doesn't work"
- Open Arduino Serial Monitor (set to 9600 baud)
- Check if "CONNECTED" message was received
- Press the button and verify "ROLL" appears in serial monitor
- If "ROLL" appears but nothing happens, check browser console for errors

### "Arduino keeps disconnecting"
- Close Arduino Serial Monitor (can't have both browser and IDE connected)
- Check USB cable quality
- Ensure stable power supply
- Check for loose connections

### Roll button works but Arduino doesn't trigger
- Verify button wiring (pin 2 to GND, NOT 5V with default code)
- Check if button is working in Arduino Serial Monitor
- Ensure code uploaded correctly
- Try uploading the sketch again
- See [BUTTON_WIRING_GUIDE.md](BUTTON_WIRING_GUIDE.md) for detailed wiring

### "Button press is too long" or multiple triggers
- ✅ **Fixed in updated code**: Dynamic cooldown (4.2s for loss, 7.2s for win)
- Cooldown matches actual roll + message display time
- Improved 20ms debounce for consistent button detection
- Upload the latest `arduino_example.ino` sketch
- Check button wiring - ensure good connections
- For 4-pin buttons, make sure you're using pins from different pairs

### "Arduino serial stops working after disconnect"
- ✅ **Fixed in updated code**: Serial buffer cleared on disconnect
- Arduino flushes data when receiving DISCONNECT message
- Should be able to reconnect without replugging
- If issue persists, wait 2-3 seconds before reconnecting

### "Blue LED stays on after page refresh/crash"
- ✅ **Fixed in updated code**: Timeout-based dirty disconnect detection
- Arduino detects disconnection after 3 seconds of no data
- Browser sends keepalive PING every 2 seconds when connected
- On page refresh/crash, Arduino detects within 3 seconds and turns off LED
- Works on all Arduino boards (Uno, Nano, Leonardo, Micro, etc.)

### LEDs not working
- Check LED polarity (long leg is positive)
- Verify resistor values (220Ω recommended)
- Test LEDs individually with simple blink sketch
- Check pin connections (10 for cooldown, 11 for status)

### "Status LED stays on after disconnect"
- ✅ **Fixed in updated code**: Arduino now receives DISCONNECT message
- Upload the latest `arduino_example.ino` sketch
- Status LED (pin 11) should turn OFF when you click "Disconnect Arduino" in browser
- LED should turn ON when connected, OFF when disconnected
- Status LED no longer blinks on button press (dedicated cooldown LED on pin 10 instead)

## Advanced Usage

### Custom Commands

You can modify `ArduinoControl.js` to add custom commands:

```javascript
case 'CUSTOM_COMMAND':
    // Your custom logic here
    break;
```

### Multiple Arduinos

To control the slot machine from multiple Arduinos:
1. Only one can be connected at a time via Web Serial
2. Alternative: Use a USB hub and multiplex in your Arduino code
3. Or: Set up multiple instances of the slot machine

### Integration with Other Hardware

The Arduino can trigger rolls based on:
- Motion sensors (PIR)
- RFID readers
- Distance sensors
- Light sensors  
- Sound sensors
- Touch sensors
- Any digital/analog input!

### Sending Data to External Displays

```cpp
#include <LiquidCrystal.h>
LiquidCrystal lcd(7, 8, 9, 10, 11, 12);

void setup() {
  Serial.begin(9600);
  lcd.begin(16, 2);
}

void loop() {
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    
    if (message.startsWith("WIN:")) {
      lcd.clear();
      lcd.print("YOU WON!");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(4));
    }
  }
}
```

## Safety Notes

- ⚠️ Always close Arduino Serial Monitor before connecting via browser
- ⚠️ Don't send commands too rapidly (may cause button to be disabled)
- ⚠️ Use appropriate resistors for LEDs to prevent damage
- ⚠️ Ensure proper power supply for your Arduino

## Support

For issues or questions:
1. Check browser console for JavaScript errors (F12)
2. Check Arduino Serial Monitor for communication issues
3. Verify all connections and code
4. Review this guide's troubleshooting section

## Technical Details

- **Baud Rate**: 9600
- **Protocol**: Text-based, newline-terminated commands
- **Connection**: Web Serial API (USB Serial)
- **Latency**: ~50-100ms typical response time
- **Browser API**: Web Serial API (https://web.dev/serial/)

---

**Happy Spinning! 🎰**

