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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GamutService } from '../../services/gamut.service';

@Component({
  selector: 'app-oklch-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './oklch-sliders.component.html',
  styleUrls: ['./oklch-sliders.component.scss'],
})
export class OklchSlidersComponent implements OnInit, OnDestroy {
  @Input() color: string = 'oklch(0.5 0.1 180)';
  @Input() gamut: string = 'sRGB';
  @Output() colorChange = new EventEmitter<string>();

  // OKLCH values (normalized)
  l: number = 0.5;
  c: number = 0.1;
  h: number = 180;

  // Gradient backgrounds for sliders
  lGradient: string = '';
  cGradient: string = '';
  hGradient: string = '';

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
      const match = this.color.match(
        /oklch\((\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\)/
      );
      if (match) {
        this.l = parseFloat(match[1]);
        this.c = parseFloat(match[2]);
        this.h = parseFloat(match[3]);
      }
    } catch (error) {
      console.error('OKLCH parse error:', error);
    }
  }

  /**
   * Setup debounced updates for smooth slider interactions
   */
  private setupDebouncing() {
    // Debounce slider inputs (16ms for 60fps)
    this.lUpdate$
      .pipe(debounceTime(16), takeUntil(this.destroy$))
      .subscribe(() => this.emitColorChange());

    this.cUpdate$
      .pipe(debounceTime(16), takeUntil(this.destroy$))
      .subscribe(() => this.emitColorChange());

    this.hUpdate$
      .pipe(debounceTime(16), takeUntil(this.destroy$))
      .subscribe(() => this.emitColorChange());
  }

  /**
   * Generate gradients for all sliders based on current values
   */
  private generateGradients() {
    const currentColor = `oklch(${this.l} ${this.c} ${this.h})`;

    // Lightness gradient (0-1)
    this.lGradient = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'l',
      currentColor,
      gamut: this.gamut,
      min: 0,
      max: 1,
      steps: 50,
    }).cssGradient;

    // Chroma gradient (0-0.4)
    this.cGradient = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'c',
      currentColor,
      gamut: this.gamut,
      min: 0,
      max: 0.4,
      steps: 50,
    }).cssGradient;

    // Hue gradient (0-360)
    this.hGradient = this.gamutService.generateSliderGradient({
      format: 'oklch',
      channel: 'h',
      currentColor,
      gamut: this.gamut,
      min: 0,
      max: 360,
      steps: 50,
    }).cssGradient;
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
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Emit color change event
   */
  private emitColorChange() {
    const oklchColor = `oklch(${this.l.toFixed(3)} ${this.c.toFixed(3)} ${
      this.h
    })`;
    this.colorChange.emit(oklchColor);
  }
}
