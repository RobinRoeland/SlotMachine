import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingItemComponent } from './setting-item.component';

describe('SettingItemComponent', () => {
  let component: SettingItemComponent;
  let fixture: ComponentFixture<SettingItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and description', () => {
    component.title = 'Test Title';
    component.description = 'Test Description';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toContain('Test Title');
    expect(compiled.querySelector('p')?.textContent).toContain('Test Description');
  });
});
