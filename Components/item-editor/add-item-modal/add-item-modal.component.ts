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
  imagePreview: string | null = null;
  isDragging: boolean = false;

  onClose() {
    this.newItemName = '';
    this.newItemImage = null;
    this.imagePreview = null;
    this.close.emit();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only enable drag on non-mobile devices
    if (this.isMobileDevice()) {
      return;
    }
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    // Disable drag&drop on mobile
    if (this.isMobileDevice()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleFile(file);
      }
    }
  }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }

  handleFile(file: File) {
    this.newItemImage = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.newItemImage = null;
    this.imagePreview = null;
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
    this.imagePreview = null;
  }
}
