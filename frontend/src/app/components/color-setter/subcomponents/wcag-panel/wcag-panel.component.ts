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

import { Component, input } from '@angular/core';
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
  analysis = input<WCAGAnalysis | null>(null);
  color = input<string>('#FF0000');
  public versionBump = 1;

  /**
   * Get CSS class for compliance indicator (border only)
   */
  getComplianceClass(passes: boolean): string {
    return passes ? 'border-green-500' : 'border-red-500';
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

  /**
   * Get status value for data-status attribute
   */
  getComplianceStatus(passes: boolean): string {
    return passes ? 'pass' : 'fail';
  }

  /**
   * Get color for contrast ratio bar (gradient from red to green)
   * Red: 0-4.5, Yellow: 4.5-7, Green: 7+
   */
  getContrastBarColor(ratio: number): string {
    if (ratio < 3) return '#ef4444'; // Red
    if (ratio < 4.5) return '#f97316'; // Orange
    if (ratio < 7) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  }

  /**
   * Get percentage width for contrast bar (max 21:1)
   */
  getContrastBarWidth(ratio: number): number {
    return Math.min((ratio / 21) * 100, 100);
  }
}
