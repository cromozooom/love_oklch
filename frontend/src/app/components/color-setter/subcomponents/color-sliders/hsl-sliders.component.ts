import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * HslSlidersComponent - Subcomponent for HSL color sliders
 * Provides three sliders for H (0-360), S (0-100), L (0-100)
 *
 * Component adheres to Constitution Principle VII:
 * - Separate .ts, .html, and .scss files
 * - TypeScript class with pure component logic
 * - Semantic HTML template without style classes
 * - All styling in separate .scss file
 */
@Component({
  selector: 'app-hsl-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hsl-sliders.component.html',
  styleUrl: './hsl-sliders.component.scss',
})
export class HslSlidersComponent {
  @Input() hslValues: [number, number, number] = [0, 100, 50];
  @Output() hslValuesChange = new EventEmitter<[number, number, number]>();
  @Output() hslInput = new EventEmitter<[number, number, number]>();
  @Output() hslChange = new EventEmitter<[number, number, number]>();

  protected Math = Math;

  onHslInput(): void {
    this.hslInput.emit([
      this.hslValues[0],
      this.hslValues[1],
      this.hslValues[2],
    ]);
  }

  onHslChange(): void {
    this.hslValuesChange.emit([
      this.hslValues[0],
      this.hslValues[1],
      this.hslValues[2],
    ]);
    this.hslChange.emit([
      this.hslValues[0],
      this.hslValues[1],
      this.hslValues[2],
    ]);
  }
}
