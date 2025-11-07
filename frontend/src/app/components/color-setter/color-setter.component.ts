import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import Color from 'colorjs.io';

import { ColorService } from './services/color.service';
import { ColorFormat, FORMAT_CONFIGS } from './models/format-config.model';
import { GamutProfile, GAMUT_PROFILES } from './models/gamut-profile.model';
import { ColorState } from './models/color-state.model';
import { ColorValidators } from './utils/color-validators';

/**
 * Event payload emitted when color changes
 */
export interface ColorChangeEvent {
  /**
   * Internal OKLCH representation for storage
   */
  value: Color;

  /**
   * Color in all formats
   */
  formats: Record<ColorFormat, string>;

  /**
   * Current display format
   */
  format: ColorFormat;

  /**
   * Current gamut profile
   */
  gamut: GamutProfile;

  /**
   * Timestamp of change
   */
  timestamp: number;

  /**
   * Human-readable color name (if enabled and available)
   */
  name?: string;

  /**
   * Gamut status (if US3 enabled)
   */
  gamutStatus?: {
    inGamut: boolean;
    profile: GamutProfile;
    warning?: string;
  };

  /**
   * WCAG contrast results (if US2 enabled)
   */
  wcagResults?: any; // Type from US2 phase
}

/**
 * ColorSetterComponent - User Story 1: Basic Color Selection
 *
 * Provides a unified interface for selecting and previewing colors across multiple color spaces.
 * Supports HEX, RGB, HSL formats with real-time visual feedback and format preservation.
 *
 * User Story 1 (MVP) Features:
 * - Select colors using HEX, RGB, or HSL formats
 * - Real-time color preview
 * - Format switching with color preservation
 * - Input validation with silent clamping
 * - 60fps slider interactions
 *
 * @example
 * ```html
 * <app-color-setter
 *   [initialColor]="'#FF0000'"
 *   [initialFormat]="'hex'"
 *   [showWCAG]="true"
 *   (colorChange)="onColorChange($event)"
 * ></app-color-setter>
 * ```
 */
