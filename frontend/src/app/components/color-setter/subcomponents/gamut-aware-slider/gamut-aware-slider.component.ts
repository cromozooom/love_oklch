/**
 * Gamut-Aware Slider Component
 *
 * A reusable slider component that:
 * - Displays gradient backgrounds with transparent regions for out-of-gamut colors
 * - Uses native range input for smooth dragging (no precision issues)
 * - Automatically snaps to nearest valid (in-gamut) position on release
 * - Can be used for any color channel in any color space
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
  effect,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Color from 'colorjs.io';

/**
 * Color space classification for gamut boundary visualization
 */
enum ColorSpace {
  Unknown = 'unknown',
  sRGB = 'srgb',
  P3 = 'p3',
  Rec2020 = 'rec2020',
  OutOfGamut = 'out',
}

@Component({
  selector: 'app-gamut-aware-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamut-aware-slider.component.html',
  styleUrls: ['./gamut-aware-slider.component.scss'],
})
export class GamutAwareSliderComponent implements AfterViewInit, OnDestroy {
  // Convert inputs to signals for automatic change detection
  label = input<string>('');
  value = input<number>(0);
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(0.1);
  gradient = input<string>(''); // Deprecated, kept for compatibility
  debugGradient = input<string>(''); // Debug: CSS gradient for comparison
  validPositions = input<number[]>([]);
  formatValue = input<(value: number) => string>((v: number) => v.toFixed(2));
  testId = input<string>('');

  // Canvas rendering inputs
  colorGenerator = input<((position: number) => string) | undefined>(undefined);
  showGamutBoundaries = input<boolean>(true);
  currentGamut = input<string>('sRGB');

  @Output() valueChange = new EventEmitter<number>();
  @Output() valueInput = new EventEmitter<number>();
  @Output() valueCommit = new EventEmitter<number>();

  @ViewChild('gradientCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  internalValue = signal<number>(0);
  private ctx?: CanvasRenderingContext2D | null;
  private resizeObserver?: ResizeObserver;

  constructor() {
    // Effect to repaint canvas when any relevant signal changes
    effect(() => {
      // Track all signals that should trigger repaint
      const currentValue = this.value();
      const currentGenerator = this.colorGenerator();
      const currentGamut = this.currentGamut();
      const currentMin = this.min();
      const currentMax = this.max();

      // Debug logging for gamut changes
      if (currentGamut.toLowerCase().includes('rec2020')) {
        console.log(
          `[Canvas Effect] Gamut changed to: ${currentGamut}, ctx exists: ${!!this
            .ctx}`
        );
      }

      // Repaint if context exists, otherwise it will paint when canvas initializes
      if (this.ctx) {
        // Use requestAnimationFrame for smooth, properly timed repaints
        requestAnimationFrame(() => {
          if (this.ctx) {
            this.paintCanvas();
          }
        });
      }
    });

    // Sync internal value with input value
    effect(() => {
      this.internalValue.set(this.value());
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /**
   * Initialize canvas with proper sizing and context
   */
  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', {
      colorSpace: 'display-p3', // Use P3 color space if available
      willReadFrequently: false,
    });

    // Setup resize observer to handle container size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.paintCanvas();
    });
    this.resizeObserver.observe(canvas.parentElement!);

    // Initial paint
    this.updateCanvasSize();
    this.paintCanvas();

