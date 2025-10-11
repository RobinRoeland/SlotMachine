import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrizesSidebarComponent } from './prizes-sidebar.component';

describe('PrizesSidebarComponent', () => {
  let component: PrizesSidebarComponent;
  let fixture: ComponentFixture<PrizesSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizesSidebarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrizesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
