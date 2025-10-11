import { TestBed } from '@angular/core/testing';
import { PrizePatternBuilderComponent } from './prize-pattern-builder.component';

describe('PrizePatternBuilderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrizePatternBuilderComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PrizePatternBuilderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
