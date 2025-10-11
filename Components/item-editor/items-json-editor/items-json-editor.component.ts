import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'items-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './items-json-editor.component.html',
  styleUrl: './items-json-editor.component.scss'
})
export class ItemsJsonEditorComponent {
  @Input() itemsJson: string = '[]';
  @Input() isDirty: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() jsonChange = new EventEmitter<string>();
  @Output() apply = new EventEmitter<void>();
  @Output() load = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<void>();

  onJsonChange(value: string) {
    this.jsonChange.emit(value);
  }

  onApply() {
    this.apply.emit();
  }

  onLoad() {
    this.load.emit();
  }

  onExport() {
    this.export.emit();
  }

  onAddItem() {
    this.addItem.emit();
  }
}
