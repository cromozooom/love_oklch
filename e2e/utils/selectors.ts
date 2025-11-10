/**
 * E2E Test Selectors
 *
 * Centralized selectors for all E2E tests to maintain consistency
 * and make updates easier when UI changes.
 */

export const SELECTORS = {
  // Authentication & Navigation
  auth: {
    emailInput: '#email',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]',
    loginForm: 'form',
  },

  // Project Management
  projects: {
    newProjectButton: 'button:has-text("New Project")',
    projectForm: 'form',
    nameInput: '#name',
    descriptionInput: '#description',
    colorGamutSelect: 'select#colorGamut',
    colorSpaceSelect: 'select#colorSpace',
    colorCountInput: 'input#colorCount',
    submitButton: 'button[type="submit"]:has-text("Create")',
    projectCard: (name: string) => `text="${name}"`,
    projectList: '[data-testid="project-list"]',
  },

  // Color Setter Component
  colorSetter: {
    // Main component
    component: 'app-color-setter',
    colorPreview: '[data-testid="color-preview"]',

    // Color input/display (these toggle based on editing state)
    displayValue: '[data-testid="display-value"]', // Small element shown when not editing
    colorInput: '[data-testid="color-input"]', // Input field shown when editing
    colorInputError: '[data-testid="color-input-error"]',

    // Format selectors
    formatSelector: {
      hex: '[data-testid="format-selector-hex"]',
      rgb: '[data-testid="format-selector-rgb"]',
      hsl: '[data-testid="format-selector-hsl"]',
      lch: '[data-testid="format-selector-lch"]',
      oklch: '[data-testid="format-selector-oklch"]',
      lab: '[data-testid="format-selector-lab"]',
      byFormat: (format: string) => `[data-testid="format-selector-${format}"]`,
    },

    // Gamut selector
    gamutSelector: {
      srgb: '[data-testid="gamut-option-srgb"]',
      displayP3: '[data-testid="gamut-option-display-p3"]',
      rec2020: '[data-testid="gamut-option-rec2020"]',
      byName: (gamut: string) => `[data-testid="gamut-option-${gamut}"]`,
    },

    // Gamut warnings
    gamutWarning: '[data-testid="gamut-warning"]',

    // RGB Sliders
    rgbSliders: {
      red: '[data-testid="rgb-r-slider"]',
      green: '[data-testid="rgb-g-slider"]',
      blue: '[data-testid="rgb-b-slider"]',
      redInput: '[data-testid="rgb-r-slider-input"]',
      greenInput: '[data-testid="rgb-g-slider-input"]',
      blueInput: '[data-testid="rgb-b-slider-input"]',
      redValue: '[data-testid="rgb-r-slider-number-input"]',
      greenValue: '[data-testid="rgb-g-slider-number-input"]',
      blueValue: '[data-testid="rgb-b-slider-number-input"]',
    },

    // HSL Sliders
    hslSliders: {
      hue: '[data-testid="hsl-h-slider"]',
      saturation: '[data-testid="hsl-s-slider"]',
      lightness: '[data-testid="hsl-l-slider"]',
      hueInput: '[data-testid="hsl-h-slider-input"]',
      saturationInput: '[data-testid="hsl-s-slider-input"]',
      lightnessInput: '[data-testid="hsl-l-slider-input"]',
      hueNumberInput: '[data-testid="hsl-h-slider-number-input"]',
      saturationNumberInput: '[data-testid="hsl-s-slider-number-input"]',
      lightnessNumberInput: '[data-testid="hsl-l-slider-number-input"]',
    },

    // LCH Sliders
    lchSliders: {
      lightness: '[data-testid="lch-l-slider"]',
      chroma: '[data-testid="lch-c-slider"]',
      hue: '[data-testid="lch-h-slider"]',
      lightnessInput: '[data-testid="lch-l-slider-input"]',
      chromaInput: '[data-testid="lch-c-slider-input"]',
      hueInput: '[data-testid="lch-h-slider-input"]',
    },

    // OKLCH Sliders
    oklchSliders: {
      lightness: '[data-testid="oklch-l-slider"]',
      chroma: '[data-testid="oklch-c-slider"]',
      hue: '[data-testid="oklch-h-slider"]',
      lightnessInput: '[data-testid="oklch-l-slider-input"]',
      chromaInput: '[data-testid="oklch-c-slider-input"]',
      hueInput: '[data-testid="oklch-h-slider-input"]',
    },

    // LAB Sliders
    labSliders: {
      lightness: '[data-testid="lab-l-slider"]',
      a: '[data-testid="lab-a-slider"]',
      b: '[data-testid="lab-b-slider"]',
      lightnessInput: '[data-testid="lab-l-slider-input"]',
      aInput: '[data-testid="lab-a-slider-input"]',
      bInput: '[data-testid="lab-b-slider-input"]',
    },

    // HEX Input
    hexInput: '[data-testid="hex-input"]',

    // WCAG Panel
    wcagPanel: '[data-testid="wcag-panel"]',
    wcagWhiteContrastValue: '[data-testid="wcag-white-contrast-value"]',
    wcagBlackContrastValue: '[data-testid="wcag-black-contrast-value"]',
    wcagWhiteBg: '[data-testid="wcag-white-bg"]',
    wcagNormalAA: '[data-testid="wcag-normal-aa"]',
    wcagNormalAAA: '[data-testid="wcag-normal-aaa"]',
    wcagWhiteLargeAA: '[data-testid="wcag-white-large-aa"]',
    wcagWhiteLargeAAA: '[data-testid="wcag-white-large-aaa"]',
    wcagThresholdValue: '[data-testid="wcag-threshold-value"]',
  },

  // Modification tracking / Undo-Redo
  modifications: {
    undoButton: '[data-testid="undo-button"]',
    redoButton: '[data-testid="redo-button"]',
    saveButton: '[data-testid="save-button"]',
    modificationIndicator: '[data-testid="modification-indicator"]',
  },

  // Common UI elements
  ui: {
    loadingSpinner: '[data-testid="loading"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    modal: '[data-testid="modal"]',
    modalClose: '[data-testid="modal-close"]',
  },
} as const;

/**
 * Helper function to get slider input selector by format and component
 */
export function getSliderSelector(
  format: 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab',
  component: string,
  type: 'slider' | 'input' = 'input'
): string {
  const suffix = type === 'input' ? '-input' : '';
  return `[data-testid="${format}-slider-${component}${suffix}"]`;
}

/**
 * Helper function to get format selector
 */
export function getFormatSelector(format: string): string {
  return `[data-testid="format-selector-${format}"]`;
}

/**
 * Helper function to get gamut selector
 */
export function getGamutSelector(gamut: string): string {
  return `[data-testid="gamut-option-${gamut}"]`;
}
