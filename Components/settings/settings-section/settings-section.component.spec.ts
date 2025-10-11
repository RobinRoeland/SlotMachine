import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionComponent } from './settings-section.component';

describe('SettingsSectionComponent', () => {
  let component: SettingsSectionComponent;
  let fixture: ComponentFixture<SettingsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and description', () => {
    component.title = 'Test Section';
    component.description = 'Test Description';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Section');
    expect(compiled.querySelector('.info-text')?.textContent).toContain('Test Description');
  });
});
