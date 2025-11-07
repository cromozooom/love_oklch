import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * RgbSlidersComponent - Subcomponent for RGB color sliders
 * Provides three sliders for R, G, B channels (0-255)
 */
@Component({
  selector: 'app-rgb-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rgb-controls" data-testid="rgb-sliders">
      <div class="slider-group">
        <label for="rgb-r" class="slider-label">Red</label>
        <input
          id="rgb-r"
          type="range"
          min="0"
          max="255"
          step="1"
          [(ngModel)]="rgbValues[0]"
          (change)="onRgbChange()"
          (input)="onRgbInput()"
          data-testid="rgb-slider-r"
          class="slider"
        />
        <span class="value-display" data-testid="rgb-value-r">
          {{ Math.round(rgbValues[0]) }}
        </span>
      </div>

      <div class="slider-group">
        <label for="rgb-g" class="slider-label">Green</label>
        <input
          id="rgb-g"
          type="range"
          min="0"
          max="255"
          step="1"
          [(ngModel)]="rgbValues[1]"
          (change)="onRgbChange()"
          (input)="onRgbInput()"
          data-testid="rgb-slider-g"
          class="slider"
        />
        <span class="value-display" data-testid="rgb-value-g">
          {{ Math.round(rgbValues[1]) }}
        </span>
      </div>

      <div class="slider-group">
        <label for="rgb-b" class="slider-label">Blue</label>
        <input
          id="rgb-b"
          type="range"
          min="0"
          max="255"
          step="1"
          [(ngModel)]="rgbValues[2]"
          (change)="onRgbChange()"
          (input)="onRgbInput()"
          data-testid="rgb-slider-b"
          class="slider"
        />
        <span class="value-display" data-testid="rgb-value-b">
          {{ Math.round(rgbValues[2]) }}
        </span>
      </div>

      <div class="rgb-display" data-testid="rgb-display">
        rgb({{ Math.round(rgbValues[0]) }}, {{ Math.round(rgbValues[1]) }},
        {{ Math.round(rgbValues[2]) }})
      </div>
    </div>
  `,
  styles: [
    `
      .rgb-controls {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .slider-group {
        display: grid;
        grid-template-columns: 80px 1fr 50px;
        gap: 1rem;
        align-items: center;
      }

      .slider-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .slider {
        width: 100%;
        height: 6px;
        cursor: pointer;
        appearance: none;
        background: linear-gradient(
          90deg,
          rgb(0, 0, 0),
          rgb(255, 255, 255)
        );
        border-radius: 3px;
        outline: none;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            border-color: #2563eb;
          }
        }

        &::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            border-color: #2563eb;
          }
        }
      }

      .value-display {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        font-weight: 600;
        text-align: right;
        color: #374151;
      }

      .rgb-display {
        padding: 0.75rem;
        background: #f3f4f6;
        border-radius: 0.375rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        color: #1f2937;
        text-align: center;
        border: 1px solid #e5e7eb;
      }
    `,
  ],
})
export class RgbSlidersComponent {
  @Input() rgbValues: [number, number, number] = [255, 0, 0];
  @Output() rgbValuesChange = new EventEmitter<[number, number, number]>();
  @Output() rgbInput = new EventEmitter<[number, number, number]>();
  @Output() rgbChange = new EventEmitter<[number, number, number]>();

  protected Math = Math;

  onRgbInput(): void {
    this.rgbInput.emit([this.rgbValues[0], this.rgbValues[1], this.rgbValues[2]]);
  }

  onRgbChange(): void {
    this.rgbValuesChange.emit([this.rgbValues[0], this.rgbValues[1], this.rgbValues[2]]);
    this.rgbChange.emit([this.rgbValues[0], this.rgbValues[1], this.rgbValues[2]]);
  }
}
