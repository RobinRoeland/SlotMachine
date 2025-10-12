import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    // Convert newlines to <br> tags
    const formatted = value.replace(/\n/g, '<br>');
    return this.sanitizer.sanitize(1, formatted) || '';
  }
}
