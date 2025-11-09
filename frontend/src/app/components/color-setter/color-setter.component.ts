import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  OnInit,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import Color from 'colorjs.io';

import { ColorService } from './services/color.service';
import { WCAGService } from './services/wcag.service';
import { GamutService } from './services/gamut.service';
import { NamingService } from './services/naming.service';
import { ColorFormat, FORMAT_CONFIGS } from './models/format-config.model';
import { GamutProfile, GAMUT_PROFILES } from './models/gamut-profile.model';
import { ColorState } from './models/color-state.model';
import { WCAGAnalysis } from './models/wcag-contrast.model';
import { ColorName } from './models/color-name.model';
import { ColorValidators } from './utils/color-validators';
import { WCAGPanelComponent } from './subcomponents/wcag-panel/wcag-panel.component';
import { GamutSelectorComponent } from './subcomponents/gamut-selector/gamut-selector.component';
import { LchSlidersComponent } from './subcomponents/color-sliders/lch-sliders.component';
import { OklchSlidersComponent } from './subcomponents/color-sliders/oklch-sliders.component';
import { LabSlidersComponent } from './subcomponents/color-sliders/lab-sliders.component';
import { RgbSlidersComponent } from './subcomponents/color-sliders/rgb-sliders.component';
import { HslSlidersComponent } from './subcomponents/color-sliders/hsl-sliders.component';
import { HexInputComponent } from './subcomponents/color-sliders/hex-input.component';
import { GamutAwareSliderComponent } from './subcomponents/gamut-aware-slider/gamut-aware-slider.component';

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
  imports: [
    CommonModule,
    FormsModule,
    WCAGPanelComponent,
    GamutSelectorComponent,
    LchSlidersComponent,
    OklchSlidersComponent,
    LabSlidersComponent,
    RgbSlidersComponent,
    HslSlidersComponent,
    HexInputComponent,
    GamutAwareSliderComponent,
  ],
  providers: [ColorService, WCAGService, GamutService, NamingService],
})
export class ColorSetterComponent implements OnInit, AfterViewInit {
  // ============================================================================
  // INPUTS
  // ============================================================================

  /**
   * Initial color value (any supported format)
   * Default: #FF0000 (red)
   */
  initialColor = input<string>('#FF0000');

  /**
   * Initial display format
   * Default: hex
   */
  initialFormat = input<ColorFormat>('hex');

  /**
   * Current gamut profile (signal input for reactive binding)
   * Allows parent components to control the gamut reactively
   * Default: srgb
   */
  currentGamut = input<GamutProfile>('srgb');

  /**
   * Show WCAG accessibility panel (User Story 2)
   * Default: false
   */
  showWCAG = input<boolean>(false);

  /**
   * Show color name display (User Story 3 enhancement)
   * Default: false
   */
  showColorName = input<boolean>(false);

  /**
   * Supported gamut profiles to show in selector
   * Default: ['srgb', 'display-p3', 'rec2020', 'unlimited']
   */
  supportedGamuts = input<GamutProfile[]>([
    'srgb',
    'display-p3',
    'rec2020',
    'unlimited',
  ]);

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  /**
   * Emitted when color changes
   */
  @Output()
  colorChange = new EventEmitter<ColorChangeEvent>();

  /**
   * Emitted when gamut profile changes internally (User Story 3)
   */
  @Output()
  gamutChange = new EventEmitter<GamutProfile>();

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
  format = signal<ColorFormat>('oklch');

  // Current gamut
  gamut = signal<GamutProfile>('srgb');

  // Slider values for RGB (0-255) - reactive signal for canvas updates
  rgbValues = signal<[number, number, number]>([255, 0, 0]);

  // RGB gradients
  rGradient = '';
  gGradient = '';
  bGradient = '';

  // RGB value formatters (for slider display)
  formatR = (v: number) => Math.round(v).toString();
  formatG = (v: number) => Math.round(v).toString();
  formatB = (v: number) => Math.round(v).toString();

  // HSL value formatters (for slider display)
  formatH = (v: number) => Math.round(v) + '°';
  formatS = (v: number) => Math.round(v) + '%';
  formatL = (v: number) => Math.round(v) + '%';

