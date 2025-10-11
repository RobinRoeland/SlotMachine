import { Injectable } from '@angular/core';
import { SlotItem } from './items.service';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

/**
 * Service for validating data structures
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Validate and parse JSON string
   */
  parseJSON(jsonString: string): ValidationResult {
    try {
      const parsed = JSON.parse(jsonString);
      return { valid: true, data: parsed };
    } catch (e: any) {
      return { 
        valid: false, 
        error: `Invalid JSON: ${e.message || String(e)}` 
      };
    }
  }

  /**
   * Validate items array structure
   */
  validateItemsArray(data: any): ValidationResult {
    if (!Array.isArray(data)) {
      return { 
        valid: false, 
        error: 'JSON must be an array' 
      };
    }

    // Validate each item has required fields
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item !== 'object' || !item) {
        return { 
          valid: false, 
          error: `Item at index ${i} must be an object` 
        };
      }
      
      if (!('name' in item) || typeof item.name !== 'string') {
        return { 
          valid: false, 
          error: `Item at index ${i} is missing 'name' field` 
        };
      }
      
      if (!('imageSrc' in item) && !('img' in item)) {
        return { 
          valid: false, 
          error: `Item at index ${i} is missing 'imageSrc' or 'img' field` 
        };
      }
    }

    return { valid: true, data };
  }

  /**
   * Normalize items - convert old format to new format
   */
  normalizeItems(items: any[]): SlotItem[] {
    return items.map((item: any) => ({
      name: String(item.name),
      imageSrc: String(item.imageSrc || item.img)
    }));
  }

  /**
   * Check for duplicate item names
   */
  findDuplicateNames(items: SlotItem[]): string[] {
    const nameSet = new Set<string>();
    const duplicates: string[] = [];
    
    items.forEach((item) => {
      if (nameSet.has(item.name)) {
        if (!duplicates.includes(item.name)) {
          duplicates.push(item.name);
        }
      } else {
        nameSet.add(item.name);
      }
    });
    
    return duplicates;
  }

  /**
   * Validate and process items from JSON string
   */
  validateAndParseItems(jsonString: string): ValidationResult {
    // Parse JSON
    const parseResult = this.parseJSON(jsonString);
    if (!parseResult.valid) {
      return parseResult;
    }

    // Validate array structure
    const arrayResult = this.validateItemsArray(parseResult.data);
    if (!arrayResult.valid) {
      return arrayResult;
    }

    // Normalize items
    const normalized = this.normalizeItems(arrayResult.data);

    // Check for duplicates
    const duplicates = this.findDuplicateNames(normalized);
    if (duplicates.length > 0) {
      return {
        valid: false,
        error: `Duplicate item names found: ${duplicates.join(', ')}. Each item must have a unique name.`
      };
    }

    return { valid: true, data: normalized };
  }

  /**
   * Validate a single new item
   */
  validateNewItem(name: string, imageFile: File | null, existingItems: SlotItem[]): ValidationResult {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Name is required' };
    }

    if (!imageFile) {
      return { valid: false, error: 'Image is required' };
    }

    // Check for duplicate name
    if (existingItems.some(item => item.name === name)) {
      return { valid: false, error: `An item with the name "${name}" already exists` };
    }

    return { valid: true };
  }
}
