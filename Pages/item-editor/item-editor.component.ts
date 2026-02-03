import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ItemsService } from '../../Services/items.service';
import { ValidationService } from '../../Services/validation.service';
import { FileService } from '../../Services/file.service';
import { ItemsJsonEditorComponent } from '../../Components/item-editor/items-json-editor/items-json-editor.component';
import { SlotMachineRollerComponent, Item } from '../../Components/slot-machine/slot-machine-roller/slot-machine-roller.component';
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

    // Resize image before storing to reduce memory usage
    this.resizeImage(data.imageFile, 256, 256, (resizedDataUrl) => {
      try {
        const current = this.itemsService.getItems();
        
        current.push({
          name: data.name,
          imageSrc: resizedDataUrl
        });
        
        // Auto-save the new item
        this.itemsService.setItems(current);
        this.itemsJson = JSON.stringify(current, null, 2);
        this.parseItems();
        this.showAddModal = false;
      } catch (err: any) {
        this.addItemError = err.message || String(err);
      }
    });
  }

  /**
   * Resize an image file to a maximum width/height while maintaining aspect ratio
   * @param file The image file to resize
   * @param maxWidth Maximum width in pixels
   * @param maxHeight Maximum height in pixels
   * @param callback Function to call with the resized data URL
   */
  private resizeImage(file: File, maxWidth: number, maxHeight: number, callback: (dataUrl: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to data URL with quality compression
          const resizedDataUrl = canvas.toDataURL('image/png', 0.9);
          callback(resizedDataUrl);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