  // RGB color generator functions for canvas rendering - reactive computed signals
  rColorGenerator = computed(() => {
    const [, g, b] = this.rgbValues();
    return (position: number) =>
      `rgb(${Math.round(position)}, ${Math.round(g)}, ${Math.round(b)})`;
  });
  gColorGenerator = computed(() => {
    const [r, , b] = this.rgbValues();
    return (position: number) =>
      `rgb(${Math.round(r)}, ${Math.round(position)}, ${Math.round(b)})`;
  });
  bColorGenerator = computed(() => {
    const [r, g] = this.rgbValues();
    return (position: number) =>
      `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(position)})`;
  });

  // Slider values for HSL (H: 0-360, S: 0-100, L: 0-100) - reactive signal for canvas updates
  hslValues = signal<[number, number, number]>([0, 100, 50]);

  // HSL color generator functions for canvas rendering - reactive computed signals
  hColorGenerator = computed(() => {
    const [, s, l] = this.hslValues();
    return (position: number) => `hsl(${Math.round(position)}, ${s}%, ${l}%)`;
  });
  sColorGenerator = computed(() => {
    const [h, , l] = this.hslValues();
    return (position: number) => `hsl(${h}, ${Math.round(position)}%, ${l}%)`;
  });
  lColorGenerator = computed(() => {
    const [h, s] = this.hslValues();
    return (position: number) => `hsl(${h}, ${s}%, ${Math.round(position)}%)`;
  });

  // HEX input value
  hexInputValue = signal<string>('#FF0000');

  // Color input value for manual entry
  colorInputValue = signal<string>('');

  // Color input error message
  colorInputError = signal<string>('');

  // Track if we're in editing mode (showing input instead of display value)
  isEditingColorValue = signal<boolean>(false);

  // ViewChild to access the color input element for focusing
  @ViewChild('colorInput') colorInputRef?: ElementRef<HTMLInputElement>;

  // Available formats for selection
  availableFormats: ColorFormat[] = [
    'hex',
    'rgb',
    'hsl',
    'lch',
    'oklch',
    'lab',
  ];

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  // WCAG analysis - computed reactively from color state
  wcagAnalysis = computed(() => {
    if (!this.showWCAG()) {
      return null;
    }
    const state = this.colorState();
    const allFormats = this.colorService.toAllFormats(state.internalValue);
    return this.wcagService.analyze(allFormats.hex);
  });

  // Gamut status - computed reactively from color state and gamut
  gamutStatus = computed(() => {
    const state = this.colorState();
    // Use currentGamut signal input (reactive from parent) or fallback to internal gamut
    const activeGamut = this.currentGamut() || this.gamut();
    const allFormats = this.colorService.toAllFormats(state.internalValue);

    const gamutCheck = this.gamutService.check(allFormats.hex, activeGamut);

    return {
      inGamut: gamutCheck.isInGamut,
      profile: activeGamut,
      warning: gamutCheck.isInGamut
        ? undefined
        : `Color is outside ${GAMUT_PROFILES[activeGamut].displayName} gamut`,
      distance: gamutCheck.distance,
      clipped: gamutCheck.clipped,
    };
  });

  // Color name - computed reactively from color state (with debouncing via Subject)
  colorName = signal<ColorName | null>(null);

