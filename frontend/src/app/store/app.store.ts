import { computed, signal } from '@angular/core';
import { Injectable } from '@angular/core';

/**
 * User interface for authentication state
 */
export interface User {
  userId: string;
  email: string;
  subscription: {
    type: 'default' | 'premium';
    status: 'active' | 'expired' | 'canceled' | 'pending' | 'grace_period';
    planId?: string;
  };
  projects: {
    canCreate: boolean;
    maxProjects: number;
    currentCount: number;
  };
}

/**
 * Project interface for project management state
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  colorGamut: 'sRGB' | 'Display P3' | 'Unlimited gamut';
  colorSpace: 'LCH' | 'OKLCH';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Project modification interface for undo/redo functionality
 */
export interface ProjectModification {
  id: string;
  projectId: string;
  type: 'property_change' | 'initial_state';
  propertyName: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
  commandId: string;
}

/**
 * Application state interface
 */
export interface AppState {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;

  // Project management state
  projects: Project[];
  currentProject: Project | null;

  // Undo/Redo state
  modifications: ProjectModification[];
  undoStack: ProjectModification[];
  redoStack: ProjectModification[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial application state
 */
const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  projects: [],
  currentProject: null,
  modifications: [],
  undoStack: [],
  redoStack: [],
  isLoading: false,
  error: null,
};

/**
 * Centralized Angular Signals store for application state management
 * Implements reactive state management using Angular Signals with RxJS for side effects
 */
@Injectable({
  providedIn: 'root',
})
export class AppStore {
  // Core state signals
  private readonly _state = signal<AppState>(initialState);

  // Authentication signals
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly user = computed(() => this._state().user);
  readonly canCreateProject = computed(
    () => this._state().user?.projects.canCreate ?? false
  );
  readonly userSubscriptionType = computed(
    () => this._state().user?.subscription.type ?? 'default'
  );

  // Project management signals
  readonly projects = computed(() => this._state().projects);
  readonly currentProject = computed(() => this._state().currentProject);
  readonly hasProjects = computed(() => this._state().projects.length > 0);
  readonly projectCount = computed(() => this._state().projects.length);

  // Undo/Redo signals
  readonly modifications = computed(() => this._state().modifications);
  readonly undoStack = computed(() => this._state().undoStack);
  readonly redoStack = computed(() => this._state().redoStack);
  readonly canUndo = computed(() => this._state().undoStack.length > 0);
  readonly canRedo = computed(() => this._state().redoStack.length > 0);
  readonly undoRedoLimits = computed(() => {
    const subscriptionType = this._state().user?.subscription.type ?? 'default';
    return {
      maxOperations: subscriptionType === 'premium' ? 50 : 5,
      currentUndoCount: this._state().undoStack.length,
      currentRedoCount: this._state().redoStack.length,
    };
  });

  // UI state signals
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);

  // Computed selectors
  readonly activeProjects = computed(() =>
    this._state().projects.filter((project) => project.isActive)
  );

  readonly currentProjectModifications = computed(() => {
    const currentProjectId = this._state().currentProject?.id;
    if (!currentProjectId) return [];
    return this._state().modifications.filter(
      (mod) => mod.projectId === currentProjectId
    );
  });

  /**
   * Authentication Actions
   */
  setUser(user: User): void {
    this._updateState((state) => ({
      ...state,
      user,
      isAuthenticated: true,
      error: null,
    }));
  }

  logout(): void {
    this._updateState((state) => ({
      ...state,
      user: null,
      isAuthenticated: false,
      projects: [],
      currentProject: null,
      modifications: [],
      undoStack: [],
      redoStack: [],
      error: null,
    }));
  }

  /**
   * Project Management Actions
   */
  setProjects(projects: Project[]): void {
    this._updateState((state) => ({
      ...state,
      projects,
      error: null,
    }));
  }

  addProject(project: Project): void {
    this._updateState((state) => ({
      ...state,
      projects: [...state.projects, project],
      error: null,
    }));
  }

  updateProject(updatedProject: Project): void {
    this._updateState((state) => ({
      ...state,
      projects: state.projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      ),
      currentProject:
        state.currentProject?.id === updatedProject.id
          ? updatedProject
          : state.currentProject,
      error: null,
    }));
  }

  removeProject(projectId: string): void {
    this._updateState((state) => ({
      ...state,
      projects: state.projects.filter((project) => project.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
      modifications: state.modifications.filter(
        (mod) => mod.projectId !== projectId
      ),
      undoStack: state.undoStack.filter((mod) => mod.projectId !== projectId),
      redoStack: state.redoStack.filter((mod) => mod.projectId !== projectId),
      error: null,
    }));
  }

  setCurrentProject(project: Project | null): void {
    this._updateState((state) => ({
      ...state,
      currentProject: project,
      error: null,
    }));
  }

  /**
   * Undo/Redo Actions
   */
  addModification(modification: ProjectModification): void {
    this._updateState((state) => {
      const limits = this.undoRedoLimits();
      let newUndoStack = [...state.undoStack, modification];

      // Enforce subscription limits
      if (newUndoStack.length > limits.maxOperations) {
        newUndoStack = newUndoStack.slice(-limits.maxOperations);
      }

      return {
        ...state,
        modifications: [...state.modifications, modification],
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new modification is added
        error: null,
      };
    });
  }

  undo(): ProjectModification | null {
    const state = this._state();
    if (state.undoStack.length === 0) return null;

    const lastModification = state.undoStack[state.undoStack.length - 1];

    this._updateState((currentState) => ({
      ...currentState,
      undoStack: currentState.undoStack.slice(0, -1),
      redoStack: [...currentState.redoStack, lastModification],
      error: null,
    }));

    return lastModification;
  }

  redo(): ProjectModification | null {
    const state = this._state();
    if (state.redoStack.length === 0) return null;

    const nextModification = state.redoStack[state.redoStack.length - 1];

    this._updateState((currentState) => ({
      ...currentState,
      redoStack: currentState.redoStack.slice(0, -1),
      undoStack: [...currentState.undoStack, nextModification],
      error: null,
    }));

    return nextModification;
  }

  clearUndoRedo(): void {
    this._updateState((state) => ({
      ...state,
      undoStack: [],
      redoStack: [],
      error: null,
    }));
  }

  /**
   * UI State Actions
   */
  setLoading(isLoading: boolean): void {
    this._updateState((state) => ({
      ...state,
      isLoading,
    }));
  }

  setError(error: string | null): void {
    this._updateState((state) => ({
      ...state,
      error,
      isLoading: false,
    }));
  }

  clearError(): void {
    this._updateState((state) => ({
      ...state,
      error: null,
    }));
  }

  /**
   * Utility Actions
   */
  resetState(): void {
    this._state.set(initialState);
  }

  /**
   * Private helper to update state immutably
   */
  private _updateState(updateFn: (state: AppState) => AppState): void {
    this._state.update(updateFn);
  }

  /**
   * Get current state snapshot (for debugging)
   */
  getState(): AppState {
    return this._state();
  }

  /**
   * Subscribe to state changes (returns unsubscribe function)
   */
  subscribe(callback: (state: AppState) => void): () => void {
    // This would typically use an effect or computed
    // For now, this is a placeholder for future implementation
    console.warn(
      'AppStore.subscribe not yet implemented - use computed signals instead'
    );
    return () => {};
  }
}
