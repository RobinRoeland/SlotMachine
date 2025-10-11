import { TestBed } from '@angular/core/testing';
import { PrizesComponent } from './prizes.component';

describe('PrizesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizesComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PrizesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
