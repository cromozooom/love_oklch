/**
 * Gamut Selector Component
 *
 * Provides a selector for choosing color gamut profiles (sRGB, Display P3, Unlimited)
 * Used to visualize out-of-gamut colors in advanced color space sliders.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GAMUT_PROFILES,
  GamutProfile,
  GamutDefinition,
} from '../../models/gamut-profile.model';

@Component({
  selector: 'app-gamut-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamut-selector.component.html',
  styleUrls: ['./gamut-selector.component.scss'],
})
export class GamutSelectorComponent {
  @Input() selectedGamut: GamutProfile = 'srgb';
  @Input() supportedGamuts: GamutProfile[] = [
    'srgb',
    'display-p3',
    'unlimited',
  ];
  @Output() gamutChange = new EventEmitter<GamutProfile>();

  // Available gamut profiles
  readonly gamutProfiles = GAMUT_PROFILES;

  /**
   * Get filtered gamut definitions based on supportedGamuts
   */
  get availableGamuts(): GamutDefinition[] {
    return this.supportedGamuts.map((profile) => this.gamutProfiles[profile]);
  }

  /**
   * Handle gamut selection change
   */
  onGamutChange(gamut: GamutProfile) {
    this.selectedGamut = gamut;
    this.gamutChange.emit(gamut);
  }

  /**
   * Get definition for a gamut profile
   */
  getGamutDefinition(gamut: GamutProfile): GamutDefinition {
    return this.gamutProfiles[gamut];
  }

  /**
   * Check if gamut is selected
   */
  isSelected(gamut: GamutProfile): boolean {
    return this.selectedGamut === gamut;
  }
}
