import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OddsListComponent } from './odds-list.component';

describe('OddsListComponent', () => {
  let component: OddsListComponent;
  let fixture: ComponentFixture<OddsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OddsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OddsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