    // Log that canvas is ready
    console.log(
      `[Canvas Init] Canvas initialized with gamut: ${this.currentGamut()}`
    );
  }

  /**
   * Update canvas size based on container dimensions and device pixel ratio
   */
  private updateCanvasSize(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.ceil(window.devicePixelRatio);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context to match device pixel ratio
    this.ctx?.scale(dpr, dpr);
  }

  /**
   * Paint canvas with color gradient and gamut boundaries
   * Renders colors based on selected gamut
   */
  private paintCanvas(): void {
    const generator = this.colorGenerator();
    const selectedGamut = this.currentGamut();

    if (!this.ctx || !generator) {
      console.log(
        `[Canvas Paint] Skipping paint - ctx: ${!!this
          .ctx}, generator: ${!!generator}`
      );
      return;
    }

    console.log(`[Canvas Paint] Painting with gamut: ${selectedGamut}`);

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const halfHeight = Math.floor(height / 2);

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Colors for gamut boundary markers (visible even at 1px width)
    const borderP3 = 'rgb(136, 58, 234)'; // Purple for P3 boundaries
    const borderRec2020 = 'rgb(234, 58, 136)'; // Pink for Rec2020 boundaries

    const minVal = this.min();
    const maxVal = this.max();
    const showBoundaries = this.showGamutBoundaries();

    let prevSpace: ColorSpace = ColorSpace.Unknown;

    // Draw pixel by pixel across the full width
    for (let x = 0; x <= width; x++) {
      // Calculate position value in slider range
      const position = minVal + (x / width) * (maxVal - minVal);
      const colorString = generator(position);

      try {
        const color = new Color(colorString);
        const space = this.getColorSpace(color);
        const selectedGamut = this.currentGamut();

        // Check if color is in the selected gamut
        const isInSelectedGamut = this.isColorInSelectedGamut(
          color,
          selectedGamut
        );

        // Only draw colors that are in the selected gamut
        if (space !== ColorSpace.OutOfGamut && isInSelectedGamut) {
          // For colors outside sRGB, show split view: top = native color, bottom = sRGB fallback
          if (space === ColorSpace.sRGB) {
            // sRGB color - fill entire height
            this.ctx.fillStyle = colorString;
            this.ctx.fillRect(x, 0, 1, height);
          } else {
            // P3 or Rec2020 color - show split view
            // Top half: native color (will render as P3/Rec2020 if browser supports it)
            this.ctx.fillStyle = colorString;
            this.ctx.fillRect(x, 0, 1, halfHeight);

            // Bottom half: sRGB fallback (toGamut clips to sRGB)
            const srgbFallback = color.to('srgb');
            this.ctx.fillStyle = srgbFallback.toString({ format: 'rgb' });
            this.ctx.fillRect(x, halfHeight, 1, halfHeight + 1);
          }
        }

        // Draw gamut boundary markers when space changes (visible at any width)
        if (showBoundaries && prevSpace !== space && x > 0) {
          // Transitioning between spaces - draw boundary marker
          if (space === ColorSpace.P3 && prevSpace !== ColorSpace.Rec2020) {
            // Entering P3 from sRGB
            this.ctx.fillStyle = borderP3;
            this.ctx.fillRect(x, 0, 1, height);
          } else if (space === ColorSpace.sRGB && prevSpace === ColorSpace.P3) {
            // Leaving P3 to sRGB
            this.ctx.fillStyle = borderP3;
            this.ctx.fillRect(x - 1, 0, 1, height);
          } else if (space === ColorSpace.Rec2020) {
            // Entering Rec2020
            this.ctx.fillStyle = borderRec2020;
            this.ctx.fillRect(x, 0, 1, height);
          } else if (prevSpace === ColorSpace.Rec2020) {
            // Leaving Rec2020
            this.ctx.fillStyle = borderRec2020;
            this.ctx.fillRect(x - 1, 0, 1, height);
          }
        }

        prevSpace = space;
      } catch (error) {
        // Skip invalid colors
        prevSpace = ColorSpace.OutOfGamut;
      }
    }
  }
  /**
   * Detect which color space a color belongs to
   */
  private getColorSpace(color: Color): ColorSpace {
    try {
      // Check if color is in sRGB gamut
      if (color.inGamut('srgb')) {
        return ColorSpace.sRGB;
      }

      // Check if color is in P3 gamut
      if (color.inGamut('p3')) {
        return ColorSpace.P3;
      }

      // Check if color is in Rec2020 gamut
      if (color.inGamut('rec2020')) {
        return ColorSpace.Rec2020;
      }

      // Out of all gamuts
      return ColorSpace.OutOfGamut;
    } catch {
      return ColorSpace.Unknown;
    }
  }

  /**
   * Check if color is in the selected gamut
   * Maps gamut display names used by GamutService to colorjs.io gamut identifiers
   */
  private isColorInSelectedGamut(color: Color, gamut: string): boolean {
    try {
      // Handle both display names (from GamutService) and technical names
      switch (gamut.toLowerCase()) {
        case 'srgb':
          return color.inGamut('srgb');
        case 'display p3':
        case 'display-p3':
        case 'p3':
          return color.inGamut('p3');
        case 'rec2020':
          return color.inGamut('rec2020');
        case 'unlimited gamut':
        case 'unlimited':
          return true; // All colors are valid in unlimited mode
        default:
          return color.inGamut('srgb'); // Default to sRGB
      }
    } catch {
      return false;
    }
  }

  /**
   * Handle slider input (during drag) - smooth, no snapping
   */
  onSliderInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.internalValue.set(value);

    // Force immediate canvas repaint during drag
    if (this.ctx) {
      requestAnimationFrame(() => {
        if (this.ctx) {
          this.paintCanvas();
        }
      });
    }

    this.valueInput.emit(value); // Live updates for gradients
  }

  /**
   * Handle slider change (on release) - snap to valid position
   */
  onSliderChange(event: Event): void {
    let value = parseFloat((event.target as HTMLInputElement).value);
    const originalValue = value;

    // Snap to nearest valid position if we have gamut constraints
    const validPos = this.validPositions();
    if (validPos.length > 0) {
      value = this.snapToValidPosition(value, validPos);
      (event.target as HTMLInputElement).value = value.toString();

      console.log(`[${this.label()}] Snapping:`, {
        original: originalValue,
        snapped: value,
        validPositions: validPos,
        validCount: validPos.length,
      });
    }

    this.internalValue.set(value);
    this.valueChange.emit(value);
    this.valueCommit.emit(value);
  }

  /**
   * Find the closest valid position for gamut snapping
   */
  private snapToValidPosition(value: number, validPositions: number[]): number {
    if (validPositions.length === 0) return value;

    // Find closest valid position
    return validPositions.reduce((closest, current) => {
      return Math.abs(current - value) < Math.abs(closest - value)
        ? current
        : closest;
    });
  }
}
