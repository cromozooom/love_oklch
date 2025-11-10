import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorFormat, FORMAT_CONFIGS } from '../../models/format-config.model';

/**
 * FormatSelectorComponent - Subcomponent for format selection
 * Displays buttons to switch between supported color formats
 * (HEX, RGB, HSL, LCH, OKLCH, LAB)
 *
 * Component adheres to Constitution Principle VII:
 * - Separate .ts, .html, and .scss files
 * - TypeScript class with pure component logic
 * - Semantic HTML template without style classes
 * - All styling in separate .scss file
 */
@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './format-selector.component.html',
  styleUrl: './format-selector.component.scss',
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
