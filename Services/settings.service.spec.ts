import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default settings', () => {
    const settings = service.getSettings();
    expect(settings.showPrizesList).toBe(true);
    expect(settings.showOdds).toBe(true);
    expect(settings.enableArduinoControl).toBe(false);
    expect(settings.enablePitySystem).toBe(false);
  });

  it('should update a setting', () => {
    service.updateSetting('enablePitySystem', true);
    const settings = service.getSettings();
    expect(settings.enablePitySystem).toBe(true);
  });

  it('should disable odds when prizes list is disabled', () => {
    service.updateSetting('showPrizesList', false);
    const settings = service.getSettings();
    expect(settings.showPrizesList).toBe(false);
    expect(settings.showOdds).toBe(false);
  });
});
