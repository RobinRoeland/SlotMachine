import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface FilePickerOptions {
  accept?: { [mimeType: string]: string[] };
  description?: string;
}

/**
 * Service for file operations (import/export)
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Check if File System Access API is supported
   */
  isFilePickerSupported(): boolean {
    return this.isBrowser && 'showOpenFilePicker' in window;
  }

  /**
   * Open file picker and read JSON file
   */
  async importJSON(): Promise<any> {
    if (!this.isFilePickerSupported()) {
      throw new Error('File picker not supported in this browser. Please paste JSON manually.');
    }

    try {
      const handles = await (window as any).showOpenFilePicker({
        types: [{
          description: 'JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });
      
      const file = await handles[0].getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('File selection cancelled');
      }
      throw new Error(`Failed to load file: ${err.message || String(err)}`);
    }
  }

  /**
   * Export data as JSON file
   */
  exportJSON(data: any, filename: string = 'export.json'): void {
    if (!this.isBrowser) {
      throw new Error('Export not available on server side');
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (err: any) {
      throw new Error(`Failed to export file: ${err.message || String(err)}`);
    }
  }

  /**
   * Read file as data URL (for images)
   */
  async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Read file as text
   */
  async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
}
