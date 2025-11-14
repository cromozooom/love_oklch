export type ThemeMode = 'light' | 'dark' | 'system';
export type AppliedTheme = 'light' | 'dark';

export interface ThemeState {
  currentMode: ThemeMode;
  appliedTheme: AppliedTheme;
  isAuthenticated: boolean;
}
