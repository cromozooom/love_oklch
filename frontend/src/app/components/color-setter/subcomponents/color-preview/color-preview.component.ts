import { Component, Input } from '@angular/core';
import Color from 'colorjs.io';

/**
 * ColorPreviewComponent - Subcomponent for color preview display
 * Shows a visual color sample and current color value
 */
@Component({
  selector: 'app-color-preview',
  standalone: true,
  template: `
    <div class="color-preview-section">
      <div
        class="color-sample"
        [style.backgroundColor]="colorPreview"
        data-testid="color-preview"
      ></div>
      <div class="color-info">
        <div class="color-label">Color</div>
        <div class="color-value" data-testid="display-value">
          {{ displayValue }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .color-preview-section {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        align-items: center;
      }

      .color-sample {
        width: 100px;
        height: 100px;
        border-radius: 0.5rem;
        border: 2px solid #e5e7eb;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: background-color 0.016s linear;
        flex-shrink: 0;
      }

      .color-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.25rem;
      }

      .color-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .color-value {
        font-size: 1.5rem;
        font-weight: 700;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: #1f2937;
      }
    `,
  ],
})
export class ColorPreviewComponent {
  @Input() color: Color = new Color('#FF0000');
  @Input() displayValue: string = '#FF0000';

  get colorPreview(): string {
    try {
      const rgb = this.color.to('srgb');
      const [r, g, b] = rgb.coords.map(c => Math.round(c * 255));
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return '#FF0000';
    }
  }
}
