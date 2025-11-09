/**
 * OKLCH Sliders Component
 *
 * Provides sliders for OKLCH (Lightness, Chroma, Hue) color space
 * with gamut-aware gradient visualization.
 * OKLCH is a perceptually uniform color space optimized for modern displays.
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
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GamutService } from '../../services/gamut.service';
import Color from 'colorjs.io';
import { GamutAwareSliderComponent } from '../gamut-aware-slider/gamut-aware-slider.component';

@Component({
  selector: 'app-oklch-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule, GamutAwareSliderComponent],
  templateUrl: './oklch-sliders.component.html',
  styleUrls: ['./oklch-sliders.component.scss'],
})
export class OklchSlidersComponent implements OnInit, OnDestroy {
  color = input<string>('oklch(0.5 0.1 180)');
  gamut = input<string>('sRGB');
  @Output() colorChange = new EventEmitter<string>();

  // OKLCH values (normalized) - current actual values
  l: number = 0.5;
  c: number = 0.1;
  h: number = 180;

  // OKLCH baseline values for gradient generation (don't change during dragging)
  baselineL: number = 0.5;
  baselineC: number = 0.1;
  baselineH: number = 180;

  // Gradient backgrounds for sliders (deprecated, kept for compatibility)
  lGradient: string = '';
  cGradient: string = '';
  hGradient: string = '';

  // Valid positions for snapping (stores positions where colors are in-gamut)
  validLPositions: number[] = [];
  validCPositions: number[] = [];
  validHPositions: number[] = [];

  // Signals for L/C/H values to make them reactive
  lSignal = signal(0.5);
  cSignal = signal(0.1);
  hSignal = signal(180);

  // Color generator functions for canvas rendering - computed to trigger changes
  lColorGenerator = computed(() => {
    const c = this.cSignal();
    const h = this.hSignal();
    return (position: number) => `oklch(${position} ${c} ${h})`;
  });

  cColorGenerator = computed(() => {
    const l = this.lSignal();
    const h = this.hSignal();
    return (position: number) => `oklch(${l} ${position} ${h})`;
  });

  hColorGenerator = computed(() => {
    const l = this.lSignal();
    const c = this.cSignal();
    return (position: number) => `oklch(${l} ${c} ${position})`;
  });

  // Debounced update subjects
  private lUpdate$ = new Subject<number>();
  private cUpdate$ = new Subject<number>();
  private hUpdate$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  // Math for template
  Math = Math;

  // Dev flag to show/hide CSS gradient divs
  showDebugGradients = false; // Set to true for development debugging

  // Value formatters for display
  formatL = (v: number) => v.toFixed(3);
  formatC = (v: number) => v.toFixed(3);
  formatH = (v: number) => `${Math.round(v)}°`;

  constructor(private gamutService: GamutService) {
    // Effect to handle color changes - updates baseline values
    effect(() => {
      const currentColor = this.color();
      this.parseColor(); // This updates baseline values
      this.generateGradients();
    });

    // Effect to handle gamut changes - regenerates gradients with new gamut
    effect(() => {
      const currentGamut = this.gamut();
      console.log('[OklchSliders] Gamut changed to:', currentGamut);
      this.generateGradients();
    });
  }

  ngOnInit() {
    this.parseColor();
    this.generateGradients();
    this.setupDebouncing();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Parse OKLCH color string to extract L, C, H values
   */
  private parseColor() {
    try {
      const colorValue = this.color();
      const match = colorValue.match(
        /oklch\((\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\)/
      );
      if (match) {
        this.l = parseFloat(match[1]);
        this.c = parseFloat(match[2]);
        // Handle NaN hue for achromatic colors
        const parsedH = parseFloat(match[3]);
        this.h = isNaN(parsedH) ? 0 : parsedH;

        // Update signals for reactive canvas updates
        this.lSignal.set(this.l);
        this.cSignal.set(this.c);
        this.hSignal.set(this.h);

        // Update baseline values for gradient generation
        this.baselineL = this.l;
        this.baselineC = this.c;
        this.baselineH = this.h;
      }
    } catch (error) {
      console.error('OKLCH parse error:', error);
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
        // Don't regenerate gradients during slider dragging - prevents feedback loop
        this.emitColorChange();
      });

    this.cUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        // Don't regenerate gradients during slider dragging - prevents feedback loop
        this.emitColorChange();
      });

    this.hUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        // Don't regenerate gradients during slider dragging - prevents feedback loop
        this.emitColorChange();
      });
  }

  /**
   * Generate gradients for all sliders based on baseline values (prevents feedback loop)
   */
  private generateGradients() {
    // Handle NaN hue for achromatic colors
    const baselineHue = isNaN(this.baselineH) ? 0 : this.baselineH;
    const baselineColor = `oklch(${this.baselineL} ${this.baselineC} ${baselineHue})`;
    const currentGamut = this.gamut();

    console.log('[OklchSliders] Generating gradients:', {
      baselineColor,
      currentGamut,
      actualValues: { l: this.l, c: this.c, h: this.h },
    });

    // Lightness gradient (0-1) with 100 steps
    const lGradientData = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'l',
      currentColor: baselineColor,
      gamut: currentGamut,
      min: 0,
      max: 1,
      steps: 100,
    });
    this.lGradient = this.generateGradientWithTransparency(lGradientData.stops);
    this.validLPositions = this.extractValidPositions(
      lGradientData.stops,
      0,
      1
    );

    // Chroma gradient (0-0.4) with 100 steps
    const cGradientData = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'c',
      currentColor: baselineColor,
      gamut: currentGamut,
      min: 0,
      max: 0.4,
      steps: 100,
    });
    this.cGradient = this.generateGradientWithTransparency(cGradientData.stops);
    this.validCPositions = this.extractValidPositions(
      cGradientData.stops,
      0,
      0.4
    );

    // Hue gradient (0-360) with 360 steps (1° per step for smooth circular transitions)
    const hGradientData = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'h',
      currentColor: baselineColor,
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

    console.log('[OklchSliders] Hue gradient generated:', {
      validPositions: this.validHPositions,
      gradientStops: hGradientData.stops.length,
      inGamutStops: hGradientData.stops.filter((s) => s.inGamut).length,
    });
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
  onLInput(value: number) {
    this.l = value; // Update component property immediately
    this.lSignal.set(value); // Update signal for reactive canvas updates
    this.lUpdate$.next(value);
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
  onCInput(value: number) {
    this.c = value; // Update component property immediately
    this.cSignal.set(value); // Update signal for reactive canvas updates
    this.cUpdate$.next(value);
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
  onHInput(value: number) {
    this.h = value; // Update component property immediately
    this.hSignal.set(value); // Update signal for reactive canvas updates
    this.hUpdate$.next(value);
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
    // Handle NaN hue for achromatic colors (grey colors with no hue)
    const hueValue = isNaN(this.h) ? 0 : this.h;
    const oklchColor = `oklch(${this.l.toFixed(3)} ${this.c.toFixed(
      3
    )} ${hueValue})`;
    this.colorChange.emit(oklchColor);
  }
}
