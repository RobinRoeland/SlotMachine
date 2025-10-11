import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotItem } from '../../../Services/items.service';

export interface PatternSlot {
  index: number;
  item: SlotItem | '*' | null;
}

@Component({
  selector: 'app-prize-pattern-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prize-pattern-builder.component.html',
  styleUrl: './prize-pattern-builder.component.scss'
})
export class PrizePatternBuilderComponent implements OnInit, OnChanges {
  @Input() rollerCount = 4;
  @Input() items: SlotItem[] = [];
  @Output() patternChange = new EventEmitter<(SlotItem | '*' | null)[]>();
  
  slots: PatternSlot[] = [];

  ngOnInit(): void {
    this.initializeSlots();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rollerCount']) {
      this.initializeSlots();
    }
  }

  private initializeSlots(): void {
    this.slots = [];
    for (let i = 0; i < this.rollerCount; i++) {
      this.slots.push({ index: i, item: null });
    }
    this.emitPattern();
  }

  onDragStart(event: DragEvent, item: SlotItem | '*'): void {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify(item));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragEnter(event: DragEvent, slot: PatternSlot): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, slot: PatternSlot): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    const data = event.dataTransfer?.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      slot.item = item;
      this.emitPattern();
    }
  }

  clearSlot(slot: PatternSlot): void {
    slot.item = null;
    this.emitPattern();
  }

  private emitPattern(): void {
    const pattern = this.slots.map(slot => slot.item);
    this.patternChange.emit(pattern);
  }

  getItemName(item: SlotItem | '*' | null): string {
    if (item === '*') return '*';
    if (item && typeof item === 'object' && 'name' in item) return item.name;
    return '';
  }

  getItemImage(item: SlotItem | '*' | null): string {
    if (item && typeof item === 'object' && 'imageSrc' in item) return item.imageSrc;
    return '';
  }

  isWildcard(item: SlotItem | '*' | null): boolean {
    return item === '*';
  }

  isItem(item: SlotItem | '*' | null): boolean {
    return item !== null && item !== '*' && typeof item === 'object';
  }
}
