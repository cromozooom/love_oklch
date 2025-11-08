/**
 * Slider Gradient Generator Utility
 * 
 * Generates CSS gradients for color sliders with gamut-aware visualization.
 * Out-of-gamut regions are displayed with reduced opacity.
 */

import Color from 'colorjs.io';
import { ColorFormat } from '../models/format-config.model';

export interface GradientGeneratorConfig {
  /**
   * Current color value
   */
  color: string;

  /**
   * Color format (rgb, hsl, lch, oklch, lab)
   */
  format: ColorFormat;

  /**
   * Channel being modified (r, g, b, h, s, l, c, a, b)
   */
  channel: string;

  /**
   * Minimum channel value
   */
  min: number;

  /**
   * Maximum channel value
   */
  max: number;

  /**
   * Target gamut for checking
   */
  gamut: string;

  /**
   * Number of gradient steps (default: 50)
   */
  steps?: number;
}

export interface GradientStop {
  position: number;
  color: string;
  inGamut: boolean;
}

/**
 * Generate a CSS gradient string for a slider
 * 
 * @param config - Gradient configuration
 * @returns CSS linear-gradient string
 */
export function generateSliderGradient(config: GradientGeneratorConfig): string {
  const steps = config.steps || 50;
  const stops: GradientStop[] = [];

  try {
    const baseColor = new Color(config.color);
    const baseCoords = [...baseColor.to(config.format).coords];

    // Map channel names to indices
    const channelMap: Record<string, Record<string, number>> = {
      'rgb': { 'r': 0, 'g': 1, 'b': 2 },
      'hsl': { 'h': 0, 's': 1, 'l': 2 },
      'lch': { 'l': 0, 'c': 1, 'h': 2 },
      'oklch': { 'l': 0, 'c': 1, 'h': 2 },
      'lab': { 'l': 0, 'a': 1, 'b': 2 }
    };

    const channelIndex = channelMap[config.format]?.[config.channel] ?? 0;

    // Generate stops
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const value = config.min + t * (config.max - config.min);
      const position = t * 100;

      // Create color with modified channel
      const coords = [...baseCoords];
      coords[channelIndex] = value;

      const stepColor = new Color(config.format, coords as [number, number, number]);
      
      // Check gamut
      let inGamut = true;
      if (config.gamut !== 'Unlimited gamut') {
        const gamutSpace = config.gamut === 'sRGB' ? 'srgb' : config.gamut === 'Display P3' ? 'p3' : 'srgb';
        inGamut = stepColor.inGamut(gamutSpace);
      }

      const hexColor = stepColor.to('srgb').toString({ format: 'hex' });

      stops.push({
        position,
        color: hexColor,
        inGamut
      });
    }

    // Generate CSS gradient
    return generateCSSGradient(stops);

  } catch (error) {
    console.error('Gradient generation error:', error);
    return 'linear-gradient(to right, #FF0000, #0000FF)';
  }
}

/**
 * Generate CSS gradient string from stops
 */
function generateCSSGradient(stops: GradientStop[]): string {
  const colorStops = stops.map(stop => {
    const opacity = stop.inGamut ? 'ff' : '4d'; // Full or 30% opacity
    return `${stop.color}${opacity} ${stop.position.toFixed(1)}%`;
  }).join(', ');

  return `linear-gradient(to right, ${colorStops})`;
}

/**
 * Generate gradient stops array for custom rendering
 */
export function getGradientStops(config: GradientGeneratorConfig): GradientStop[] {
  const steps = config.steps || 50;
  const stops: GradientStop[] = [];

  try {
    const baseColor = new Color(config.color);
    const baseCoords = [...baseColor.to(config.format).coords];

    const channelMap: Record<string, Record<string, number>> = {
      'rgb': { 'r': 0, 'g': 1, 'b': 2 },
      'hsl': { 'h': 0, 's': 1, 'l': 2 },
      'lch': { 'l': 0, 'c': 1, 'h': 2 },
      'oklch': { 'l': 0, 'c': 1, 'h': 2 },
      'lab': { 'l': 0, 'a': 1, 'b': 2 }
    };

    const channelIndex = channelMap[config.format]?.[config.channel] ?? 0;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const value = config.min + t * (config.max - config.min);
      const position = t * 100;

      const coords = [...baseCoords];
      coords[channelIndex] = value;

      const stepColor = new Color(config.format, coords as [number, number, number]);
      
      let inGamut = true;
      if (config.gamut !== 'Unlimited gamut') {
        const gamutSpace = config.gamut === 'sRGB' ? 'srgb' : config.gamut === 'Display P3' ? 'p3' : 'srgb';
        inGamut = stepColor.inGamut(gamutSpace);
      }

      const hexColor = stepColor.to('srgb').toString({ format: 'hex' });

      stops.push({
        position,
        color: hexColor,
        inGamut
      });
    }

    return stops;

  } catch (error) {
    console.error('Gradient stops error:', error);
    return [];
  }
}

/**
 * Optimize gradient by reducing number of stops while maintaining visual fidelity
 * 
 * @param stops - Original gradient stops
 * @param targetStops - Desired number of stops (default: 20)
 * @returns Optimized stops array
 */
export function optimizeGradient(stops: GradientStop[], targetStops: number = 20): GradientStop[] {
  if (stops.length <= targetStops) {
    return stops;
  }

  const step = Math.floor(stops.length / targetStops);
  const optimized: GradientStop[] = [];

  for (let i = 0; i < stops.length; i += step) {
    optimized.push(stops[i]);
  }

  // Always include the last stop
  if (optimized[optimized.length - 1] !== stops[stops.length - 1]) {
    optimized.push(stops[stops.length - 1]);
  }

  return optimized;
}
