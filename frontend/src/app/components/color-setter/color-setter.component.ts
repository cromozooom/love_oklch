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
import { WCAGService } from './services/wcag.service';
import { GamutService } from './services/gamut.service';
import { ColorFormat, FORMAT_CONFIGS } from './models/format-config.model';
import { GamutProfile, GAMUT_PROFILES } from './models/gamut-profile.model';
import { ColorState } from './models/color-state.model';
import { WCAGAnalysis } from './models/wcag-contrast.model';
import { ColorValidators } from './utils/color-validators';
import { WCAGPanelComponent } from './subcomponents/wcag-panel/wcag-panel.component';
import { GamutSelectorComponent } from './subcomponents/gamut-selector/gamut-selector.component';

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
  wcagResults?: WCAGAnalysis;
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
  templateUrl: './color-setter.component.html',
  styleUrl: './color-setter.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, WCAGPanelComponent, GamutSelectorComponent],
  providers: [ColorService, WCAGService, GamutService],
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

  versionbump = '1.0.0';

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

  // WCAG analysis - computed reactively from color state
  wcagAnalysis = computed(() => {
    if (!this.showWCAG) {
      return null;
    }
    const state = this.colorState();
    const allFormats = this.colorService.toAllFormats(state.internalValue);
    return this.wcagService.analyze(allFormats.hex);
  });

  // Gamut status - computed reactively from color state and gamut
  gamutStatus = computed(() => {
    const state = this.colorState();
    const currentGamut = this.gamut();
    const allFormats = this.colorService.toAllFormats(state.internalValue);
    
    const gamutCheck = this.gamutService.check(allFormats.hex, currentGamut);
    
    return {
      inGamut: gamutCheck.isInGamut,
      profile: currentGamut,
      warning: gamutCheck.isInGamut ? undefined : `Color is outside ${GAMUT_PROFILES[currentGamut].displayName} gamut`,
      distance: gamutCheck.distance,
      clipped: gamutCheck.clipped
    };
  });

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

  constructor(
    private colorService: ColorService,
    private wcagService: WCAGService,
    private gamutService: GamutService
  ) {
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

      // Update state with EXPLICIT format from input
      this.colorState.set({
        internalValue: parsed,
        format: this.initialFormat, // Use input format, don't default
        gamut: this.initialGamut,
        lastUpdated: Date.now(),
      });

      // Update display values based on format
      this.updateDisplayValues();

      // WCAG analysis will be computed automatically via computed signal
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

      // Clamp values to valid ranges to prevent invalid CSS
      const clampedR = Math.max(0, Math.min(255, r || 0));
      const clampedG = Math.max(0, Math.min(255, g || 0));
      const clampedB = Math.max(0, Math.min(255, b || 0));

      // Update rgbValues with clamped values
      this.rgbValues = [clampedR, clampedG, clampedB];

      const rgbString = `rgb(${Math.round(clampedR)}, ${Math.round(
        clampedG
      )}, ${Math.round(clampedB)})`;

      const parsed = this.colorService.parse(rgbString);
      this.updateColorState(parsed, 'rgb');
    } catch (error) {
      console.error('Error updating RGB:', error);
    }
  }

  private updateHslFromSliders(): void {
    try {
      const [h, s, l] = this.hslValues;

      // Clamp values to valid ranges to prevent invalid CSS
      const clampedH = Math.max(0, Math.min(360, h || 0));
      const clampedS = Math.max(0, Math.min(100, s || 0));
      const clampedL = Math.max(0, Math.min(100, l || 0));

      // Update hslValues with clamped values
      this.hslValues = [clampedH, clampedS, clampedL];

      const hslString = `hsl(${Math.round(clampedH)}, ${Math.round(
        clampedS
      )}%, ${Math.round(clampedL)}%)`;

      const parsed = this.colorService.parse(hslString);
      this.updateColorState(parsed, 'hsl');
    } catch (error) {
      console.error('Error updating HSL:', error);
    }
  }

  /**
   * Handle gamut profile change (T067)
   */
  onGamutChange(newGamut: GamutProfile): void {
    this.gamut.set(newGamut);
    
    // Update color state with new gamut
    this.colorState.update((state) => ({
      ...state,
      gamut: newGamut,
      lastUpdated: Date.now(),
    }));

    // Emit color change with updated gamut status
    this.emitColorChange();
  }

  private updateColorState(color: Color, format: ColorFormat): void {
    this.colorState.update((state) => ({
      ...state,
      internalValue: color,
      format,
      lastUpdated: Date.now(),
    }));

    // Only update display values for formats OTHER than the current one
    // to avoid overwriting the slider values that the user is currently adjusting
    // For example: if user is adjusting RGB sliders, don't update rgbValues
    // This prevents precision loss and slider jumping
    const currentFormat = this.format();
    if (currentFormat !== format) {
      this.updateDisplayValues();
    } else {
      // Still update HEX input and other formats except the current one
      const state = this.colorState();
      const allFormats = this.colorService.toAllFormats(state.internalValue);

      // Always update HEX
      this.hexInputValue.set(allFormats.hex);

      // Update the format we're NOT currently using
      if (format !== 'rgb') {
        const rgbChannels = this.colorService.getChannels(
          state.internalValue,
          'rgb'
        );
        this.rgbValues = [
          Math.max(0, Math.min(255, rgbChannels[0] || 0)),
          Math.max(0, Math.min(255, rgbChannels[1] || 0)),
          Math.max(0, Math.min(255, rgbChannels[2] || 0)),
        ];
      }

      if (format !== 'hsl') {
        const hslChannels = this.colorService.getChannels(
          state.internalValue,
          'hsl'
        );
        this.hslValues = [
          Math.max(
            0,
            Math.min(360, isNaN(hslChannels[0]) ? 0 : hslChannels[0])
          ),
          Math.max(0, Math.min(100, hslChannels[1] || 0)),
          Math.max(0, Math.min(100, hslChannels[2] || 0)),
        ];
      }
    }
  }

  private updateDisplayValues(): void {
    const state = this.colorState();
    const allFormats = this.colorService.toAllFormats(state.internalValue);

    // Update HEX display
    this.hexInputValue.set(allFormats.hex);

    // Update RGB sliders with clamping
    const rgbChannels = this.colorService.getChannels(
      state.internalValue,
      'rgb'
    );
    this.rgbValues = [
      Math.max(0, Math.min(255, rgbChannels[0] || 0)),
      Math.max(0, Math.min(255, rgbChannels[1] || 0)),
      Math.max(0, Math.min(255, rgbChannels[2] || 0)),
    ];

    // Update HSL sliders with clamping and NaN handling
    // Note: Hue can be NaN for achromatic colors (black, white, grays)
    // because hue is undefined when saturation is 0%
    const hslChannels = this.colorService.getChannels(
      state.internalValue,
      'hsl'
    );
    this.hslValues = [
      Math.max(0, Math.min(360, isNaN(hslChannels[0]) ? 0 : hslChannels[0])),
      Math.max(0, Math.min(100, hslChannels[1] || 0)),
      Math.max(0, Math.min(100, hslChannels[2] || 0)),
    ];
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

    // Add WCAG results if enabled
    if (this.showWCAG) {
      const wcagResult = this.wcagAnalysis();
      if (wcagResult) {
        event.wcagResults = wcagResult;
      }
    }

    // Add gamut status
    const gamutResult = this.gamutStatus();
    if (gamutResult) {
      event.gamutStatus = {
        inGamut: gamutResult.inGamut,
        profile: gamutResult.profile,
        warning: gamutResult.warning
      };
    }

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
