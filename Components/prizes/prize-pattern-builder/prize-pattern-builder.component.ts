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
  showItemPicker = false;
  selectedSlot: PatternSlot | null = null;

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

  onSlotClick(slot: PatternSlot): void {
    this.selectedSlot = slot;
    this.showItemPicker = true;
  }

  onItemSelect(item: SlotItem | '*'): void {
    if (this.selectedSlot) {
      this.selectedSlot.item = item;
      this.emitPattern();
    }
    this.closeItemPicker();
  }

  closeItemPicker(): void {
    this.showItemPicker = false;
    this.selectedSlot = null;
  }

  clearSlot(slot: PatternSlot, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
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