@Component({
  selector: 'app-color-setter',
  template: `
    <div class="color-setter-container" data-testid="color-setter-component">
      <!-- Color Preview -->
      <div class="color-preview-section">
        <div
          class="color-sample"
          [style.backgroundColor]="colorPreview()"
          data-testid="color-preview"
        ></div>
        <div class="color-info">
          <div class="color-value" data-testid="display-value">
            {{ currentFormatValue() }}
          </div>
        </div>
      </div>

      <!-- Format Selector -->
      <div class="format-selector-section">
        <div class="format-buttons">
          <button
            *ngFor="let fmt of availableFormats"
            [class.active]="format() === fmt"
            (click)="switchFormat(fmt)"
            [attr.data-testid]="'format-selector-' + fmt"
            class="format-btn"
          >
            {{ getFormatLabel(fmt) }}
          </button>
        </div>
      </div>

      <!-- Color Input Controls -->
      <div class="color-controls-section">
        <!-- HEX Input -->
        <div *ngIf="format() === 'hex'" class="hex-controls">
          <input
            type="text"
            [(ngModel)]="hexInputValue"
            (change)="onHexChange()"
            (blur)="onHexChange()"
            data-testid="hex-input"
            placeholder="#FF0000"
            class="hex-input"
          />
        </div>

        <!-- RGB Sliders -->
        <div *ngIf="format() === 'rgb'" class="rgb-controls">
          <div class="slider-group">
            <label>Red</label>
            <input
              type="range"
              min="0"
              max="255"
              [(ngModel)]="rgbValues[0]"
              (change)="onRgbChange()"
              (input)="onRgbInput()"
              data-testid="rgb-slider-r"
              class="slider"
            />
            <span class="value-display" data-testid="rgb-value-r">
              {{ Math.round(rgbValues[0]) }}
            </span>
          </div>

          <div class="slider-group">
            <label>Green</label>
            <input
              type="range"
              min="0"
              max="255"
              [(ngModel)]="rgbValues[1]"
              (change)="onRgbChange()"
              (input)="onRgbInput()"
              data-testid="rgb-slider-g"
              class="slider"
            />
            <span class="value-display" data-testid="rgb-value-g">
              {{ Math.round(rgbValues[1]) }}
            </span>
          </div>

          <div class="slider-group">
            <label>Blue</label>
            <input
              type="range"
              min="0"
              max="255"
              [(ngModel)]="rgbValues[2]"
              (change)="onRgbChange()"
              (input)="onRgbInput()"
              data-testid="rgb-slider-b"
              class="slider"
            />
            <span class="value-display" data-testid="rgb-value-b">
              {{ Math.round(rgbValues[2]) }}
            </span>
          </div>

          <div class="rgb-display" data-testid="rgb-display">
            rgb({{ Math.round(rgbValues[0]) }}, {{ Math.round(rgbValues[1]) }},
            {{ Math.round(rgbValues[2]) }})
          </div>
        </div>

        <!-- HSL Sliders -->
        <div *ngIf="format() === 'hsl'" class="hsl-controls">
          <div class="slider-group">
            <label>Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              [(ngModel)]="hslValues[0]"
              (change)="onHslChange()"
              (input)="onHslInput()"
              data-testid="hsl-slider-h"
              class="slider"
            />
            <span class="value-display">{{ Math.round(hslValues[0]) }}°</span>
          </div>

          <div class="slider-group">
            <label>Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              [(ngModel)]="hslValues[1]"
              (change)="onHslChange()"
              (input)="onHslInput()"
              data-testid="hsl-slider-s"
              class="slider"
            />
            <span class="value-display">{{ Math.round(hslValues[1]) }}%</span>
          </div>

          <div class="slider-group">
            <label>Lightness</label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              [(ngModel)]="hslValues[2]"
              (change)="onHslChange()"
              (input)="onHslInput()"
              data-testid="hsl-slider-l"
              class="slider"
            />
            <span class="value-display">{{ Math.round(hslValues[2]) }}%</span>
          </div>

          <div class="hsl-display" data-testid="hsl-display">
            hsl({{ Math.round(hslValues[0]) }}, {{ Math.round(hslValues[1]) }}%,
            {{ Math.round(hslValues[2]) }}%)
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .color-setter-container {
        padding: 1rem;
        border-radius: 0.5rem;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .color-preview-section {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .color-sample {
        width: 100px;
        height: 100px;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        transition: background-color 0.016s linear;
      }

      .color-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .color-value {
        font-size: 1.5rem;
        font-weight: bold;
        font-family: monospace;
      }

      .format-selector-section {
        margin-bottom: 1rem;
      }

      .format-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .format-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .format-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .hex-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 1rem;
      }

      .slider-group {
        display: grid;
        grid-template-columns: 1fr 1fr 4rem;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }

      .slider-group label {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .slider {
        width: 100%;
        cursor: pointer;
      }

      .value-display {
        font-family: monospace;
        text-align: right;
      }

      .rgb-display,
      .hsl-display {
        padding: 0.5rem;
        background: #f9fafb;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 0.875rem;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [ColorService],
})
export class ColorSetterComponent implements OnInit {
  // ============================================================================
  // INPUTS
  // ============================================================================

  /**
   * Initial color value (any supported format)
   * Default: #FF0000 (red)
   */
  @Input()
  initialColor: string = '#FF0000';

  /**
   * Initial display format
   * Default: hex
   */
  @Input()
  initialFormat: ColorFormat = 'hex';

  /**
   * Initial gamut profile
   * Default: srgb
   */
  @Input()
  initialGamut: GamutProfile = 'srgb';

  /**
   * Show WCAG accessibility panel (User Story 2)
   * Default: false
   */
  @Input()
  showWCAG: boolean = false;

  /**
   * Show color name display (User Story 3 enhancement)
   * Default: false
   */
  @Input()
  showColorName: boolean = false;

  /**
   * Supported gamut profiles to show in selector
   * Default: ['srgb', 'display-p3', 'unlimited']
   */
  @Input()
  supportedGamuts: GamutProfile[] = ['srgb', 'display-p3', 'unlimited'];

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  /**
   * Emitted when color changes
   */
  @Output()
  colorChange = new EventEmitter<ColorChangeEvent>();

  // ============================================================================
  // REACTIVE STATE (Angular Signals)
  // ============================================================================

  // Internal color state
  private colorState = signal<ColorState>({
    internalValue: new Color('#FF0000'),
    format: 'hex',
    gamut: 'srgb',
    lastUpdated: Date.now(),
  });

  // Current format
  format = signal<ColorFormat>('hex');

  // Current gamut
  gamut = signal<GamutProfile>('srgb');

  // Slider values for RGB (0-255) - regular property for ngModel binding
  rgbValues: [number, number, number] = [255, 0, 0];

  // Slider values for HSL (H: 0-360, S: 0-100, L: 0-100) - regular property for ngModel binding
  hslValues: [number, number, number] = [0, 100, 50];

  // HEX input value
  hexInputValue = signal<string>('#FF0000');

  // Available formats for selection
  availableFormats: ColorFormat[] = ['hex', 'rgb', 'hsl'];

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  colorPreview = computed(() => {
    const state = this.colorState();
    try {
      const rgb = state.internalValue.to('srgb');
      const [r, g, b] = rgb.coords.map((c) => Math.round(c * 255));
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return '#FF0000';
    }
  });

  currentFormatValue = computed(() => {
    const fmt = this.format();
    try {
      switch (fmt) {
        case 'hex':
          return this.hexInputValue();
        case 'rgb':
          return `rgb(${this.rgbValues.map((v) => Math.round(v)).join(', ')})`;
        case 'hsl':
          const [h, s, l] = this.hslValues;
          return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
        default:
          return this.hexInputValue();
      }
    } catch {
      return '#FF0000';
    }
  });

  // ============================================================================
  // DEBOUNCED CHANGE SUBJECT
  // ============================================================================

  private colorChangeSubject = new Subject<ColorChangeEvent>();

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(private colorService: ColorService) {
    // Setup debounced color change (16ms for 60fps)
    this.colorChangeSubject.pipe(debounceTime(16)).subscribe((event) => {
      this.colorChange.emit(event);
    });

    // Effect to update state on initialization
    effect(() => {
      const state = this.colorState();
      // Sync format and gamut signals
      this.format.set(state.format);
      this.gamut.set(state.gamut);
    });
  }

  ngOnInit(): void {
    try {
      // Parse initial color
      const parsed = this.colorService.parse(this.initialColor);
      const allFormats = this.colorService.toAllFormats(parsed);

      // Update state
      this.colorState.set({
        internalValue: parsed,
        format: this.initialFormat,
        gamut: this.initialGamut,
        lastUpdated: Date.now(),
      });

      // Update display values based on format
      this.updateDisplayValues();
    } catch (error) {
      console.error('Failed to initialize color:', error);
      // Fall back to red
      this.initializeToDefault();
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  onHexChange(): void {
    try {
      const hex = this.hexInputValue();

      // Validate HEX format
      if (!ColorValidators.isValidHex(hex)) {
        // Revert to previous value
        const state = this.colorState();
        this.hexInputValue.set(
          this.colorService.convert(state.internalValue, 'hex')
        );
        return;
      }

      // Parse and update internal state
      const parsed = this.colorService.parse(hex);
      const normalized = this.colorService.convert(parsed, 'hex');

      this.updateColorState(parsed, 'hex');
      this.hexInputValue.set(normalized);
    } catch (error) {
      console.error('Invalid HEX color:', error);
      // Revert to previous
      const state = this.colorState();
      this.hexInputValue.set(
        this.colorService.convert(state.internalValue, 'hex')
      );
    }
  }

  onRgbInput(): void {
    // Real-time update without debounce
    this.updateRgbFromSliders();
  }

  onRgbChange(): void {
    // Final update with debounce
    this.updateRgbFromSliders();
    this.emitColorChange();
  }

  onHslInput(): void {
    // Real-time update without debounce
    this.updateHslFromSliders();
  }

  onHslChange(): void {
    // Final update with debounce
    this.updateHslFromSliders();
    this.emitColorChange();
  }

  switchFormat(newFormat: ColorFormat): void {
    try {
      const state = this.colorState();

      // Update format
      this.colorState.update((s) => ({ ...s, format: newFormat }));
      this.format.set(newFormat);

      // Update display values
      this.updateDisplayValues();

      // Emit change event
      this.emitColorChange();
    } catch (error) {
      console.error('Error switching format:', error);
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private updateRgbFromSliders(): void {
    try {
      const [r, g, b] = this.rgbValues;
      const rgbString = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
        b
      )})`;

      const parsed = this.colorService.parse(rgbString);
      this.updateColorState(parsed, 'rgb');
    } catch (error) {
      console.error('Error updating RGB:', error);
    }
  }

  private updateHslFromSliders(): void {
    try {
      const [h, s, l] = this.hslValues;
      const hslString = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(
        l
      )}%)`;

      const parsed = this.colorService.parse(hslString);
      this.updateColorState(parsed, 'hsl');
    } catch (error) {
      console.error('Error updating HSL:', error);
    }
  }

  private updateColorState(color: Color, format: ColorFormat): void {
    this.colorState.update((state) => ({
      ...state,
      internalValue: color,
      format,
      lastUpdated: Date.now(),
    }));

    this.updateDisplayValues();
  }

  private updateDisplayValues(): void {
    const state = this.colorState();
    const allFormats = this.colorService.toAllFormats(state.internalValue);

    // Update HEX display
    this.hexInputValue.set(allFormats.hex);

    // Update RGB sliders
    const rgbChannels = this.colorService.getChannels(
      state.internalValue,
      'rgb'
    );
    this.rgbValues = [rgbChannels[0], rgbChannels[1], rgbChannels[2]];

    // Update HSL sliders
    const hslChannels = this.colorService.getChannels(
      state.internalValue,
      'hsl'
    );
    this.hslValues = [hslChannels[0], hslChannels[1], hslChannels[2]];
  }

  private emitColorChange(): void {
    const state = this.colorState();
    const allFormats = this.colorService.toAllFormats(state.internalValue);

    const event: ColorChangeEvent = {
      value: state.internalValue,
      formats: allFormats,
      format: state.format,
      gamut: state.gamut,
      timestamp: Date.now(),
    };

    this.colorChangeSubject.next(event);
  }

  private initializeToDefault(): void {
    const red = new Color('#FF0000');

    this.colorState.set({
      internalValue: red,
      format: 'hex',
      gamut: 'srgb',
      lastUpdated: Date.now(),
    });

    this.updateDisplayValues();
  }

  getFormatLabel(format: ColorFormat): string {
    return FORMAT_CONFIGS[format].displayName;
  }

  protected readonly Math = Math;
}
