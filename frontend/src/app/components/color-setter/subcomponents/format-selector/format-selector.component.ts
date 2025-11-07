import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorFormat, FORMAT_CONFIGS } from '../../models/format-config.model';

/**
 * FormatSelectorComponent - Subcomponent for format selection
 * Displays buttons to switch between supported color formats
 * (HEX, RGB, HSL, LCH, OKLCH, LAB)
 */
@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="format-selector" data-testid="format-selector">
      <div class="format-buttons">
        <button
          *ngFor="let fmt of availableFormats"
          [class.active]="currentFormat === fmt"
          (click)="onFormatClick(fmt)"
          [attr.data-testid]="'format-selector-' + fmt"
          class="format-btn"
          type="button"
        >
          {{ FORMAT_CONFIGS[fmt].displayName }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .format-selector {
        margin-bottom: 1rem;
      }

      .format-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .format-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
        font-size: 0.875rem;

        &:hover {
          border-color: #9ca3af;
          background: #f9fafb;
        }

        &.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
      }
    `,
  ],
})
export class FormatSelectorComponent {
  @Input() currentFormat: ColorFormat = 'hex';
  @Input() availableFormats: ColorFormat[] = ['hex', 'rgb', 'hsl'];

  @Output() formatChanged = new EventEmitter<ColorFormat>();

  protected FORMAT_CONFIGS = FORMAT_CONFIGS;

  onFormatClick(format: ColorFormat): void {
    this.formatChanged.emit(format);
  }
}
