import { Injectable, computed, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'designer' | 'developer' | 'admin';
}

export interface ColorWork {
  id: string;
  name: string;
  colors: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  user: User | null;
  colorWorks: ColorWork[];
  selectedColorWork: ColorWork | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class StateService {
  // Private signals for state management
  private readonly _user = signal<User | null>(null);
  private readonly _colorWorks = signal<ColorWork[]>([]);
  private readonly _selectedColorWork = signal<ColorWork | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly computed properties
  readonly user = this._user.asReadonly();
  readonly colorWorks = this._colorWorks.asReadonly();
  readonly selectedColorWork = this._selectedColorWork.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed derived state
  readonly userColorWorks = computed(() => {
    const currentUser = this._user();
    const works = this._colorWorks();
    return currentUser ? works.filter((work) => work.userId === currentUser.id) : [];
  });

  readonly hasColorWorks = computed(() => this._colorWorks().length > 0);

  readonly isAuthenticated = computed(() => this._user() !== null);

  // RxJS subjects for async operations
  private readonly _userChanges$ = new BehaviorSubject<User | null>(null);
  private readonly _loadingChanges$ = new BehaviorSubject<boolean>(false);

  // Observable streams
  readonly userChanges$: Observable<User | null> = this._userChanges$.asObservable();
  readonly loadingChanges$: Observable<boolean> = this._loadingChanges$.asObservable();

  constructor() {
    // Sync signals with RxJS subjects for async effects
    this._user.set(this._userChanges$.value);
    this._isLoading.set(this._loadingChanges$.value);
  }

  // User actions
  setUser(user: User | null): void {
    this._user.set(user);
    this._userChanges$.next(user);
    this._error.set(null);
  }

  // Color works actions
  setColorWorks(colorWorks: ColorWork[]): void {
    this._colorWorks.set(colorWorks);
  }

  addColorWork(colorWork: ColorWork): void {
    const currentWorks = this._colorWorks();
    this._colorWorks.set([...currentWorks, colorWork]);
  }

  updateColorWork(id: string, updates: Partial<ColorWork>): void {
    const currentWorks = this._colorWorks();
    const updatedWorks = currentWorks.map((work) =>
      work.id === id ? { ...work, ...updates, updatedAt: new Date() } : work
    );
    this._colorWorks.set(updatedWorks);
  }

  deleteColorWork(id: string): void {
    const currentWorks = this._colorWorks();
    const filteredWorks = currentWorks.filter((work) => work.id !== id);
    this._colorWorks.set(filteredWorks);

    // Clear selected work if it was deleted
    if (this._selectedColorWork()?.id === id) {
      this._selectedColorWork.set(null);
    }
  }

  selectColorWork(colorWork: ColorWork | null): void {
    this._selectedColorWork.set(colorWork);
  }

  // Loading state actions
  setLoading(isLoading: boolean): void {
    this._isLoading.set(isLoading);
    this._loadingChanges$.next(isLoading);
  }

  // Error handling actions
  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  // Reset state
  resetState(): void {
    this._user.set(null);
    this._colorWorks.set([]);
    this._selectedColorWork.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._userChanges$.next(null);
    this._loadingChanges$.next(false);
  }
}
