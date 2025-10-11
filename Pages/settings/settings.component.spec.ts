import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../Services/settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [SettingsService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(component.settings).toBeDefined();
  });

  it('should update settings when toggles are changed', () => {
    spyOn(settingsService, 'updateSetting');
    component.onShowPrizesListChange(false);
    expect(settingsService.updateSetting).toHaveBeenCalledWith('showPrizesList', false);
  });

  it('should disable odds when prizes list is disabled', () => {
    component.onShowPrizesListChange(false);
    fixture.detectChanges();
    expect(component.isOddsDisabled).toBe(true);
  });
});
