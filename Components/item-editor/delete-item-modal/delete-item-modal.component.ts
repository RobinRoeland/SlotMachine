import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotItem } from '../../../Services/items.service';

@Component({
  selector: 'delete-item-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-item-modal.component.html',
  styleUrl: './delete-item-modal.component.scss'
})
export class DeleteItemModalComponent {
  @Input() show: boolean = false;
  @Input() items: SlotItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  onClose() {
    this.close.emit();
  }

  onDeleteItem(itemName: string) {
    this.confirm.emit(itemName);
  }
}
