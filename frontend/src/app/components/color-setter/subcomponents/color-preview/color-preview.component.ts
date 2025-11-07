import { Component, Input } from '@angular/core';
import Color from 'colorjs.io';

/**
 * ColorPreviewComponent - Subcomponent for color preview display
 * Shows a visual color sample and current color value
 *
 * Component adheres to Constitution Principle VII:
 * - Separate .ts, .html, and .scss files
 * - TypeScript class with pure component logic
 * - Semantic HTML template without style classes
 * - All styling in separate .scss file
 */
@Component({
  selector: 'app-color-preview',
  standalone: true,
  templateUrl: './color-preview.component.html',
  styleUrl: './color-preview.component.scss',
})
export class ColorPreviewComponent {
  @Input() color: Color = new Color('#FF0000');
  @Input() displayValue: string = '#FF0000';

  get colorPreview(): string {
    try {
      const rgb = this.color.to('srgb');
      const [r, g, b] = rgb.coords.map((c) => Math.round(c * 255));
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return '#FF0000';
    }
  }
}
