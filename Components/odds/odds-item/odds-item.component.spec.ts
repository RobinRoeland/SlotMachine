import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OddsItemComponent } from './odds-item.component';

describe('OddsItemComponent', () => {
  let component: OddsItemComponent;
  let fixture: ComponentFixture<OddsItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OddsItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OddsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
