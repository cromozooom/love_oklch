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

  @ViewChild('colorIndicator', { static: false })
  indicatorRef!: ElementRef<HTMLDivElement>;

  // Color state (using HSB model like PrimeNG)
  internalHexValue = signal('#FF0000');
  hue: number = 0; // 0-360
  saturation: number = 100; // 0-100
  brightness: number = 100; // 0-100 (HSB brightness, not HSL lightness)

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
      this.parseHexToHSB(currentHex);
      this.updateIndicatorPosition();
    });

    // Note: Canvas repainting is now handled explicitly in hue change handlers
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    // Initialize the color and position after canvas is ready
    const initialHex = this.hexValue();
    console.log('Initial hex:', initialHex);
    this.parseHexToHSB(initialHex);
    console.log(
      'After parsing - Hue:',
      this.hue,
      'Sat:',
      this.saturation,
      'Brightness:',
      this.brightness
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
   * Paint the saturation/brightness canvas based on current hue (HSB model like PrimeNG)
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

    // Create brightness gradient (top to bottom: transparent to black)
    // Top = full brightness, Bottom = no brightness (black)
    const brightnessGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    brightnessGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    brightnessGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    // Overlay brightness gradient
    this.ctx.fillStyle = brightnessGradient;
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

    // Add dragging class for smooth movement
    if (this.indicatorRef?.nativeElement) {
      this.indicatorRef.nativeElement.classList.add('dragging');
    }

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

              // Remove dragging class to restore transition
              if (this.indicatorRef?.nativeElement) {
                this.indicatorRef.nativeElement.classList.remove('dragging');
              }

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

    // Calculate position relative to canvas, following PrimeNG's approach
    // They use Math.max(0, Math.min(canvasSize, mousePos - offset)) pattern
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    // For color calculation, use the full canvas range
    const colorX = Math.max(0, Math.min(canvas.width - 1, relativeX));
    const colorY = Math.max(0, Math.min(canvas.height - 1, relativeY));

    // Update color values with proper bounds checking (HSB model)
    const newSaturation = Math.floor((colorX / (canvas.width - 1)) * 100);
    const newBrightness = Math.floor(
      100 - (colorY / (canvas.height - 1)) * 100
    );

    this.saturation = newSaturation;
    this.brightness = newBrightness;

    // IMPORTANT: Don't update hue when saturation is 0 (achromatic colors)
    // This preserves the current hue for pure white, gray, and black
    // and prevents the hue from jumping to random values

    // Update indicator position to match the color position
    // Allow indicator center to reach full canvas area for pure white selection
    this.indicatorX = colorX;
    this.indicatorY = colorY;

    // Convert to HEX and update
    this.updateHexFromHSB();
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

    // Get position relative to canvas, following PrimeNG's clamping approach
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // For color calculation, use the full canvas range
    const colorX = Math.max(0, Math.min(canvas.width - 1, relativeX));
    const colorY = Math.max(0, Math.min(canvas.height - 1, relativeY));

    // Convert to saturation/brightness values with proper bounds (HSB model)
    this.saturation = Math.floor((colorX / (canvas.width - 1)) * 100);
    this.brightness = Math.floor(100 - (colorY / (canvas.height - 1)) * 100);

    // Update indicator position to match the color position
    // Allow indicator center to reach full canvas area for pure white selection
    this.indicatorX = colorX;
    this.indicatorY = colorY;

    // Convert to HEX and update
    this.updateHexFromHSB();
  }
  /**
   * Handle hue slider input
   */
  onHueInput(value: number): void {
    this.hue = value;
    this.paintCanvas(); // Repaint canvas with new hue
    this.updateHexFromHSB();
  }

  /**
   * Handle hue slider change
   */
  onHueChange(value: number): void {
    this.hue = value;
    this.paintCanvas(); // Repaint canvas with new hue
    this.updateHexFromHSB();
  }

  /**
   * Handle direct HEX input changes
   */
  onHexChange(): void {
    const hexValue = this.internalHexValue();

    // Validate HEX format
    if (this.isValidHex(hexValue)) {
      this.parseHexToHSB(hexValue);
      this.paintCanvas(); // Repaint canvas with new hue
      this.updateIndicatorPosition();
      this.emitChange();
    }
  }

  /**
   * Convert current HSB values to HEX and update internal value
   */
  private updateHexFromHSB(): void {
    const hex = this.hsbToHex(this.hue, this.saturation, this.brightness);
    this.internalHexValue.set(hex);
    this.emitChange();
  }

  /**
   * Parse HEX color to HSB values
   * Preserve current hue when saturation is 0 (achromatic colors)
   */
  private parseHexToHSB(hex: string): void {
    const hsb = this.hexToHsb(hex);
    if (hsb) {
      // Only update hue if the color has saturation (chromatic)
      // This prevents hue jumping when dealing with white/gray/black
      if (hsb.s > 0) {
        this.hue = hsb.h;
      }
      // Always update saturation and brightness
      this.saturation = hsb.s;
      this.brightness = hsb.b;
    }
  }

  /**
   * Update indicator position based on current saturation/brightness
   * Allow indicator center to cover full canvas area (including edges for pure white)
   */
  private updateIndicatorPosition(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      // Calculate indicator center position to cover full canvas area
      // This allows reaching pure white at the edges
      this.indicatorX = (this.saturation / 100) * (canvas.width - 1);
      this.indicatorY = ((100 - this.brightness) / 100) * (canvas.height - 1);
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
   * Convert HEX to HSB (following PrimeNG's approach)
   */
  private hexToHsb(hex: string): { h: number; s: number; b: number } | null {
    if (!this.isValidHex(hex)) return null;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const brightness = max;

    if (max !== 0) {
      s = (delta / max) * 255;
    }

    if (delta !== 0) {
      if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
    } else {
      h = -1;
    }

    h *= 60;
    if (h < 0) {
      h += 360;
    }

    return {
      h: Math.round(h),
      s: Math.round((s * 100) / 255),
      b: Math.round((brightness * 100) / 255),
    };
  }

  /**
   * Convert HSB to HEX (following PrimeNG's approach)
   */
  private hsbToHex(h: number, s: number, b: number): string {
    const hNorm = h;
    const sNorm = (s * 255) / 100;
    const bNorm = (b * 255) / 100;

    let r: number, g: number, b_rgb: number;

    if (sNorm === 0) {
      r = g = b_rgb = bNorm;
    } else {
      const t1 = bNorm;
      const t2 = ((255 - sNorm) * bNorm) / 255;
      const t3 = ((t1 - t2) * (hNorm % 60)) / 60;

      if (hNorm === 360) h = 0;

      if (hNorm < 60) {
        r = t1;
        b_rgb = t2;
        g = t2 + t3;
      } else if (hNorm < 120) {
        g = t1;
        b_rgb = t2;
        r = t1 - t3;
      } else if (hNorm < 180) {
        g = t1;
        r = t2;
        b_rgb = t2 + t3;
      } else if (hNorm < 240) {
        b_rgb = t1;
        r = t2;
        g = t1 - t3;
      } else if (hNorm < 300) {
        b_rgb = t1;
        g = t2;
        r = t2 + t3;
      } else if (hNorm < 360) {
        r = t1;
        g = t2;
        b_rgb = t1 - t3;
      } else {
        r = 0;
        g = 0;
        b_rgb = 0;
      }
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b_rgb)}`.toUpperCase();
  }
}
