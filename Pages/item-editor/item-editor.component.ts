import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ItemsService } from '../../Services/items.service';
import { ValidationService } from '../../Services/validation.service';
import { FileService } from '../../Services/file.service';
import { ItemsJsonEditorComponent } from '../../Components/item-editor/items-json-editor/items-json-editor.component';
import { SlotMachineRollerComponent, Item } from '../../Components/machine/slot-machine-roller/slot-machine-roller.component';
import { ItemsGridComponent } from '../../Components/items/items-grid/items-grid.component';
import { AddItemModalComponent, AddItemData } from '../../Components/item-editor/add-item-modal/add-item-modal.component';
import { DeleteItemModalComponent } from '../../Components/item-editor/delete-item-modal/delete-item-modal.component';

@Component({
  selector: 'app-item-editor',
  standalone: true,
  imports: [
    CommonModule,
    ItemsJsonEditorComponent,
    SlotMachineRollerComponent,
    ItemsGridComponent,
    AddItemModalComponent,
    DeleteItemModalComponent
  ],
  templateUrl: './item-editor.component.html',
  styleUrl: './item-editor.component.scss'
})
export class ItemEditorComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  items: Item[] = [];
  itemsJson: string = '[]';
  itemsError: string = '';
  showSaved: boolean = false;

  showAddModal: boolean = false;
  showDeleteModal: boolean = false;
  addItemError: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private itemsService: ItemsService,
    private validationService: ValidationService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    // Load items from ItemsService
    const items = this.itemsService.getItems();
    // Ensure we display '[]' instead of 'null' when localStorage is empty
    this.itemsJson = JSON.stringify(items || [], null, 2);
    this.parseItems();

    // Watch for changes from other components
    this.itemsService.items$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        const newJson = JSON.stringify(items, null, 2);
        this.itemsJson = newJson;
        this.parseItems();
      });

    // Subscribe to saved indicator
    this.itemsService.saved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(saved => {
        this.showSaved = saved;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  parseItems() {
    try {
      const parsed = JSON.parse(this.itemsJson || '[]');
      if (Array.isArray(parsed)) {
        this.items = parsed.map((item: any) => ({
          name: item.name,
          imageSrc: item.imageSrc || item.img
        }));
      } else {
        this.items = [];
      }
      this.itemsError = '';
    } catch (e) {
      this.items = [];
    }
  }

  async loadItems() {
    this.itemsError = '';
    try {
      const data = await this.fileService.importJSON();
      
      // Validate the imported data
      const result = this.validationService.validateItemsArray(data);
      if (!result.valid) {
        throw new Error(result.error);
      }
      
      // Auto-save the loaded items
      this.itemsService.setItems(data);
      this.itemsJson = JSON.stringify(data, null, 2);
      this.parseItems();
    } catch (err: any) {
      this.itemsError = err.message || String(err);
    }
  }

  exportItems() {
    if (!this.isBrowser) {
      return;
    }
    
    this.itemsError = '';
    try {
      const items = JSON.parse(this.itemsJson);
      if (!Array.isArray(items)) {
        throw new Error('JSON must be an array');
      }
      
      this.fileService.exportJSON(items, 'items.json');
    } catch (err: any) {
      this.itemsError = err.message || String(err);
    }
  }

  openAddModal() {
    this.showAddModal = true;
    this.addItemError = '';
  }

  closeAddModal() {
    this.showAddModal = false;
    this.addItemError = '';
  }

  confirmAddItem(data: AddItemData) {
    this.addItemError = '';
    
    // Validate using ValidationService
    const currentItems = this.itemsService.getItems();
    const validation = this.validationService.validateNewItem(data.name, data.imageFile, currentItems);
    
    if (!validation.valid) {
      this.addItemError = validation.error || 'Validation failed';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const current = this.itemsService.getItems();
        
        current.push({
          name: data.name,
          imageSrc: e.target.result
        });
        
        // Auto-save the new item
        this.itemsService.setItems(current);
        this.itemsJson = JSON.stringify(current, null, 2);
        this.parseItems();
        this.showAddModal = false;
      } catch (err: any) {
        this.addItemError = err.message || String(err);
      }
    };
    
    reader.readAsDataURL(data.imageFile);
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  deleteItem(itemName: string) {
    const current = this.itemsService.getItems();
    const filtered = current.filter(item => item.name !== itemName);
    
    // Auto-save after deletion
    this.itemsService.setItems(filtered);
    this.itemsJson = JSON.stringify(filtered, null, 2);
    this.parseItems();
    this.closeDeleteModal();
  }
}
