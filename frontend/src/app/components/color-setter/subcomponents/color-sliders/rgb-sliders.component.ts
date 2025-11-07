import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * RgbSlidersComponent - Subcomponent for RGB color sliders
 * Provides three sliders for R, G, B channels (0-255)
 *
 * Component adheres to Constitution Principle VII:
 * - Separate .ts, .html, and .scss files
 * - TypeScript class with pure component logic
 * - Semantic HTML template without style classes
 * - All styling in separate .scss file
 */
@Component({
  selector: 'app-rgb-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rgb-sliders.component.html',
  styleUrl: './rgb-sliders.component.scss',
})
export class RgbSlidersComponent {
  @Input() rgbValues: [number, number, number] = [255, 0, 0];
  @Output() rgbValuesChange = new EventEmitter<[number, number, number]>();
  @Output() rgbInput = new EventEmitter<[number, number, number]>();
  @Output() rgbChange = new EventEmitter<[number, number, number]>();

  protected Math = Math;

  onRgbInput(): void {
    this.rgbInput.emit([
      this.rgbValues[0],
      this.rgbValues[1],
      this.rgbValues[2],
    ]);
  }

  onRgbChange(): void {
    this.rgbValuesChange.emit([
      this.rgbValues[0],
      this.rgbValues[1],
      this.rgbValues[2],
    ]);
    this.rgbChange.emit([
      this.rgbValues[0],
      this.rgbValues[1],
      this.rgbValues[2],
    ]);
  }
}
