import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { ThemeMode } from '../../models/theme.models';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.css'],
})
export class ThemeSwitcherComponent {
  private themeService = inject(ThemeService);

  // Expose signals to template
  currentMode = this.themeService.currentMode;
  isVisible = this.themeService.isThemeControlsVisible;

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }

  isSystemSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)') !== null
    );
  }
}
