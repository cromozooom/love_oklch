import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * HexInputComponent - Subcomponent for HEX color input
 * Provides text input for HEX color values with validation
 */
@Component({
  selector: 'app-hex-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="hex-controls">
      <div class="input-group">
        <label for="hex-input" class="input-label">HEX Color</label>
        <input
          id="hex-input"
          type="text"
          [(ngModel)]="hexValue"
          (change)="onHexChange()"
          (blur)="onHexChange()"
          data-testid="hex-input"
          placeholder="#000000"
          class="hex-input"
          maxlength="7"
        />
      </div>
      <div class="hex-display" data-testid="hex-display">
        {{ hexValue }}
      </div>
    </div>
  `,
  styles: [
    `
      .hex-controls {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .input-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .hex-input {
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &:hover:not(:focus) {
          border-color: #9ca3af;
        }
      }

      .hex-display {
        padding: 0.5rem;
        background: #f9fafb;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        color: #6b7280;
      }
    `,
  ],
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
