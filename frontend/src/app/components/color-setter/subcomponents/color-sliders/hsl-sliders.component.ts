import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  signal,
  effect,
} from '@angular/core';
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
  hslValues = input<[number, number, number]>([0, 100, 50]);

  // Individual signals for easier template binding
  h = signal(0);
  s = signal(100);
  l = signal(50);

  @Output() hslValuesChange = new EventEmitter<[number, number, number]>();
  @Output() hslInput = new EventEmitter<[number, number, number]>();
  @Output() hslChange = new EventEmitter<[number, number, number]>();

  protected Math = Math;

  constructor() {
    // Sync individual values with input array
    const [h, s, l] = this.hslValues();
    this.h.set(h);
    this.s.set(s);
    this.l.set(l);

    // Effect to sync with input changes
    effect(() => {
      const [h, s, l] = this.hslValues();
      this.h.set(h);
      this.s.set(s);
      this.l.set(l);
    });
  }

  onHslInput(): void {
    const values: [number, number, number] = [this.h(), this.s(), this.l()];
    this.hslInput.emit(values);
  }

  onHslChange(): void {
    const values: [number, number, number] = [this.h(), this.s(), this.l()];
    this.hslValuesChange.emit(values);
    this.hslChange.emit(values);
  }
}
