/**
 * GamutService: Gamut checking, clipping, and gradient generation
 * 
 * Responsibilities:
 * - Check if colors are within specified gamut boundaries
 * - Clip out-of-gamut colors to nearest in-gamut equivalent
 * - Generate gamut-aware gradients for slider visualization
 * 
 * Uses colorjs.io for accurate gamut operations
 */

import { Injectable } from '@angular/core';
import Color from 'colorjs.io';
import { GamutCheckResult } from '../models/gamut-profile.model';
import { SliderGradient, SliderGradientConfig, GradientStop } from '../models/slider-gradient.model';
import { ColorService } from './color.service';

@Injectable({
  providedIn: 'root'
})
export class GamutService {

  constructor(private colorService: ColorService) {}

  /**
   * T058: Check if a color is within the specified gamut
   * 
   * @param colorString - Color in any format supported by colorjs.io
   * @param gamutName - Target gamut ('sRGB', 'Display P3', 'Unlimited gamut')
   * @returns Gamut check result with in-gamut status and clipped color if needed
   */
  check(colorString: string, gamutName: string): GamutCheckResult {
    try {
      const color = new Color(colorString);
      
      // Unlimited gamut - everything is in gamut
      if (gamutName === 'Unlimited gamut') {
        return {
          isInGamut: true,
          gamut: gamutName,
          distance: 0
        };
      }

      // Map gamut names to colorjs.io space identifiers
      const gamutMap: Record<string, string> = {
        'sRGB': 'srgb',
        'Display P3': 'p3'
      };

      const gamutSpace = gamutMap[gamutName] || 'srgb';

      // Check if color is in gamut
      const isInGamut = color.inGamut(gamutSpace);

      if (isInGamut) {
        return {
          isInGamut: true,
          gamut: gamutName,
          distance: 0
        };
      }

      // Color is out of gamut - clip it
      const clippedColor = this.clip(colorString, gamutName);
      
      // Calculate approximate distance (Delta-E in OKLCH space)
      const originalOklch = color.to('oklch');
      const clippedOklch = new Color(clippedColor).to('oklch');
      
      const distance = Math.sqrt(
        Math.pow(originalOklch.coords[0] - clippedOklch.coords[0], 2) +
        Math.pow(originalOklch.coords[1] - clippedOklch.coords[1], 2)
      );

      return {
        isInGamut: false,
        gamut: gamutName,
        clipped: clippedColor,
        distance: distance,
        warning: `Color exceeds ${gamutName} gamut limits`
      };

    } catch (error) {
      console.error('Gamut check error:', error);
      return {
        isInGamut: true,
        gamut: gamutName,
        distance: 0
      };
    }
  }

  /**
   * T059: Clip an out-of-gamut color to the nearest in-gamut color
   * 
   * @param colorString - Color to clip
   * @param gamutName - Target gamut
   * @returns Clipped color in HEX format
   */
  clip(colorString: string, gamutName: string): string {
    try {
      const color = new Color(colorString);

      // Unlimited gamut - no clipping needed
      if (gamutName === 'Unlimited gamut') {
        return color.to('srgb').toString({ format: 'hex' });
      }

      const gamutMap: Record<string, string> = {
        'sRGB': 'srgb',
        'Display P3': 'p3'
      };

      const gamutSpace = gamutMap[gamutName] || 'srgb';

      // Check if already in gamut
      if (color.inGamut(gamutSpace)) {
        return color.to('srgb').toString({ format: 'hex' });
      }

      // Clip to gamut using colorjs.io's toGamut method
      const clipped = color.toGamut({
        space: gamutSpace,
        method: 'clip' // Preserves hue and lightness, reduces chroma
      });

      return clipped.to('srgb').toString({ format: 'hex' });

    } catch (error) {
      console.error('Gamut clip error:', error);
      return '#FF0000'; // Fallback to red
    }
  }

  /**
   * T061: Generate slider gradient with gamut-aware color stops
   * 
   * @param config - Gradient configuration
   * @returns Slider gradient with color stops and CSS gradient string
   */
  generateSliderGradient(config: SliderGradientConfig): SliderGradient {
    const stops: GradientStop[] = [];
    const { format, channel, currentColor, gamut, min, max, steps } = config;

    try {
      // Parse current color
      const baseColor = new Color(currentColor);
      const baseCoords = [...baseColor.to(format).coords];

      // Determine channel index
      const channelMap: Record<string, Record<string, number>> = {
        'rgb': { 'r': 0, 'g': 1, 'b': 2 },
        'hsl': { 'h': 0, 's': 1, 'l': 2 },
        'lch': { 'l': 0, 'c': 1, 'h': 2 },
        'oklch': { 'l': 0, 'c': 1, 'h': 2 },
        'lab': { 'l': 0, 'a': 1, 'b': 2 }
      };

      const channelIndex = channelMap[format]?.[channel] ?? 0;

      // Generate color stops
      for (let i = 0; i < steps; i++) {
        const position = (i / (steps - 1)) * 100; // 0-100%
        const value = min + (i / (steps - 1)) * (max - min);

        // Create color with modified channel
        const coords = [...baseCoords];
        coords[channelIndex] = value;

        const stepColor = new Color(format, coords as [number, number, number]);
        const hexColor = stepColor.to('srgb').toString({ format: 'hex' });

        // Check gamut
        const gamutCheck = this.check(stepColor.toString(), gamut);

        stops.push({
          position,
          value,
          color: hexColor,
          inGamut: gamutCheck.isInGamut
        });
      }

      // Generate CSS gradient
      const cssGradient = this.generateCSSGradient(stops);
      const hasOutOfGamut = stops.some(stop => !stop.inGamut);

      return {
        stops,
        cssGradient,
        hasOutOfGamut
      };

    } catch (error) {
      console.error('Gradient generation error:', error);
      return {
        stops: [],
        cssGradient: 'linear-gradient(to right, #FF0000, #0000FF)',
        hasOutOfGamut: false
      };
    }
  }

  /**
   * T062: Get gradient stops with transparent regions for out-of-gamut areas
   * 
   * @param config - Gradient configuration
   * @returns Array of CSS color stop strings
   */
  getGradientStops(config: SliderGradientConfig): string[] {
    const gradient = this.generateSliderGradient(config);
    
    return gradient.stops.map(stop => {
      const opacity = stop.inGamut ? '1' : '0.3'; // Dim out-of-gamut colors
      return `${stop.color}${Math.round(parseFloat(opacity) * 255).toString(16).padStart(2, '0')} ${stop.position}%`;
    });
  }

  /**
   * Generate CSS linear gradient string from stops
   */
  private generateCSSGradient(stops: GradientStop[]): string {
    const colorStops = stops.map(stop => {
      const opacity = stop.inGamut ? 'ff' : '4d'; // Full opacity if in-gamut, ~30% if out
      return `${stop.color}${opacity} ${stop.position.toFixed(1)}%`;
    }).join(', ');

    return `linear-gradient(to right, ${colorStops})`;
  }
}
