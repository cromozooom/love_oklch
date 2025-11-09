/**
 * HexInputComponent - Enhanced HEX color picker with 2D canvas and hue slider
 *
 * Features:
 * - 2D Saturation/Lightness canvas picker
 * - Hue slider using gamut-aware-slider component
 * - Direct HEX input field with validation
 * - Real-time color preview
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  input,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Renderer2, NgZone } from '@angular/core';
import { GamutAwareSliderComponent } from '../gamut-aware-slider/gamut-aware-slider.component';

@Component({
  selector: 'app-hex-input',
  standalone: true,
  imports: [CommonModule, FormsModule, GamutAwareSliderComponent],
  templateUrl: './hex-input.component.html',
  styleUrl: './hex-input.component.scss',
})
export class HexInputComponent implements AfterViewInit, OnDestroy {
  hexValue = input<string>('#FF0000');
  @Output() hexValueChange = new EventEmitter<string>();
  @Output() hexChange = new EventEmitter<string>();

  @ViewChild('colorCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Color state
  internalHexValue = signal('#FF0000');
  hue: number = 0; // 0-360
  saturation: number = 100; // 0-100
  lightness: number = 50; // 0-100

  // Canvas interaction state
  private ctx?: CanvasRenderingContext2D | null;
  private resizeObserver?: ResizeObserver;

  // Drag state (following PrimeNG pattern)
  private colorDragging: boolean = false;
  private documentMouseMoveListener?: () => void;
  private documentMouseUpListener?: () => void;

  // Indicator position for the color dot
  indicatorX: number = 0;
  indicatorY: number = 0;

  // Color generator for hue slider
  hueColorGenerator = computed(() => {
    return (position: number) => `hsl(${Math.round(position)}, 100%, 50%)`;
  });

  // Hue formatter
  formatHue = (v: number) => Math.round(v).toString() + '°';

  constructor(private renderer: Renderer2, private ngZone: NgZone) {
    // Sync internal value with input
    effect(() => {
      const currentHex = this.hexValue();
      this.internalHexValue.set(currentHex);
      this.parseHexToHSL(currentHex);
      this.updateIndicatorPosition();
    });

    // Note: Canvas repainting is now handled explicitly in hue change handlers
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    // Initialize the color and position after canvas is ready
    const initialHex = this.hexValue();
    console.log('Initial hex:', initialHex);
    this.parseHexToHSL(initialHex);
    console.log(
      'After parsing - Hue:',
      this.hue,
      'Sat:',
      this.saturation,
      'Light:',
      this.lightness
    );
    this.updateIndicatorPosition();
    console.log('Indicator position:', this.indicatorX, this.indicatorY);
    this.paintCanvas();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.unbindDocumentMouseMoveListener();
    this.unbindDocumentMouseUpListener();
  }

  /**
   * Initialize canvas and set up rendering
   */
  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', {
      colorSpace: 'srgb',
      willReadFrequently: false,
    });

    if (this.ctx) {
      this.paintCanvas();
    }

    // Setup resize observer
    this.resizeObserver = new ResizeObserver(() => {
      if (this.ctx) {
        this.paintCanvas();
      }
    });
    this.resizeObserver.observe(canvas);
  }

  /**
   * Paint the saturation/lightness canvas based on current hue
   */
  private paintCanvas(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width;
    const height = canvas.height;

    // Create saturation gradient (left to right: white to pure hue color)
    const saturationGradient = this.ctx.createLinearGradient(0, 0, width, 0);
    saturationGradient.addColorStop(0, '#ffffff');
    saturationGradient.addColorStop(1, `hsl(${this.hue}, 100%, 50%)`);

    // Fill with saturation gradient
    this.ctx.fillStyle = saturationGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Create lightness gradient (top to bottom: transparent to black)
    const lightnessGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    lightnessGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lightnessGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    // Overlay lightness gradient
    this.ctx.fillStyle = lightnessGradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Handle canvas click
   */
  onCanvasClick(event: MouseEvent): void {
    this.updateColorFromCanvas(event);
  }

  /**
   * Handle mouse down on the color indicator dot
   */
  onColorMousedown(event: MouseEvent): void {
    this.colorDragging = true;
    this.bindDocumentMouseMoveListener();
    this.bindDocumentMouseUpListener();

    // Start picking color immediately
    this.pickColor(event);
    event.preventDefault();
  }

  /**
   * Bind document mouse move listener (PrimeNG pattern)
   */
  private bindDocumentMouseMoveListener(): void {
    if (!this.documentMouseMoveListener) {
      this.ngZone.runOutsideAngular(() => {
        this.documentMouseMoveListener = this.renderer.listen(
          'document',
          'mousemove',
          (event: MouseEvent) => {
            if (this.colorDragging) {
              this.ngZone.run(() => {
                this.pickColor(event);
              });
            }
          }
        );
      });
    }
  }

  /**
   * Bind document mouse up listener (PrimeNG pattern)
   */
  private bindDocumentMouseUpListener(): void {
    if (!this.documentMouseUpListener) {
      this.ngZone.runOutsideAngular(() => {
        this.documentMouseUpListener = this.renderer.listen(
          'document',
          'mouseup',
          () => {
            this.ngZone.run(() => {
              this.colorDragging = false;
              this.unbindDocumentMouseMoveListener();
              this.unbindDocumentMouseUpListener();
            });
          }
        );
      });
    }
  }

  /**
   * Unbind document mouse move listener
   */
  private unbindDocumentMouseMoveListener(): void {
    if (this.documentMouseMoveListener) {
      this.documentMouseMoveListener();
      this.documentMouseMoveListener = undefined;
    }
  }

  /**
   * Unbind document mouse up listener
   */
  private unbindDocumentMouseUpListener(): void {
    if (this.documentMouseUpListener) {
      this.documentMouseUpListener();
      this.documentMouseUpListener = undefined;
    }
  }

  /**
   * Pick color from mouse position (PrimeNG pattern)
   */
  private pickColor(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calculate position relative to canvas
    const canvasX = Math.max(
      0,
      Math.min(canvas.width, event.clientX - rect.left)
    );
    const canvasY = Math.max(
      0,
      Math.min(canvas.height, event.clientY - rect.top)
    );

    // Update color values
    this.saturation = (canvasX / canvas.width) * 100;
    this.lightness = 100 - (canvasY / canvas.height) * 100;

    // Update indicator position
    this.indicatorX = canvasX;
    this.indicatorY = canvasY;

    // Convert to HEX and update
    this.updateHexFromHSL();
  }

  /**
   * Update color based on canvas click position
   */
  private updateColorFromCanvas(event: MouseEvent): void {
    this.updateColorFromPosition(event.clientX, event.clientY);
  }

  /**
   * Update color based on screen coordinates
   */
  private updateColorFromPosition(clientX: number, clientY: number): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Get position relative to canvas
    const canvasX = Math.max(0, Math.min(canvas.width, clientX - rect.left));
    const canvasY = Math.max(0, Math.min(canvas.height, clientY - rect.top));

    // Convert to saturation/lightness values
    this.saturation = (canvasX / canvas.width) * 100;
    this.lightness = 100 - (canvasY / canvas.height) * 100;

    // Update indicator position
    this.indicatorX = canvasX;
    this.indicatorY = canvasY;

    // Convert to HEX and update
    this.updateHexFromHSL();
  }

  /**
   * Handle hue slider input
   */
  onHueInput(value: number): void {
    this.hue = value;
    this.paintCanvas(); // Repaint canvas with new hue
    this.updateHexFromHSL();
  }

  /**
   * Handle hue slider change
   */
  onHueChange(value: number): void {
    this.hue = value;
    this.paintCanvas(); // Repaint canvas with new hue
    this.updateHexFromHSL();
  }

  /**
   * Handle direct HEX input changes
   */
  onHexChange(): void {
    const hexValue = this.internalHexValue();

    // Validate HEX format
    if (this.isValidHex(hexValue)) {
      this.parseHexToHSL(hexValue);
      this.paintCanvas(); // Repaint canvas with new hue
      this.updateIndicatorPosition();
      this.emitChange();
    }
  }

  /**
   * Convert current HSL values to HEX and update internal value
   */
  private updateHexFromHSL(): void {
    const hex = this.hslToHex(this.hue, this.saturation, this.lightness);
    this.internalHexValue.set(hex);
    this.emitChange();
  }

  /**
   * Parse HEX color to HSL values
   */
  private parseHexToHSL(hex: string): void {
    const hsl = this.hexToHsl(hex);
    if (hsl) {
      this.hue = hsl.h;
      this.saturation = hsl.s;
      this.lightness = hsl.l;
    }
  }

  /**
   * Update indicator position based on current saturation/lightness
   */
  private updateIndicatorPosition(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const canvasX = (this.saturation / 100) * canvas.width;
      const canvasY = ((100 - this.lightness) / 100) * canvas.height;

      // Update indicator position
      this.indicatorX = canvasX;
      this.indicatorY = canvasY;
    }
  }

  /**
   * Emit color change events
   */
  private emitChange(): void {
    const hexValue = this.internalHexValue();
    this.hexValueChange.emit(hexValue);
    this.hexChange.emit(hexValue);
  }

  /**
   * Validate HEX color format
   */
  private isValidHex(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  /**
   * Convert HEX to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    if (!this.isValidHex(hex)) return null;

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Convert HSL to HEX
   */
  private hslToHex(h: number, s: number, l: number): string {
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (sNorm === 0) {
      r = g = b = lNorm; // achromatic
    } else {
      const q =
        lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1 / 3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1 / 3);
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
}
