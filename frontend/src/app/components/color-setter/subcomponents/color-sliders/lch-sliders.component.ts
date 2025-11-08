/**
 * LCH Sliders Component
 *
 * Provides sliders for LCH (Lightness, Chroma, Hue) color space
 * with gamut-aware gradient visualization.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GamutService } from '../../services/gamut.service';
import Color from 'colorjs.io';

@Component({
  selector: 'app-lch-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lch-sliders.component.html',
  styleUrls: ['./lch-sliders.component.scss'],
})
export class LchSlidersComponent implements OnInit, OnDestroy {
  color = input<string>('lch(50 50 180)');
  gamut = input<string>('sRGB');
  @Output() colorChange = new EventEmitter<string>();

  // LCH values
  l: number = 50;
  c: number = 50;
  h: number = 180;

  // Gradient backgrounds for sliders (deprecated, kept for compatibility)
  lGradient: string = '';
  cGradient: string = '';
  hGradient: string = '';

  // Valid positions for snapping (stores positions where colors are in-gamut)
  validLPositions: number[] = [];
  validCPositions: number[] = [];
  validHPositions: number[] = [];

  // Color generator functions for canvas rendering
  lColorGenerator = (position: number) =>
    `lch(${position} ${this.c} ${this.h})`;
  cColorGenerator = (position: number) =>
    `lch(${this.l} ${position} ${this.h})`;
  hColorGenerator = (position: number) =>
    `lch(${this.l} ${this.c} ${position})`;

  // Debounced update subjects
  private lUpdate$ = new Subject<number>();
  private cUpdate$ = new Subject<number>();
  private hUpdate$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  // Math for template
  Math = Math;

  constructor(private gamutService: GamutService) {}

  ngOnInit() {
    this.parseColor();
    this.generateGradients();
    this.setupDebouncing();

    // Effect to handle color changes
    effect(() => {
      const currentColor = this.color();
      this.parseColor();
      this.generateGradients();
    });

    // Effect to handle gamut changes
    effect(() => {
      const currentGamut = this.gamut();
      this.generateGradients();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Parse LCH color string to extract L, C, H values
   */
  private parseColor() {
    try {
      const colorValue = this.color();
      const match = colorValue.match(
        /lch\((\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\)/
      );
      if (match) {
        this.l = parseFloat(match[1]);
        this.c = parseFloat(match[2]);
        this.h = parseFloat(match[3]);
      }
    } catch (error) {
      console.error('LCH parse error:', error);
    }
  }

  /**
   * Setup debounced updates for smooth slider interactions
   */
  private setupDebouncing() {
    // No debounce for instant gradient updates (0ms = immediate)
    this.lUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateGradients(); // Regenerate gradients for live updates
        this.emitColorChange();
      });

    this.cUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateGradients(); // Regenerate gradients for live updates
        this.emitColorChange();
      });

    this.hUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateGradients(); // Regenerate gradients for live updates
        this.emitColorChange();
      });
  }

  /**
   * Generate gradients for all sliders based on current values
   */
  private generateGradients() {
    const currentColor = `lch(${this.l} ${this.c} ${this.h})`;
    const currentGamut = this.gamut();

    // Lightness gradient (0-100) with 100 steps
    const lGradientData = this.gamutService.generateSliderGradient({
      format: 'lch',
      channel: 'l',
      currentColor,
      gamut: currentGamut,
      min: 0,
      max: 100,
      steps: 100,
    });
    this.lGradient = this.generateGradientWithTransparency(lGradientData.stops);
    this.validLPositions = this.extractValidPositions(
      lGradientData.stops,
      0,
      100
    );

    // Chroma gradient (0-150) with 100 steps
    const cGradientData = this.gamutService.generateSliderGradient({
      format: 'lch',
      channel: 'c',
      currentColor,
      gamut: currentGamut,
      min: 0,
      max: 150,
      steps: 100,
    });
    this.cGradient = this.generateGradientWithTransparency(cGradientData.stops);
    this.validCPositions = this.extractValidPositions(
      cGradientData.stops,
      0,
      150
    );

    // Hue gradient (0-360) with 360 steps (1° per step for smooth circular transitions)
    const hGradientData = this.gamutService.generateSliderGradient({
      format: 'lch',
      channel: 'h',
      currentColor,
      gamut: currentGamut,
      min: 0,
      max: 360,
      steps: 360,
    });
    this.hGradient = this.generateGradientWithTransparency(hGradientData.stops);
    this.validHPositions = this.extractValidPositions(
      hGradientData.stops,
      0,
      360
    );
  }

  /**
   * Generate CSS gradient with full transparency for out-of-gamut colors
   * Adds sharp transitions between colored and transparent regions
   */
  private generateGradientWithTransparency(stops: any[]): string {
    const gradientStops: string[] = [];

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const nextStop = i < stops.length - 1 ? stops[i + 1] : null;
      const prevStop = i > 0 ? stops[i - 1] : null;

      if (stop.inGamut) {
        // In-gamut: use full color
        gradientStops.push(`${stop.color} ${stop.position.toFixed(1)}%`);

        // Add sharp transition if next stop is out-of-gamut
        if (nextStop && !nextStop.inGamut) {
          const sharpPosition = stop.position + 0.01;
          gradientStops.push(`transparent ${sharpPosition.toFixed(2)}%`);
        }
      } else {
        // Out-of-gamut: use transparent
        // Only add if we didn't just create a sharp transition from previous in-gamut stop
        if (!prevStop || !prevStop.inGamut) {
          gradientStops.push(`transparent ${stop.position.toFixed(1)}%`);
        }

        // Add sharp transition if next stop is in-gamut
        if (nextStop && nextStop.inGamut) {
          const sharpPosition = nextStop.position - 0.01;
          if (sharpPosition > stop.position) {
            gradientStops.push(`transparent ${sharpPosition.toFixed(2)}%`);
          }
        }
      }
    }

    return `linear-gradient(to right, ${gradientStops.join(', ')})`;
  }

  /**
   * Extract valid value positions (where colors are in-gamut)
   */
  private extractValidPositions(
    stops: any[],
    min: number,
    max: number
  ): number[] {
    return stops
      .filter((stop) => stop.inGamut)
      .map((stop) => min + (stop.position / 100) * (max - min));
  }

  /**
   * Snap value to nearest valid position
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

  /**
   * Handle lightness slider input (live updates)
   */
  onLInput() {
    this.lUpdate$.next(this.l);
  }

  /**
   * Handle lightness slider change (final value)
   */
  onLChange() {
    // Snap to nearest valid position
    this.l = this.snapToValidPosition(this.l, this.validLPositions);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle chroma slider input (live updates)
   */
  onCInput() {
    this.cUpdate$.next(this.c);
  }

  /**
   * Handle chroma slider change (final value)
   */
  onCChange() {
    // Snap to nearest valid position
    this.c = this.snapToValidPosition(this.c, this.validCPositions);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle hue slider input (live updates)
   */
  onHInput() {
    this.hUpdate$.next(this.h);
  }

  /**
   * Handle hue slider change (final value)
   */
  onHChange() {
    // Snap to nearest valid position
    this.h = this.snapToValidPosition(this.h, this.validHPositions);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Emit color change event
   */
  private emitColorChange() {
    const lchColor = `lch(${this.l} ${this.c} ${this.h})`;
    this.colorChange.emit(lchColor);
  }
}
