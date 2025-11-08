import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * HexInputComponent - Subcomponent for HEX color input
 * Provides text input for HEX color values with validation
 *
 * Component adheres to Constitution Principle VII:
 * - Separate .ts, .html, and .scss files
 * - TypeScript class with pure component logic
 * - Semantic HTML template without style classes
 * - All styling in separate .scss file
 */
@Component({
  selector: 'app-hex-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './hex-input.component.html',
  styleUrl: './hex-input.component.scss',
})
export class HexInputComponent {
  hexValue = input<string>('#FF0000');
  internalHexValue = signal('#FF0000');
  @Output() hexValueChange = new EventEmitter<string>();
  @Output() hexChange = new EventEmitter<string>();

  constructor() {
    // Sync internal value with input
    this.internalHexValue.set(this.hexValue());

    // Effect to sync with input changes
    effect(() => {
      this.internalHexValue.set(this.hexValue());
    });
  }

  onHexChange(): void {
    const value = this.internalHexValue();
    this.hexValueChange.emit(value);
    this.hexChange.emit(value);
  }
}
