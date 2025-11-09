/**
 * RGB Sliders Component
 *
 * Provides sliders for RGB (Red, Green, Blue) color space
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
  selector: 'app-rgb-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule, GamutAwareSliderComponent],
  templateUrl: './rgb-sliders.component.html',
  styleUrls: ['./rgb-sliders.component.scss'],
})
export class RgbSlidersComponent implements OnInit, OnDestroy {
  color = input<string>('rgb(255, 0, 0)');
  gamut = input<string>('sRGB');
  @Output() colorChange = new EventEmitter<string>();

  // RGB values (0-255) - current actual values
  r: number = 255;
  g: number = 0;
  b: number = 0;

  // RGB baseline values for gradient generation (don't change during dragging)
  baselineR: number = 255;
  baselineG: number = 0;
  baselineB: number = 0;

  // Gradient backgrounds for sliders (deprecated, kept for compatibility)
  rGradient: string = '';
  gGradient: string = '';
  bGradient: string = '';

  // Valid positions for snapping (stores positions where colors are in-gamut)
  validRPositions: number[] = [];
  validGPositions: number[] = [];
  validBPositions: number[] = [];

  // Signals for R/G/B values to make them reactive
  rSignal = signal(255);
  gSignal = signal(0);
  bSignal = signal(0);

  // Color generator functions for canvas rendering - computed to trigger changes
  rColorGenerator = computed(() => {
    const g = this.gSignal();
    const b = this.bSignal();
    return (position: number) =>
      `rgb(${Math.round(position)}, ${Math.round(g)}, ${Math.round(b)})`;
  });

  gColorGenerator = computed(() => {
    const r = this.rSignal();
    const b = this.bSignal();
    return (position: number) =>
      `rgb(${Math.round(r)}, ${Math.round(position)}, ${Math.round(b)})`;
  });

  bColorGenerator = computed(() => {
    const r = this.rSignal();
    const g = this.gSignal();
    return (position: number) =>
      `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(position)})`;
  });

  // Debounced update subjects
  private rUpdate$ = new Subject<number>();
  private gUpdate$ = new Subject<number>();
  private bUpdate$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  // Dev flag to show/hide CSS gradient divs
  showDebugGradients = false; // Set to true for development debugging

  // Math object for templates
  protected Math = Math;

  // Value formatters for display
  formatR = (v: number) => Math.round(v).toString();
  formatG = (v: number) => Math.round(v).toString();
  formatB = (v: number) => Math.round(v).toString();

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
      console.log('[RgbSliders] Gamut changed to:', currentGamut);
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
   * Parse RGB color string to extract R, G, B values
   */
  private parseColor() {
    try {
      const colorValue = this.color();
      console.log('[RgbSliders] Parsing color:', colorValue);
      const match = colorValue.match(
        /rgb\((\d+\.?\d*),\s*(\d+\.?\d*),\s*(\d+\.?\d*)\)/
      );
      if (match) {
        this.r = parseFloat(match[1]);
        this.g = parseFloat(match[2]);
        this.b = parseFloat(match[3]);

        console.log('[RgbSliders] Parsed values:', {
          r: this.r,
          g: this.g,
          b: this.b,
        });

        // Update signals for reactive canvas updates
        this.rSignal.set(this.r);
        this.gSignal.set(this.g);
        this.bSignal.set(this.b);

        // Update baseline values for gradient generation
        this.baselineR = this.r;
        this.baselineG = this.g;
        this.baselineB = this.b;
      } else {
        console.log('[RgbSliders] Failed to parse color:', colorValue);
      }
    } catch (error) {
      console.error('RGB parse error:', error);
    }
  }

  /**
   * Setup debounced updates for smooth slider interactions
   */
  private setupDebouncing() {
    // No debounce for instant gradient updates (0ms = immediate)
    this.rUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });

    this.gUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });

    this.bUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitColorChange();
      });
  }

  /**
   * Handle red slider input (live updates)
   */
  onRInput(value: number) {
    this.r = value;
    this.rSignal.set(value);
    this.rUpdate$.next(value);
  }

  /**
   * Handle red slider change (final value)
   */
  onRChange() {
    // Snap to nearest valid position
    this.r = this.snapToValidPosition(this.r, this.validRPositions);
    this.rSignal.set(this.r);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle green slider input (live updates)
   */
  onGInput(value: number) {
    this.g = value;
    this.gSignal.set(value);
    this.gUpdate$.next(value);
  }

  /**
   * Handle green slider change (final value)
   */
  onGChange() {
    // Snap to nearest valid position
    this.g = this.snapToValidPosition(this.g, this.validGPositions);
    this.gSignal.set(this.g);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle blue slider input (live updates)
   */
  onBInput(value: number) {
    this.b = value;
    this.bSignal.set(value);
    this.bUpdate$.next(value);
  }

  /**
   * Handle blue slider change (final value)
   */
  onBChange() {
    // Snap to nearest valid position
    this.b = this.snapToValidPosition(this.b, this.validBPositions);
    this.bSignal.set(this.b);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Generate RGB gradient backgrounds for debugging
   */
  private generateGradients() {
    const baselineColor = `rgb(${this.baselineR}, ${this.baselineG}, ${this.baselineB})`;
    const currentGamut = this.gamut();

    console.log('[RgbSliders] Generating gradients:', {
      baselineColor,
      currentGamut,
      actualValues: { r: this.r, g: this.g, b: this.b },
    });

    // Generate CSS gradients for debugging
    const steps = 10;

    // Red gradient
    const rStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 255;
      rStops.push(
        `rgb(${Math.round(value)}, ${this.baselineG}, ${this.baselineB})`
      );
    }
    this.rGradient = `linear-gradient(to right, ${rStops.join(', ')})`;

    // Green gradient
    const gStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 255;
      gStops.push(
        `rgb(${this.baselineR}, ${Math.round(value)}, ${this.baselineB})`
      );
    }
    this.gGradient = `linear-gradient(to right, ${gStops.join(', ')})`;

    // Blue gradient
    const bStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * 255;
      bStops.push(
        `rgb(${this.baselineR}, ${this.baselineG}, ${Math.round(value)})`
      );
    }
    this.bGradient = `linear-gradient(to right, ${bStops.join(', ')})`;
  }

  /**
   * Emit the current RGB color as a formatted string
   */
  private emitColorChange() {
    const rgbColor = `rgb(${Math.round(this.r)}, ${Math.round(
      this.g
    )}, ${Math.round(this.b)})`;
    this.colorChange.emit(rgbColor);
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
