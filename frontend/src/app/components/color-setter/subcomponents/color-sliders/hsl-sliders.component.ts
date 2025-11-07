import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * HslSlidersComponent - Subcomponent for HSL color sliders
 * Provides three sliders for H (0-360), S (0-100), L (0-100)
 */
@Component({
  selector: 'app-hsl-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hsl-controls" data-testid="hsl-sliders">
      <div class="slider-group">
        <label for="hsl-h" class="slider-label">Hue</label>
        <input
          id="hsl-h"
          type="range"
          min="0"
          max="360"
          step="1"
          [(ngModel)]="hslValues[0]"
          (change)="onHslChange()"
          (input)="onHslInput()"
          data-testid="hsl-slider-h"
          class="slider hue-slider"
        />
        <span class="value-display">{{ Math.round(hslValues[0]) }}°</span>
      </div>

      <div class="slider-group">
        <label for="hsl-s" class="slider-label">Saturation</label>
        <input
          id="hsl-s"
          type="range"
          min="0"
          max="100"
          step="0.1"
          [(ngModel)]="hslValues[1]"
          (change)="onHslChange()"
          (input)="onHslInput()"
          data-testid="hsl-slider-s"
          class="slider saturation-slider"
        />
        <span class="value-display">{{ Math.round(hslValues[1]) }}%</span>
      </div>

      <div class="slider-group">
        <label for="hsl-l" class="slider-label">Lightness</label>
        <input
          id="hsl-l"
          type="range"
          min="0"
          max="100"
          step="0.1"
          [(ngModel)]="hslValues[2]"
          (change)="onHslChange()"
          (input)="onHslInput()"
          data-testid="hsl-slider-l"
          class="slider lightness-slider"
        />
        <span class="value-display">{{ Math.round(hslValues[2]) }}%</span>
      </div>

      <div class="hsl-display" data-testid="hsl-display">
        hsl({{ Math.round(hslValues[0]) }}, {{ Math.round(hslValues[1]) }}%,
        {{ Math.round(hslValues[2]) }}%)
      </div>
    </div>
  `,
  styles: [
    `
      .hsl-controls {
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

      .hue-slider {
        background: linear-gradient(
          90deg,
          hsl(0, 100%, 50%),
          hsl(60, 100%, 50%),
          hsl(120, 100%, 50%),
          hsl(180, 100%, 50%),
          hsl(240, 100%, 50%),
          hsl(300, 100%, 50%),
          hsl(360, 100%, 50%)
        );
      }

      .saturation-slider {
        background: linear-gradient(
          90deg,
          hsl(0, 0%, 50%),
          hsl(0, 100%, 50%)
        );
      }

      .lightness-slider {
        background: linear-gradient(
          90deg,
          hsl(0, 50%, 0%),
          hsl(0, 50%, 50%),
          hsl(0, 50%, 100%)
        );
      }

      .value-display {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        font-weight: 600;
        text-align: right;
        color: #374151;
      }

      .hsl-display {
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
export class HslSlidersComponent {
  @Input() hslValues: [number, number, number] = [0, 100, 50];
  @Output() hslValuesChange = new EventEmitter<[number, number, number]>();
  @Output() hslInput = new EventEmitter<[number, number, number]>();
  @Output() hslChange = new EventEmitter<[number, number, number]>();

  protected Math = Math;

  onHslInput(): void {
    this.hslInput.emit([this.hslValues[0], this.hslValues[1], this.hslValues[2]]);
  }

  onHslChange(): void {
    this.hslValuesChange.emit([this.hslValues[0], this.hslValues[1], this.hslValues[2]]);
    this.hslChange.emit([this.hslValues[0], this.hslValues[1], this.hslValues[2]]);
  }
}
