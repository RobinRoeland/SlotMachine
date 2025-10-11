import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BaseComponent } from './base.component';

@Component({
  template: ''
})
class TestComponent extends BaseComponent {}

describe('BaseComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: []
    });
    component = new TestComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have destroy$ subject', () => {
    expect(component['destroy$']).toBeDefined();
  });

  it('should complete destroy$ on destroy', () => {
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(completeSpy).toHaveBeenCalled();
  });
});
