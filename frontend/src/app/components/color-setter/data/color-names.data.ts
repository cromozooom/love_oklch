/**
 * Color Names Database
 *
 * Curated collection of ~150 human-readable color names with OKLCH coordinates.
 * Colors are selected for broad coverage of the color space with recognizable names.
 *
 * OKLCH Coordinate Ranges:
 * - L (Lightness): 0 (black) to 1 (white)
 * - C (Chroma): 0 (gray) to ~0.4 typical, up to 0.5 for vivid colors
 * - H (Hue): 0-360° (red=30, orange=60, yellow=90, lime=120, green=150, cyan=210, blue=270, purple=300, magenta=330)
 *
 * @module ColorNamesData
 */

import { ColorNameEntry } from '../models/color-name.model';

/**
 * Comprehensive color names database with ~150 entries
 * Organized by hue families for maintainability
 */
export const COLOR_NAMES_DATABASE: ColorNameEntry[] = [
  // ===== ACHROMATIC (Grays, Black, White) =====
  {
    name: 'Black',
    l: 0.0,
    c: 0.0,
    h: 0,
    tags: ['gray', 'neutral', 'achromatic'],
  },
  {
    name: 'Charcoal',
    l: 0.25,
    c: 0.01,
    h: 0,
    tags: ['gray', 'dark', 'neutral'],
  },
  { name: 'Dark Gray', l: 0.35, c: 0.01, h: 0, tags: ['gray', 'neutral'] },
  { name: 'Gray', l: 0.5, c: 0.01, h: 0, tags: ['gray', 'neutral'] },
  {
    name: 'Silver',
    l: 0.7,
    c: 0.01,
    h: 0,
    tags: ['gray', 'light', 'metallic'],
  },
  {
    name: 'Light Gray',
    l: 0.8,
    c: 0.01,
    h: 0,
    tags: ['gray', 'light', 'neutral'],
  },
  { name: 'Smoke', l: 0.85, c: 0.01, h: 0, tags: ['gray', 'light', 'neutral'] },
  {
    name: 'White',
    l: 1.0,
    c: 0.0,
    h: 0,
    tags: ['white', 'light', 'achromatic'],
  },

  // ===== RED FAMILY (H: 20-40°) =====
  { name: 'Maroon', l: 0.3, c: 0.12, h: 30, tags: ['red', 'dark', 'warm'] },
  { name: 'Crimson', l: 0.45, c: 0.21, h: 28, tags: ['red', 'vivid', 'warm'] },
  { name: 'Red', l: 0.55, c: 0.26, h: 30, tags: ['red', 'primary', 'warm'] },
  { name: 'Scarlet', l: 0.5, c: 0.24, h: 32, tags: ['red', 'vivid', 'warm'] },
  { name: 'Fire Brick', l: 0.4, c: 0.18, h: 28, tags: ['red', 'dark', 'warm'] },
  { name: 'Cherry', l: 0.42, c: 0.2, h: 25, tags: ['red', 'fruit', 'warm'] },
  { name: 'Rose', l: 0.65, c: 0.18, h: 28, tags: ['red', 'pink', 'warm'] },
  {
    name: 'Salmon',
    l: 0.72,
    c: 0.14,
    h: 35,
    tags: ['pink', 'coral', 'warm', 'pastel'],
  },
  { name: 'Coral', l: 0.68, c: 0.16, h: 38, tags: ['coral', 'pink', 'warm'] },
  { name: 'Tomato', l: 0.58, c: 0.22, h: 32, tags: ['red', 'fruit', 'warm'] },
  { name: 'Brick', l: 0.42, c: 0.15, h: 30, tags: ['red', 'dark', 'earthy'] },
  { name: 'Ruby', l: 0.48, c: 0.22, h: 28, tags: ['red', 'gemstone', 'vivid'] },

  // ===== ORANGE FAMILY (H: 50-70°) =====
  { name: 'Rust', l: 0.45, c: 0.14, h: 55, tags: ['orange', 'dark', 'earthy'] },
  {
    name: 'Burnt Orange',
    l: 0.48,
    c: 0.16,
    h: 58,
    tags: ['orange', 'dark', 'warm'],
  },
  {
    name: 'Orange',
    l: 0.7,
    c: 0.2,
    h: 60,
    tags: ['orange', 'primary', 'warm'],
  },
  {
    name: 'Tangerine',
    l: 0.72,
    c: 0.19,
    h: 62,
    tags: ['orange', 'fruit', 'vivid'],
  },
  {
    name: 'Pumpkin',
    l: 0.65,
    c: 0.18,
    h: 58,
    tags: ['orange', 'warm', 'autumn'],
  },
  {
    name: 'Peach',
    l: 0.8,
    c: 0.12,
    h: 60,
    tags: ['orange', 'pastel', 'warm', 'fruit'],
  },
  {
    name: 'Apricot',
    l: 0.78,
    c: 0.13,
    h: 62,
    tags: ['orange', 'pastel', 'fruit'],
  },
  {
    name: 'Amber',
    l: 0.68,
    c: 0.17,
    h: 65,
    tags: ['orange', 'golden', 'warm'],
  },
  {
    name: 'Copper',
    l: 0.55,
    c: 0.15,
    h: 58,
    tags: ['orange', 'metallic', 'earthy'],
  },

  // ===== YELLOW FAMILY (H: 85-105°) =====
  {
    name: 'Gold',
    l: 0.72,
    c: 0.16,
    h: 90,
    tags: ['yellow', 'golden', 'metallic', 'warm'],
  },
  {
    name: 'Mustard',
    l: 0.65,
    c: 0.14,
    h: 92,
    tags: ['yellow', 'dark', 'earthy'],
  },
  {
    name: 'Yellow',
    l: 0.9,
    c: 0.2,
    h: 95,
    tags: ['yellow', 'primary', 'bright'],
  },
  {
    name: 'Lemon',
    l: 0.92,
    c: 0.19,
    h: 98,
    tags: ['yellow', 'bright', 'fruit'],
  },
  {
    name: 'Canary',
    l: 0.88,
    c: 0.18,
    h: 93,
    tags: ['yellow', 'bright', 'vivid'],
  },
  {
    name: 'Butter',
    l: 0.85,
    c: 0.14,
    h: 95,
    tags: ['yellow', 'soft', 'pastel'],
  },
  {
    name: 'Cream',
    l: 0.92,
    c: 0.08,
    h: 95,
    tags: ['yellow', 'light', 'pastel', 'neutral'],
  },
  {
    name: 'Ivory',
    l: 0.95,
    c: 0.05,
    h: 92,
    tags: ['yellow', 'light', 'neutral'],
  },
  {
    name: 'Khaki',
    l: 0.75,
    c: 0.09,
    h: 90,
    tags: ['yellow', 'earthy', 'neutral'],
  },
  {
    name: 'Honey',
    l: 0.72,
    c: 0.13,
    h: 88,
    tags: ['yellow', 'golden', 'warm'],
  },

  // ===== LIME/CHARTREUSE (H: 110-140°) =====
  {
    name: 'Olive',
    l: 0.5,
    c: 0.08,
    h: 115,
    tags: ['green', 'yellow', 'earthy', 'dark'],
  },
  {
    name: 'Chartreuse',
    l: 0.8,
    c: 0.16,
    h: 125,
    tags: ['green', 'yellow', 'vivid'],
  },
  {
    name: 'Lime',
    l: 0.85,
    c: 0.18,
    h: 130,
    tags: ['green', 'yellow', 'bright'],
  },
  { name: 'Yellow Green', l: 0.78, c: 0.15, h: 128, tags: ['green', 'yellow'] },

  // ===== GREEN FAMILY (H: 145-165°) =====
  { name: 'Dark Green', l: 0.35, c: 0.12, h: 152, tags: ['green', 'dark'] },
  {
    name: 'Forest Green',
    l: 0.42,
    c: 0.13,
    h: 155,
    tags: ['green', 'dark', 'nature'],
  },
  { name: 'Green', l: 0.6, c: 0.16, h: 150, tags: ['green', 'primary'] },
  {
    name: 'Emerald',
    l: 0.58,
    c: 0.17,
    h: 158,
    tags: ['green', 'vivid', 'gemstone'],
  },
  { name: 'Jade', l: 0.65, c: 0.14, h: 160, tags: ['green', 'gemstone'] },
  {
    name: 'Sea Green',
    l: 0.55,
    c: 0.12,
    h: 162,
    tags: ['green', 'blue', 'nature'],
  },
  { name: 'Mint', l: 0.82, c: 0.1, h: 155, tags: ['green', 'pastel', 'light'] },
  {
    name: 'Sage',
    l: 0.68,
    c: 0.08,
    h: 152,
    tags: ['green', 'pastel', 'earthy'],
  },
  {
    name: 'Moss',
    l: 0.52,
    c: 0.1,
    h: 148,
    tags: ['green', 'earthy', 'nature'],
  },
  { name: 'Fern', l: 0.58, c: 0.13, h: 150, tags: ['green', 'nature'] },

  // ===== CYAN/TEAL FAMILY (H: 190-220°) =====
  { name: 'Teal', l: 0.52, c: 0.12, h: 200, tags: ['cyan', 'blue', 'green'] },
  { name: 'Cyan', l: 0.8, c: 0.14, h: 210, tags: ['cyan', 'bright'] },
  {
    name: 'Turquoise',
    l: 0.72,
    c: 0.12,
    h: 205,
    tags: ['cyan', 'blue', 'gemstone'],
  },
  { name: 'Aqua', l: 0.82, c: 0.13, h: 210, tags: ['cyan', 'blue', 'bright'] },
  {
    name: 'Aquamarine',
    l: 0.78,
    c: 0.11,
    h: 208,
    tags: ['cyan', 'blue', 'pastel'],
  },
  {
    name: 'Light Blue',
    l: 0.8,
    c: 0.09,
    h: 215,
    tags: ['blue', 'pastel', 'light'],
  },

  // ===== BLUE FAMILY (H: 250-280°) =====
  { name: 'Navy', l: 0.25, c: 0.08, h: 270, tags: ['blue', 'dark'] },
  { name: 'Dark Blue', l: 0.35, c: 0.12, h: 272, tags: ['blue', 'dark'] },
  { name: 'Midnight Blue', l: 0.28, c: 0.09, h: 268, tags: ['blue', 'dark'] },
  { name: 'Royal Blue', l: 0.48, c: 0.18, h: 275, tags: ['blue', 'vivid'] },
  { name: 'Blue', l: 0.55, c: 0.2, h: 270, tags: ['blue', 'primary'] },
  { name: 'Cobalt', l: 0.5, c: 0.19, h: 272, tags: ['blue', 'vivid'] },
  {
    name: 'Sapphire',
    l: 0.45,
    c: 0.17,
    h: 268,
    tags: ['blue', 'dark', 'gemstone'],
  },
  {
    name: 'Sky Blue',
    l: 0.75,
    c: 0.11,
    h: 265,
    tags: ['blue', 'light', 'nature'],
  },
  { name: 'Azure', l: 0.72, c: 0.12, h: 268, tags: ['blue', 'light'] },
  {
    name: 'Cornflower Blue',
    l: 0.68,
    c: 0.14,
    h: 270,
    tags: ['blue', 'flower'],
  },
  {
    name: 'Steel Blue',
    l: 0.58,
    c: 0.1,
    h: 265,
    tags: ['blue', 'metallic', 'gray'],
  },
  {
    name: 'Powder Blue',
    l: 0.82,
    c: 0.08,
    h: 268,
    tags: ['blue', 'pastel', 'light'],
  },
  {
    name: 'Baby Blue',
    l: 0.85,
    c: 0.09,
    h: 270,
    tags: ['blue', 'pastel', 'light'],
  },
  {
    name: 'Periwinkle',
    l: 0.72,
    c: 0.11,
    h: 275,
    tags: ['blue', 'purple', 'pastel'],
  },

  // ===== INDIGO (H: 285-295°) =====
  {
    name: 'Indigo',
    l: 0.42,
    c: 0.15,
    h: 290,
    tags: ['blue', 'purple', 'dark'],
  },
  {
    name: 'Slate Blue',
    l: 0.55,
    c: 0.13,
    h: 288,
    tags: ['blue', 'purple', 'gray'],
  },

  // ===== PURPLE/VIOLET FAMILY (H: 300-320°) =====
  { name: 'Purple', l: 0.48, c: 0.18, h: 310, tags: ['purple', 'vivid'] },
  {
    name: 'Violet',
    l: 0.52,
    c: 0.19,
    h: 305,
    tags: ['purple', 'blue', 'vivid'],
  },
  { name: 'Plum', l: 0.55, c: 0.14, h: 312, tags: ['purple', 'fruit', 'dark'] },
  {
    name: 'Eggplant',
    l: 0.38,
    c: 0.12,
    h: 308,
    tags: ['purple', 'dark', 'earthy'],
  },
  {
    name: 'Amethyst',
    l: 0.58,
    c: 0.16,
    h: 310,
    tags: ['purple', 'gemstone', 'vivid'],
  },
  {
    name: 'Lavender',
    l: 0.75,
    c: 0.11,
    h: 305,
    tags: ['purple', 'pastel', 'light', 'flower'],
  },
  {
    name: 'Lilac',
    l: 0.72,
    c: 0.1,
    h: 308,
    tags: ['purple', 'pastel', 'light', 'flower'],
  },
  {
    name: 'Orchid',
    l: 0.68,
    c: 0.14,
    h: 312,
    tags: ['purple', 'flower', 'vivid'],
  },
  {
    name: 'Mauve',
    l: 0.65,
    c: 0.09,
    h: 310,
    tags: ['purple', 'pastel', 'muted'],
  },
  {
    name: 'Thistle',
    l: 0.78,
    c: 0.08,
    h: 305,
    tags: ['purple', 'pastel', 'light'],
  },

  // ===== MAGENTA/PINK FAMILY (H: 330-360°) =====
  {
    name: 'Magenta',
    l: 0.6,
    c: 0.22,
    h: 340,
    tags: ['magenta', 'pink', 'vivid'],
  },
  {
    name: 'Fuchsia',
    l: 0.58,
    c: 0.21,
    h: 338,
    tags: ['magenta', 'pink', 'vivid'],
  },
  { name: 'Hot Pink', l: 0.65, c: 0.19, h: 345, tags: ['pink', 'vivid'] },
  { name: 'Pink', l: 0.8, c: 0.12, h: 340, tags: ['pink', 'pastel', 'light'] },
  { name: 'Rose Pink', l: 0.72, c: 0.14, h: 335, tags: ['pink', 'flower'] },
  {
    name: 'Blush',
    l: 0.82,
    c: 0.09,
    h: 338,
    tags: ['pink', 'pastel', 'light'],
  },
  {
    name: 'Bubblegum',
    l: 0.78,
    c: 0.13,
    h: 342,
    tags: ['pink', 'pastel', 'bright'],
  },
  { name: 'Carnation', l: 0.75, c: 0.12, h: 340, tags: ['pink', 'flower'] },

  // ===== BROWN/TAN FAMILY =====
  {
    name: 'Brown',
    l: 0.4,
    c: 0.08,
    h: 55,
    tags: ['brown', 'earthy', 'neutral'],
  },
  {
    name: 'Chocolate',
    l: 0.35,
    c: 0.09,
    h: 52,
    tags: ['brown', 'dark', 'earthy'],
  },
  {
    name: 'Sienna',
    l: 0.42,
    c: 0.11,
    h: 48,
    tags: ['brown', 'earthy', 'warm'],
  },
  { name: 'Chestnut', l: 0.45, c: 0.1, h: 50, tags: ['brown', 'earthy'] },
  {
    name: 'Mahogany',
    l: 0.38,
    c: 0.09,
    h: 45,
    tags: ['brown', 'dark', 'wood'],
  },
  { name: 'Tan', l: 0.68, c: 0.07, h: 58, tags: ['brown', 'light', 'neutral'] },
  {
    name: 'Beige',
    l: 0.8,
    c: 0.05,
    h: 60,
    tags: ['brown', 'light', 'neutral', 'pastel'],
  },
  { name: 'Sand', l: 0.75, c: 0.06, h: 62, tags: ['brown', 'light', 'earthy'] },
  {
    name: 'Taupe',
    l: 0.58,
    c: 0.04,
    h: 55,
    tags: ['brown', 'gray', 'neutral'],
  },
  { name: 'Coffee', l: 0.32, c: 0.08, h: 52, tags: ['brown', 'dark'] },
  { name: 'Mocha', l: 0.48, c: 0.09, h: 55, tags: ['brown', 'warm'] },
  {
    name: 'Caramel',
    l: 0.58,
    c: 0.11,
    h: 58,
    tags: ['brown', 'warm', 'golden'],
  },
  {
    name: 'Cinnamon',
    l: 0.52,
    c: 0.1,
    h: 54,
    tags: ['brown', 'warm', 'spice'],
  },

  // ===== ADDITIONAL NAMED COLORS =====
  {
    name: 'Burgundy',
    l: 0.35,
    c: 0.13,
    h: 25,
    tags: ['red', 'purple', 'dark', 'wine'],
  },
  { name: 'Wine', l: 0.32, c: 0.12, h: 22, tags: ['red', 'purple', 'dark'] },
  {
    name: 'Raspberry',
    l: 0.48,
    c: 0.18,
    h: 335,
    tags: ['red', 'pink', 'fruit'],
  },
  { name: 'Strawberry', l: 0.58, c: 0.19, h: 28, tags: ['red', 'fruit'] },
  {
    name: 'Watermelon',
    l: 0.65,
    c: 0.17,
    h: 32,
    tags: ['red', 'pink', 'fruit'],
  },
  { name: 'Grape', l: 0.45, c: 0.14, h: 308, tags: ['purple', 'fruit'] },
  {
    name: 'Blueberry',
    l: 0.42,
    c: 0.15,
    h: 275,
    tags: ['blue', 'purple', 'fruit'],
  },
  {
    name: 'Lemon Chiffon',
    l: 0.94,
    c: 0.1,
    h: 96,
    tags: ['yellow', 'light', 'pastel'],
  },
  {
    name: 'Papaya',
    l: 0.78,
    c: 0.14,
    h: 62,
    tags: ['orange', 'fruit', 'warm'],
  },
  {
    name: 'Mango',
    l: 0.75,
    c: 0.16,
    h: 68,
    tags: ['orange', 'yellow', 'fruit'],
  },
  { name: 'Cantaloupe', l: 0.72, c: 0.15, h: 60, tags: ['orange', 'fruit'] },
  {
    name: 'Avocado',
    l: 0.55,
    c: 0.09,
    h: 118,
    tags: ['green', 'earthy', 'fruit'],
  },
  { name: 'Kiwi', l: 0.65, c: 0.12, h: 135, tags: ['green', 'fruit'] },
  { name: 'Pistachio', l: 0.72, c: 0.1, h: 145, tags: ['green', 'pastel'] },
  {
    name: 'Mint Cream',
    l: 0.92,
    c: 0.05,
    h: 160,
    tags: ['green', 'light', 'pastel'],
  },
  {
    name: 'Sea Foam',
    l: 0.85,
    c: 0.08,
    h: 170,
    tags: ['green', 'cyan', 'pastel'],
  },
  { name: 'Ocean Blue', l: 0.48, c: 0.13, h: 258, tags: ['blue', 'nature'] },
  { name: 'Denim', l: 0.52, c: 0.11, h: 268, tags: ['blue', 'fabric'] },
  { name: 'Prussian Blue', l: 0.32, c: 0.11, h: 272, tags: ['blue', 'dark'] },
  {
    name: 'Electric Blue',
    l: 0.58,
    c: 0.21,
    h: 275,
    tags: ['blue', 'vivid', 'neon'],
  },
  { name: 'Cerulean', l: 0.62, c: 0.14, h: 265, tags: ['blue', 'sky'] },
  {
    name: 'Peacock Blue',
    l: 0.52,
    c: 0.14,
    h: 225,
    tags: ['blue', 'cyan', 'vivid'],
  },
  {
    name: 'Ice Blue',
    l: 0.88,
    c: 0.06,
    h: 268,
    tags: ['blue', 'light', 'pastel'],
  },
];

/**
 * Total number of color names in database
 */
export const COLOR_NAMES_COUNT = COLOR_NAMES_DATABASE.length;

/**
 * Get unique tags from all color names
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  COLOR_NAMES_DATABASE.forEach((entry) => {
    entry.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Find color names by tag
 */
export function findColorsByTag(tag: string): ColorNameEntry[] {
  return COLOR_NAMES_DATABASE.filter((entry) =>
    entry.tags?.includes(tag.toLowerCase())
  );
}

/**
 * Get color name entry by exact name match
 */
export function getColorByName(name: string): ColorNameEntry | undefined {
  return COLOR_NAMES_DATABASE.find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase()
  );
}