  // Gamut display name - computed to convert GamutProfile to display names for GamutService
  gamutDisplayName = computed(() => {
    const currentGamut = this.gamut();
    return GAMUT_PROFILES[currentGamut].displayName;
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
      const color = this.colorState().internalValue;
      switch (fmt) {
        case 'hex':
          return this.hexInputValue();
        case 'rgb':
          return `rgb(${this.rgbValues()
            .map((v: number) => Math.round(v))
            .join(', ')})`;
        case 'hsl':
          const [h, s, l] = this.hslValues();
          return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
        case 'lch': {
          const lch = color.to('lch');
          const lchString = `lch(${lch.coords[0].toFixed(
            1
          )} ${lch.coords[1].toFixed(1)} ${lch.coords[2].toFixed(1)})`;
          console.log('[ColorSetter] LCH format value:', lchString);
          return lchString;
        }
        case 'oklch': {
          const oklch = color.to('oklch');
          const lightness = oklch.coords[0].toFixed(3);
          const chroma = oklch.coords[1].toFixed(3);
          // Handle NaN hue for achromatic colors (grey colors with no hue)
          const hue = isNaN(oklch.coords[2]) ? 0 : oklch.coords[2].toFixed(1);
          return `oklch(${lightness} ${chroma} ${hue})`;
        }
        case 'lab': {
          const lab = color.to('lab');
          const labString = `lab(${lab.coords[0].toFixed(
            1
          )} ${lab.coords[1].toFixed(1)} ${lab.coords[2].toFixed(1)})`;
          console.log('[ColorSetter] LAB format value:', labString);
          return labString;
        }
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
  private colorNameSubject = new Subject<string>();

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private colorService: ColorService,
    private wcagService: WCAGService,
    private gamutService: GamutService,
    private namingService: NamingService
  ) {
    // Setup debounced color change (16ms for 60fps)
    this.colorChangeSubject.pipe(debounceTime(16)).subscribe((event) => {
      this.colorChange.emit(event);
    });

    // Setup debounced color naming (100ms to avoid excessive lookups)
    this.colorNameSubject.pipe(debounceTime(100)).subscribe((hexColor) => {
      if (this.showColorName()) {
        const name = this.namingService.getName(hexColor);
        this.colorName.set(name);
      }
    });

    // Effect to sync external gamut signal input with internal state bidirectionally
    // Allow external changes to control the component (e.g., from project form)
    effect(
      () => {
        const externalGamut = this.currentGamut();
        const currentInternalGamut = this.gamut();

        // Sync external changes to internal state if they differ
        if (externalGamut !== currentInternalGamut) {
          console.log(
            `[ColorSetter] External gamut change: ${currentInternalGamut} → ${externalGamut}`
          );

          // Update internal gamut signal when external signal changes
          this.gamut.set(externalGamut);

          // Update color state with new gamut
          this.colorState.update((state) => ({
            ...state,
            gamut: externalGamut,
            lastUpdated: Date.now(),
          }));

          // Re-emit color change with updated gamut for consistency
          this.emitColorChange();
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    try {
      // Parse initial color
      const parsed = this.colorService.parse(this.initialColor());

      // Initialize internal signals with input values
      const initialGamut = this.currentGamut();
      this.gamut.set(initialGamut);
      this.format.set(this.initialFormat());

      // Update state with EXPLICIT format from input
      this.colorState.set({
        internalValue: parsed,
        format: this.initialFormat(), // Use input format, don't default
        gamut: initialGamut,
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

  ngAfterViewInit(): void {
    // This is called after the view has been fully initialized
    // ViewChild references are available here
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

  /**
   * Handle color input change - validates and switches to appropriate editor
   * Uses colorjs.io directly to parse and detect format
   */
  onColorInputChange(): void {
    // Step 1 & 2: Remove spaces before and after if they are made by mistake
    const input = this.colorInputValue().trim();

    if (!input) {
      this.colorInputError.set(''); // Clear error for empty input
      return; // Empty input, do nothing
    }

    try {
      // Clear any previous error
      this.colorInputError.set('');

      // Step 3: Try to convert with colorjs.io
      const parsed = this.colorService.parse(input);

      // Step 4: Check the type and detect format from original input
      let detectedFormat = this.detectFormatFromInput(input);

      // Special case: if no format detected, it might be a named color
      // Named colors should be treated as HEX since they convert to HEX values
      if (!detectedFormat) {
        // If colorjs.io successfully parsed it but we couldn't detect format,
        // it's likely a named color (like "red", "blue", "crimson", etc.)
        // Convert to HEX and treat as HEX input
        detectedFormat = 'hex';
        console.log(`Named color detected: "${input}" -> treating as HEX`);
      }

      // Step 5: Switch to the detected format editor and set the value
      this.format.set(detectedFormat);

      // Update color state
      this.updateColorState(parsed, detectedFormat);

      // Clear the input field and any errors after successful parsing
      this.colorInputValue.set('');
      this.colorInputError.set('');
      // Exit editing mode after successful input
      this.isEditingColorValue.set(false);
    } catch (error) {
      // Handle parsing errors from colorjs.io
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid color format';
      this.colorInputError.set(`Cannot parse color: ${errorMessage}`);
      console.error('Invalid color input:', error);
    }
  }

  /**
   * Start editing mode - show input field instead of display value
   */
  startEditingColorValue(): void {
    this.isEditingColorValue.set(true);
    this.colorInputError.set(''); // Clear any previous errors
    // Optionally pre-fill with current value
    // this.colorInputValue.set(this.currentFormatValue());

    // Focus the input field after the view updates
    setTimeout(() => {
      this.colorInputRef?.nativeElement?.focus();
    }, 0);
  }

  /**
   * Cancel editing mode - go back to display value
   */
  cancelEditingColorValue(): void {
    this.isEditingColorValue.set(false);
    this.colorInputValue.set('');
    this.colorInputError.set('');
  }

  /**
   * Handle blur event on color input
   * Try to parse if input has content, but always allow canceling by clicking outside
   */
  onColorInputBlur(): void {
    const input = this.colorInputValue().trim();

    // If input is empty, just cancel editing mode
    if (!input) {
      this.cancelEditingColorValue();
      return;
    }

    // If input has content, try to parse it
    try {
      const parsed = this.colorService.parse(input);

      // If parsing succeeds, update the color
      let detectedFormat = this.detectFormatFromInput(input);
      if (!detectedFormat) {
        detectedFormat = 'hex'; // Named colors default to hex
      }

      this.format.set(detectedFormat);
      this.updateColorState(parsed, detectedFormat);
      this.cancelEditingColorValue(); // Exit edit mode on success
    } catch (error) {
      // If parsing fails, still cancel editing mode when clicking outside
      // This allows users to escape from invalid input by clicking elsewhere
      this.cancelEditingColorValue();
    }
  }

  /**
   * Detect color format from input string using simple pattern matching
   * This is more flexible than validators and works after colorjs.io has already parsed it
   * @param input Color string to detect format from
   * @returns Detected format or null if unrecognized
   */
  private detectFormatFromInput(input: string): ColorFormat | null {
    const cleanInput = input.toLowerCase().trim();

    // Check for hex (starts with # or is 3/6 hex chars)
    if (
      cleanInput.startsWith('#') ||
      /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(cleanInput)
    ) {
      return 'hex';
    }

    // Check for rgb/rgba
    if (cleanInput.startsWith('rgb')) {
      return 'rgb';
    }

    // Check for hsl/hsla
    if (cleanInput.startsWith('hsl')) {
      return 'hsl';
    }

    // Check for oklch
    if (cleanInput.startsWith('oklch')) {
      return 'oklch';
    }

    // Check for lch
    if (cleanInput.startsWith('lch')) {
      return 'lch';
    }

    // Check for lab
    if (cleanInput.startsWith('lab')) {
      return 'lab';
    }

    return null;
  }

  /**
   * Detect color format from input string
   * Returns the format if valid, null if unrecognized
   */
  private detectColorFormat(input: string): ColorFormat | null {
    const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'lch', 'oklch', 'lab'];

    for (const format of formats) {
      if (ColorValidators.isValidForFormat(input, format)) {
        return format;
      }
    }

    return null;
  }

  // RGB slider input handlers for signal updates
  onRgbSliderInput(index: 0 | 1 | 2, value: number): void {
    const current = this.rgbValues();
    const updated: [number, number, number] = [...current];
    updated[index] = value;
    this.rgbValues.set(updated);
  }

  onRgbSliderChange(index: 0 | 1 | 2, value: number): void {
    const current = this.rgbValues();
    const updated: [number, number, number] = [...current];
    updated[index] = value;
    this.rgbValues.set(updated);
  }

  onRgbInput(): void {
    // Real-time update without debounce
    this.updateRgbFromSliders();
    this.generateRgbGradients(); // Update gradients as user drags
  }

  onRgbChange(): void {
    // Final update with debounce
    this.updateRgbFromSliders();
    this.generateRgbGradients(); // Update gradients on release
    this.emitColorChange();
  }

  // HSL slider input handlers for signal updates
  onHslSliderInput(index: 0 | 1 | 2, value: number): void {
    const current = this.hslValues();
    const updated: [number, number, number] = [...current];
    updated[index] = value;
    this.hslValues.set(updated);
  }

  onHslSliderChange(index: 0 | 1 | 2, value: number): void {
    const current = this.hslValues();
    const updated: [number, number, number] = [...current];
    updated[index] = value;
    this.hslValues.set(updated);
  }

  /**
   * Generate RGB gradient backgrounds
   * Each gradient shows how changing one channel affects the color
   */
  private generateRgbGradients(): void {
    const [r, g, b] = this.rgbValues();
    const steps = 255; // One step per RGB value

    // Red gradient (0-255, keeping G and B constant)
    const rStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      rStops.push(`rgb(${i}, ${Math.round(g)}, ${Math.round(b)})`);
    }
    this.rGradient = `linear-gradient(to right, ${rStops.join(', ')})`;

    // Green gradient (0-255, keeping R and B constant)
    const gStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      gStops.push(`rgb(${Math.round(r)}, ${i}, ${Math.round(b)})`);
    }
    this.gGradient = `linear-gradient(to right, ${gStops.join(', ')})`;

    // Blue gradient (0-255, keeping R and G constant)
    const bStops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      bStops.push(`rgb(${Math.round(r)}, ${Math.round(g)}, ${i})`);
    }
    this.bGradient = `linear-gradient(to right, ${bStops.join(', ')})`;
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

  onLchColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'lch');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating LCH:', error);
    }
  }

  onOklchColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'oklch');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating OKLCH:', error);
    }
  }

  onLabColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'lab');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating LAB:', error);
    }
  }

  onRgbColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'rgb');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating RGB:', error);
    }
  }

  onHslColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'hsl');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating HSL:', error);
    }
  }

  onHexColorChange(colorString: string): void {
    try {
      const parsed = this.colorService.parse(colorString);
      this.updateColorState(parsed, 'hex');
      this.emitColorChange();
    } catch (error) {
      console.error('Error updating HEX:', error);
    }
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
      const [r, g, b] = this.rgbValues();

      // Clamp values to valid ranges to prevent invalid CSS
      const clampedR = Math.max(0, Math.min(255, r || 0));
      const clampedG = Math.max(0, Math.min(255, g || 0));
      const clampedB = Math.max(0, Math.min(255, b || 0));

      // Update rgbValues with clamped values
      this.rgbValues.set([clampedR, clampedG, clampedB]);

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
      const [h, s, l] = this.hslValues();

      // Clamp values to valid ranges to prevent invalid CSS
      const clampedH = Math.max(0, Math.min(360, h || 0));
      const clampedS = Math.max(0, Math.min(100, s || 0));
      const clampedL = Math.max(0, Math.min(100, l || 0));

      // Update hslValues with clamped values
      this.hslValues.set([clampedH, clampedS, clampedL]);

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

    // Emit gamut change event for parent components
    this.gamutChange.emit(newGamut);

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
        this.rgbValues.set([
          Math.max(0, Math.min(255, rgbChannels[0] || 0)),
          Math.max(0, Math.min(255, rgbChannels[1] || 0)),
          Math.max(0, Math.min(255, rgbChannels[2] || 0)),
        ]);
      }

      if (format !== 'hsl') {
        const hslChannels = this.colorService.getChannels(
          state.internalValue,
          'hsl'
        );
        this.hslValues.set([
          Math.max(
            0,
            Math.min(360, isNaN(hslChannels[0]) ? 0 : hslChannels[0])
          ),
          Math.max(0, Math.min(100, hslChannels[1] || 0)),
          Math.max(0, Math.min(100, hslChannels[2] || 0)),
        ]);
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
    this.rgbValues.set([
      Math.max(0, Math.min(255, rgbChannels[0] || 0)),
      Math.max(0, Math.min(255, rgbChannels[1] || 0)),
      Math.max(0, Math.min(255, rgbChannels[2] || 0)),
    ]);

    // Update RGB gradients
    this.generateRgbGradients();

    // Update HSL sliders with clamping and NaN handling
    // Note: Hue can be NaN for achromatic colors (black, white, grays)
    // because hue is undefined when saturation is 0%
    const hslChannels = this.colorService.getChannels(
      state.internalValue,
      'hsl'
    );
    this.hslValues.set([
      Math.max(0, Math.min(360, isNaN(hslChannels[0]) ? 0 : hslChannels[0])),
      Math.max(0, Math.min(100, hslChannels[1] || 0)),
      Math.max(0, Math.min(100, hslChannels[2] || 0)),
    ]);
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
    if (this.showWCAG()) {
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
        warning: gamutResult.warning,
      };
    }

    // Add color name if enabled and available
    if (this.showColorName()) {
      const nameResult = this.colorName();
      if (nameResult) {
        event.name = nameResult.name;
      }
    }

    // Trigger debounced color naming lookup
    if (this.showColorName()) {
      this.colorNameSubject.next(allFormats.hex);
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
