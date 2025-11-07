import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() hexValue: string = '#FF0000';
  @Output() hexValueChange = new EventEmitter<string>();
  @Output() hexChange = new EventEmitter<string>();

  onHexChange(): void {
    this.hexValueChange.emit(this.hexValue);
    this.hexChange.emit(this.hexValue);
  }
}
