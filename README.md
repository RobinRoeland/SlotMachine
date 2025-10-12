# SlotMachine

**Check out a demo of our project at: [Github Pages](https://robinroeland.github.io/SlotMachine/game)!**

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

**New to our project?** Please check out the wiki to get started!

### Features
- ✅ Control slot machine via Arduino (button press, sensors, etc.)
- ✅ Real-time serial communication using Web Serial API
- ✅ Win/loss results sent back to Arduino
- ✅ Browser-based connection (Chrome, Edge, Opera)
- ✅ Settings-based toggle for Arduino control

## 🏗️ Project Structure

### Services
The application uses a service-oriented architecture with the following core services:

- **ItemsService** - Manages slot items with reactive updates
- **ValidationService** - Centralizes validation logic
- **FileService** - Handles file import/export operations
- **PrizeService** - Manages prizes and prize calculations
- **OddsService** - Manages item odds and probabilities
- **SettingsService** - Application settings management
- **StorageService** - LocalStorage wrapper with observables

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
