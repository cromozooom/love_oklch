/**
 * LAB Sliders Component
 *
 * Provides sliders for LAB (Lightness, A, B) color space
 * with gamut-aware gradient visualization.
 * LAB is a perceptually uniform color space.
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
  selector: 'app-lab-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule, GamutAwareSliderComponent],
  templateUrl: './lab-sliders.component.html',
  styleUrls: ['./lab-sliders.component.scss'],
})
export class LabSlidersComponent implements OnInit, OnDestroy {
  color = input<string>('lab(50 0 0)');
  gamut = input<string>('sRGB');
  @Output() colorChange = new EventEmitter<string>();

  // LAB values (normalized) - current actual values
  l: number = 50;
  a: number = 0;
  b: number = 0;

  // LAB baseline values for gradient generation (don't change during dragging)
  baselineL: number = 50;
  baselineA: number = 0;
  baselineB: number = 0;

  // Gradient backgrounds for sliders (deprecated, kept for compatibility)
  lGradient: string = '';
  aGradient: string = '';
  bGradient: string = '';

  // Valid positions for snapping (stores positions where colors are in-gamut)
  validLPositions: number[] = [];
  validAPositions: number[] = [];
  validBPositions: number[] = [];

  // Signals for L/A/B values to make them reactive
  lSignal = signal(50);
  aSignal = signal(0);
  bSignal = signal(0);

  // Color generator functions for canvas rendering - computed to trigger changes
  lColorGenerator = computed(() => {
    const a = this.aSignal();
    const b = this.bSignal();
    return (position: number) => `lab(${position} ${a} ${b})`;
  });

  aColorGenerator = computed(() => {
    const l = this.lSignal();
    const b = this.bSignal();
    return (position: number) => `lab(${l} ${position} ${b})`;
  });

  bColorGenerator = computed(() => {
    const l = this.lSignal();
    const a = this.aSignal();
    return (position: number) => `lab(${l} ${a} ${position})`;
  });

  // Debounced update subjects
  private lUpdate$ = new Subject<number>();
  private aUpdate$ = new Subject<number>();
  private bUpdate$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  // Math for template
  Math = Math;

  // Dev flag to show/hide CSS gradient divs
  showDebugGradients = false; // Set to true for development debugging

  // Value formatters for display
  formatL = (v: number) => v.toFixed(2);
  formatA = (v: number) => v.toFixed(2);
  formatB = (v: number) => v.toFixed(2);

  constructor(private gamutService: GamutService) {
    // Effect to handle color changes - updates baseline values
    effect(() => {
      const currentColor = this.color();
      if (currentColor && currentColor.trim()) {
        this.parseColor(); // This updates baseline values
        this.generateGradients();
      }
    }); // Effect to handle gamut changes - regenerates gradients with new gamut
    effect(() => {
      const currentGamut = this.gamut();
      console.log('[LabSliders] Gamut changed to:', currentGamut);
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
   * Parse LAB color string to extract L, A, B values
   */
  private parseColor() {
    try {
      const colorValue = this.color();
      console.log('[LabSliders] Parsing color:', colorValue);
      const match = colorValue.match(
        /lab\((\d+\.?\d*)\s+([-]?\d+\.?\d*)\s+([-]?\d+\.?\d*)\)/
      );
      if (match) {
        this.l = parseFloat(match[1]);
        this.a = parseFloat(match[2]);
        this.b = parseFloat(match[3]);

        console.log('[LabSliders] Parsed values:', {
          l: this.l,
          a: this.a,
          b: this.b,
        });

        // Update signals for reactive canvas updates
        this.lSignal.set(this.l);
        this.aSignal.set(this.a);
        this.bSignal.set(this.b);

        // Update baseline values for gradient generation
        this.baselineL = this.l;
        this.baselineA = this.a;
        this.baselineB = this.b;
      } else {
        console.log('[LabSliders] Failed to parse color:', colorValue);
      }
    } catch (error) {
      console.error('LAB parse error:', error);
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

    this.aUpdate$
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        // Don't regenerate gradients during slider dragging - prevents feedback loop
        this.emitColorChange();
      });

    this.bUpdate$
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
    const baselineColor = `lab(${this.baselineL} ${this.baselineA} ${this.baselineB})`;
    const currentGamut = this.gamut();

    console.log('[LabSliders] Generating gradients:', {
      baselineColor,
      currentGamut,
      actualValues: { l: this.l, a: this.a, b: this.b },
    });

    // Lightness gradient (0-100) with 100 steps
    const lGradientData = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'l',
      currentColor: baselineColor,
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

    // A gradient (-125 to +125) with 100 steps
    const aGradientData = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'a',
      currentColor: baselineColor,
      gamut: currentGamut,
      min: -125,
      max: 125,
      steps: 100,
    });
    this.aGradient = this.generateGradientWithTransparency(aGradientData.stops);
    this.validAPositions = this.extractValidPositions(
      aGradientData.stops,
      -125,
      125
    );

    // B gradient (-125 to +125) with 100 steps
    const bGradientData = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'b',
      currentColor: baselineColor,
      gamut: currentGamut,
      min: -125,
      max: 125,
      steps: 100,
    });
    this.bGradient = this.generateGradientWithTransparency(bGradientData.stops);
    this.validBPositions = this.extractValidPositions(
      bGradientData.stops,
      -125,
      125
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
   * Handle A slider input (live updates)
   */
  onAInput(value: number) {
    this.a = value; // Update component property immediately
    this.aSignal.set(value); // Update signal for reactive canvas updates
    this.aUpdate$.next(value);
  }

  /**
   * Handle A slider change (final value)
   */
  onAChange() {
    // Snap to nearest valid position
    this.a = this.snapToValidPosition(this.a, this.validAPositions);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle B slider input (live updates)
   */
  onBInput(value: number) {
    this.b = value; // Update component property immediately
    this.bSignal.set(value); // Update signal for reactive canvas updates
    this.bUpdate$.next(value);
  }

  /**
   * Handle B slider change (final value)
   */
  onBChange() {
    // Snap to nearest valid position
    this.b = this.snapToValidPosition(this.b, this.validBPositions);
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Emit color change event
   */
  private emitColorChange() {
    const labColor = `lab(${this.l.toFixed(2)} ${this.a.toFixed(
      2
    )} ${this.b.toFixed(2)})`;
    this.colorChange.emit(labColor);
  }
}
