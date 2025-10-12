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
  @Input() showSaved: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() load = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<void>();
  @Output() deleteItem = new EventEmitter<void>();

  /**
   * Get the items JSON to display, ensuring it never shows 'null'
   */
  get displayJson(): string {
    return this.itemsJson || '[]';
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

  onDeleteItem() {
    this.deleteItem.emit();
  }
}
