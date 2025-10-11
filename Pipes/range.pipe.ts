import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'range',
  standalone: true
})
export class RangePipe implements PipeTransform {
  transform(value: number): number[] {
    return Array.from({ length: value }, (_, i) => i);
  }
}