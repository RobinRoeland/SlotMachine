import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OddsSettingsComponent } from './odds-settings.component';

describe('OddsSettingsComponent', () => {
  let component: OddsSettingsComponent;
  let fixture: ComponentFixture<OddsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OddsSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OddsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
