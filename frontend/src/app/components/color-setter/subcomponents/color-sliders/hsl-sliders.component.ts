/**
 * HSL Sliders Component
 *
 * Provides sliders for HSL (Hue, Saturation, Lightness) color space
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
  selector: 'app-hsl-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule, GamutAwareSliderComponent],
  templateUrl: './hsl-sliders.component.html',
  styleUrls: ['./hsl-sliders.component.scss'],
})
export class HslSlidersComponent implements OnInit, OnDestroy {
  color = input<string>('hsl(0, 100%, 50%)');
  gamut = input<string>('sRGB');
  @Output() colorChange = new EventEmitter<string>();

  // HSL values - current actual values
  h: number = 0; // Hue: 0-360
  s: number = 100; // Saturation: 0-100
  l: number = 50; // Lightness: 0-100

  // HSL baseline values for gradient generation (don't change during dragging)
  baselineH: number = 0;
  baselineS: number = 100;
  baselineL: number = 50;

  // Gradient backgrounds for sliders (deprecated, kept for compatibility)
  hGradient: string = '';
  sGradient: string = '';
  lGradient: string = '';

  // Valid positions for snapping (stores positions where colors are in-gamut)
  validHPositions: number[] = [];
  validSPositions: number[] = [];
  validLPositions: number[] = [];

  // Signals for H/S/L values to make them reactive
  hSignal = signal(0);
  sSignal = signal(100);
  lSignal = signal(50);

  // Color generator functions for canvas rendering - computed to trigger changes
  hColorGenerator = computed(() => {
    const s = this.sSignal();
    const l = this.lSignal();
    return (position: number) =>
      `hsl(${Math.round(position)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  });

  sColorGenerator = computed(() => {
    const h = this.hSignal();
    const l = this.lSignal();
    return (position: number) =>
      `hsl(${Math.round(h)}, ${Math.round(position)}%, ${Math.round(l)}%)`;
  });

  lColorGenerator = computed(() => {
    const h = this.hSignal();
    const s = this.sSignal();
    return (position: number) =>
      `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(position)}%)`;
  });

  // Debounced update subjects
  private hUpdate$ = new Subject<number>();
  private sUpdate$ = new Subject<number>();
  private lUpdate$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  // Dev flag to show/hide CSS gradient divs
  showDebugGradients = false; // Set to true for development debugging

  // Math object for templates
  protected Math = Math;

  // Value formatters for display
  formatH = (v: number) => Math.round(v).toString() + '°';
  formatS = (v: number) => Math.round(v).toString() + '%';
  formatL = (v: number) => Math.round(v).toString() + '%';

  constructor(private gamutService: GamutService) {
    // Effect to handle color changes - updates baseline values
    effect(() => {
      const currentColor = this.color();
      if (currentColor && currentColor.trim()) {
        this.parseColor(); // This updates baseline values
        this.generateGradients();
      }
    });

    // Effect to handle gamut changes - regenerates gradients with new gamut
    effect(() => {
      const currentGamut = this.gamut();
      console.log('[HslSliders] Gamut changed to:', currentGamut);
      this.generateGradients();
    });
  }

  ngOnInit() {
    this.setupDebouncing();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Parse HSL color string to extract H, S, L values
   */
  private parseColor() {
    try {
      const colorValue = this.color();
      console.log('[HslSliders] Parsing color:', colorValue);
      const match = colorValue.match(
        /hsl\((\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/
      );
      if (match) {
        this.h = parseFloat(match[1]);
        this.s = parseFloat(match[2]);
        this.l = parseFloat(match[3]);

        console.log('[HslSliders] Parsed values:', {
          h: this.h,
          s: this.s,
          l: this.l,
        });

        // Update signals for reactive canvas updates
        this.hSignal.set(this.h);
        this.sSignal.set(this.s);
        this.lSignal.set(this.l);

        // Update baseline values for gradient generation
        this.baselineH = this.h;
        this.baselineS = this.s;
        this.baselineL = this.l;
      } else {
        console.log('[HslSliders] Failed to parse color:', colorValue);
      }
    } catch (error) {
      console.error('HSL parse error:', error);
    }
  }

  /**
   * Setup debounced updates for smooth slider interactions
   */
  private setupDebouncing() {
    // No debounce for instant gradient updates (0ms = immediate)
    this.hUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });

    this.sUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });

    this.lUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });
  }

  /**
   * Handle hue slider input (live updates)
   */
  onHInput(value: number) {
    this.h = value;
    this.hSignal.set(value);
    this.hUpdate$.next(value);
  }

  /**
   * Handle hue slider change (final value)
   */
  onHChange() {
    // Snap to nearest valid position
    this.h = this.snapToValidPosition(this.h, this.validHPositions);
    this.hSignal.set(this.h);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle saturation slider input (live updates)
   */
  onSInput(value: number) {
    this.s = value;
    this.sSignal.set(value);
    this.sUpdate$.next(value);
  }

  /**
   * Handle saturation slider change (final value)
   */
  onSChange() {
    // Snap to nearest valid position
    this.s = this.snapToValidPosition(this.s, this.validSPositions);
    this.sSignal.set(this.s);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle lightness slider input (live updates)
   */
  onLInput(value: number) {
    this.l = value;
    this.lSignal.set(value);
    this.lUpdate$.next(value);
  }

  /**
   * Handle lightness slider change (final value)
   */
  onLChange() {
    // Snap to nearest valid position
    this.l = this.snapToValidPosition(this.l, this.validLPositions);
    this.lSignal.set(this.l);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Generate HSL gradient backgrounds for debugging
   */
  private generateGradients() {
    const baselineColor = `hsl(${this.baselineH}, ${this.baselineS}%, ${this.baselineL}%)`;
    const currentGamut = this.gamut();

    console.log('[HslSliders] Generating gradients:', {
      baselineColor,
      currentGamut,
      actualValues: { h: this.h, s: this.s, l: this.l },
    });

    // Generate CSS gradients for debugging
    const steps = 10;

    // Hue gradient (0-360)
    const hStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 360;
      hStops.push(
        `hsl(${Math.round(value)}, ${this.baselineS}%, ${this.baselineL}%)`
      );
    }
    this.hGradient = `linear-gradient(to right, ${hStops.join(', ')})`;

    // Saturation gradient (0-100%)
    const sStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 100;
      sStops.push(
        `hsl(${this.baselineH}, ${Math.round(value)}%, ${this.baselineL}%)`
      );
    }
    this.sGradient = `linear-gradient(to right, ${sStops.join(', ')})`;

    // Lightness gradient (0-100%)
    const lStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 100;
      lStops.push(
        `hsl(${this.baselineH}, ${this.baselineS}%, ${Math.round(value)}%)`
      );
    }
    this.lGradient = `linear-gradient(to right, ${lStops.join(', ')})`;
  }

  /**
   * Emit the current HSL color as a formatted string
   */
  private emitColorChange() {
    const hslColor = `hsl(${Math.round(this.h)}, ${Math.round(
      this.s
    )}%, ${Math.round(this.l)}%)`;
    this.colorChange.emit(hslColor);
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
