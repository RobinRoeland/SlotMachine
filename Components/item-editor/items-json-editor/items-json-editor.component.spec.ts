import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsJsonEditorComponent } from './items-json-editor.component';

describe('ItemsJsonEditorComponent', () => {
  let component: ItemsJsonEditorComponent;
  let fixture: ComponentFixture<ItemsJsonEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsJsonEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemsJsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
