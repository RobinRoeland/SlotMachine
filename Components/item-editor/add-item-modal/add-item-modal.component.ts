import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AddItemData {
  name: string;
  imageFile: File;
}

@Component({
  selector: 'add-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-item-modal.component.html',
  styleUrl: './add-item-modal.component.scss'
})
export class AddItemModalComponent {
  @Input() show: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<AddItemData>();

  newItemName: string = '';
  newItemImage: File | null = null;

  onClose() {
    this.newItemName = '';
    this.newItemImage = null;
    this.close.emit();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newItemImage = input.files[0];
    }
  }

  onConfirm() {
    if (!this.newItemName.trim()) {
      return;
    }
    
    if (!this.newItemImage) {
      return;
    }

    this.confirm.emit({
      name: this.newItemName.trim(),
      imageFile: this.newItemImage
    });

    this.newItemName = '';
    this.newItemImage = null;
  }
}
