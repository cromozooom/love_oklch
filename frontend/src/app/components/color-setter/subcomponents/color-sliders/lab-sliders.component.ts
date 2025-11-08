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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GamutService } from '../../services/gamut.service';

@Component({
  selector: 'app-lab-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lab-sliders.component.html',
  styleUrls: ['./lab-sliders.component.scss'],
})
export class LabSlidersComponent implements OnInit, OnDestroy {
  @Input() color: string = 'lab(50 0 0)';
  @Input() gamut: string = 'sRGB';
  @Output() colorChange = new EventEmitter<string>();

  // LAB values
  l: number = 50;
  a: number = 0;
  b: number = 0;

  // Gradient backgrounds for sliders
  lGradient: string = '';
  aGradient: string = '';
  bGradient: string = '';

  // Debounced update subjects
  private lUpdate$ = new Subject<number>();
  private aUpdate$ = new Subject<number>();
  private bUpdate$ = new Subject<number>();
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
   * Parse LAB color string to extract L, A, B values
   */
  private parseColor() {
    try {
      const match = this.color.match(
        /lab\((\d+\.?\d*)\s+([-]?\d+\.?\d*)\s+([-]?\d+\.?\d*)\)/
      );
      if (match) {
        this.l = parseFloat(match[1]);
        this.a = parseFloat(match[2]);
        this.b = parseFloat(match[3]);
      }
    } catch (error) {
      console.error('LAB parse error:', error);
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

    this.aUpdate$
      .pipe(debounceTime(16), takeUntil(this.destroy$))
      .subscribe(() => this.emitColorChange());

    this.bUpdate$
      .pipe(debounceTime(16), takeUntil(this.destroy$))
      .subscribe(() => this.emitColorChange());
  }

  /**
   * Generate gradients for all sliders based on current values
   */
  private generateGradients() {
    const currentColor = `lab(${this.l} ${this.a} ${this.b})`;

    // Lightness gradient (0-100)
    this.lGradient = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'l',
      currentColor,
      gamut: this.gamut,
      min: 0,
      max: 100,
      steps: 50,
    }).cssGradient;

    // A gradient (-125 to +125)
    this.aGradient = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'a',
      currentColor,
      gamut: this.gamut,
      min: -125,
      max: 125,
      steps: 50,
    }).cssGradient;

    // B gradient (-125 to +125)
    this.bGradient = this.gamutService.generateSliderGradient({
      format: 'lab',
      channel: 'b',
      currentColor,
      gamut: this.gamut,
      min: -125,
      max: 125,
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
   * Handle A slider input (live updates)
   */
  onAInput() {
    this.aUpdate$.next(this.a);
  }

  /**
   * Handle A slider change (final value)
   */
  onAChange() {
    this.generateGradients();
    this.emitColorChange();
  }

  /**
   * Handle B slider input (live updates)
   */
  onBInput() {
    this.bUpdate$.next(this.b);
  }

  /**
   * Handle B slider change (final value)
   */
  onBChange() {
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
