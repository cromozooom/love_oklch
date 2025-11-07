/**
 * WCAG Panel Component
 *
 * Displays WCAG compliance information for a selected color:
 * - Contrast ratios against white and black backgrounds
 * - AA/AAA compliance indicators for normal and large text
 * - Visual pass/fail status indicators
 *
 * Input: Accepts WCAGAnalysis result to display
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WCAGAnalysis } from '../../models/wcag-contrast.model';

@Component({
  selector: 'app-wcag-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wcag-panel.component.html',
  styleUrls: ['./wcag-panel.component.scss'],
})
export class WCAGPanelComponent {
  @Input() analysis: WCAGAnalysis | null = null;

  /**
   * Get CSS class for compliance indicator
   */
  getComplianceClass(passes: boolean): string {
    return passes ? 'pass' : 'fail';
  }

  /**
   * Format ratio to 2 decimal places with :1 suffix
   */
  formatRatio(ratio: number): string {
    return `${ratio.toFixed(2)}:1`;
  }

  /**
   * Get status label for a threshold
   */
  getStatusLabel(passes: boolean): string {
    return passes ? 'PASS' : 'FAIL';
  }
}
