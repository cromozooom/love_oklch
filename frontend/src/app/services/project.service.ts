import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectQueryParams,
  ProjectState,
} from '../models/project.interface';
import { ColorGamut, ColorSpace } from '../models/color-enums';
import { ErrorHandlerService } from './error-handler.service';

interface ProjectLimitsResponse {
  success: boolean;
  data?: {
    currentProjects: number;
    projectLimit: number;
    canCreateMore: boolean;
    subscriptionType: string;
  };
  error?: string;
}

interface DashboardSummaryResponse {
  success: boolean;
  data?: {
    totalProjects: number;
    activeProjects: number;
    recentProjects: Project[];
    projectLimit: number;
    canCreateMore: boolean;
  };
  error?: string;
}

interface ProjectOptionsResponse {
  success: boolean;
  data?: {
    colorGamuts: Array<{ value: string; label: string; description: string }>;
    colorSpaces: Array<{ value: string; label: string; description: string }>;
  };
  error?: string;
}

/**
 * Angular service for project management
 * Handles HTTP communication with the backend API
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ErrorHandlerService);

  private readonly baseUrl = '/api/v1/projects';

  // Project state management using BehaviorSubject
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private selectedProjectSubject = new BehaviorSubject<Project | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public readonly projects$ = this.projectsSubject.asObservable();
  public readonly selectedProject$ = this.selectedProjectSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  /**
   * Get current project state
   */
  get currentState(): ProjectState {
    return {
      projects: this.projectsSubject.value,
      selectedProject: this.selectedProjectSubject.value,
      loading: this.loadingSubject.value,
      error: this.errorSubject.value,
      creating: false,
      updating: false,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all projects for the current user
   */
  getProjects(params?: ProjectQueryParams): Observable<Project[]> {
    this.setLoading(true);
    this.clearError();

    let httpParams = new HttpParams();
    if (params) {
      if (params.isActive !== undefined) {
        httpParams = httpParams.set('isActive', params.isActive.toString());
      }
      if (params.limit)
        httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset)
        httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder)
        httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http
      .get<ProjectListResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch projects');
          }
          return response.data;
        }),
        tap((projects) => {
          this.projectsSubject.next(projects);
          this.setLoading(false);
        }),
        catchError((error) => {
          this.handleError('Failed to fetch projects', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific project by ID
   */
  getProjectById(id: string): Observable<Project> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<ProjectResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Project not found');
        }
        return response.data;
      }),
      tap((project) => {
        this.selectedProjectSubject.next(project);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.handleError('Failed to fetch project', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new project
   */
  createProject(projectData: CreateProjectRequest): Observable<Project> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<ProjectResponse>(this.baseUrl, projectData).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create project');
        }
        return response.data;
      }),
      tap((newProject) => {
        // Add to projects list
        const currentProjects = this.projectsSubject.value;
        this.projectsSubject.next([newProject, ...currentProjects]);

        // Set as selected project
        this.selectedProjectSubject.next(newProject);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.handleError('Failed to create project', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing project
   */
  updateProject(
    id: string,
    updateData: UpdateProjectRequest
  ): Observable<Project> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<ProjectResponse>(`${this.baseUrl}/${id}`, updateData)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to update project');
          }
          return response.data;
        }),
        tap((updatedProject) => {
          // Update in projects list
          const currentProjects = this.projectsSubject.value;
          const updatedProjects = currentProjects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          );
          this.projectsSubject.next(updatedProjects);

          // Update selected project if it's the one being updated
          if (this.selectedProjectSubject.value?.id === updatedProject.id) {
            this.selectedProjectSubject.next(updatedProject);
          }

          this.setLoading(false);
        }),
        catchError((error) => {
          this.handleError('Failed to update project', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a project (soft delete)
   */
  deleteProject(id: string): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error('Failed to delete project');
          }
        }),
        tap(() => {
          // Remove from projects list
          const currentProjects = this.projectsSubject.value;
          const filteredProjects = currentProjects.filter((p) => p.id !== id);
          this.projectsSubject.next(filteredProjects);

          // Clear selected project if it was deleted
          if (this.selectedProjectSubject.value?.id === id) {
            this.selectedProjectSubject.next(null);
          }

          this.setLoading(false);
        }),
        catchError((error) => {
          this.handleError('Failed to delete project', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search projects by name
   */
  searchProjects(
    searchTerm: string,
    limit: number = 10
  ): Observable<Project[]> {
    this.setLoading(true);
    this.clearError();

    const params = new HttpParams()
      .set('q', searchTerm)
      .set('limit', limit.toString());

    return this.http
      .get<ProjectListResponse>(`${this.baseUrl}/search`, { params })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Search failed');
          }
          return response.data;
        }),
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.handleError('Search failed', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): Observable<DashboardSummaryResponse['data']> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<DashboardSummaryResponse>(`${this.baseUrl}/dashboard/summary`)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(
              response.error || 'Failed to fetch dashboard summary'
            );
          }
          return response.data;
        }),
        tap((summary) => {
          // Update projects list with recent projects
          this.projectsSubject.next(summary.recentProjects);
          this.setLoading(false);
        }),
        catchError((error) => {
          this.handleError('Failed to fetch dashboard summary', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get project creation limits
   */
  getProjectLimits(): Observable<ProjectLimitsResponse['data']> {
    return this.http.get<ProjectLimitsResponse>(`${this.baseUrl}/limits`).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch project limits');
        }
        return response.data;
      }),
      catchError((error) => {
        this.handleError('Failed to fetch project limits', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get color gamut and space options
   */
  getProjectOptions(): Observable<ProjectOptionsResponse['data']> {
    return this.http
      .get<ProjectOptionsResponse>(`${this.baseUrl}/options`)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(
              response.error || 'Failed to fetch project options'
            );
          }
          return response.data;
        }),
        catchError((error) => {
          this.handleError('Failed to fetch project options', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set selected project
   */
  setSelectedProject(project: Project | null): void {
    this.selectedProjectSubject.next(project);
  }

  /**
   * Clear all projects from state
   */
  clearProjects(): void {
    this.projectsSubject.next([]);
    this.selectedProjectSubject.next(null);
  }

  /**
   * Refresh projects list
   */
  refreshProjects(): Observable<Project[]> {
    return this.getProjects();
  }

  /**
   * Check if user can create more projects
   */
  canCreateProject(): Observable<boolean> {
    return this.getProjectLimits().pipe(
      map((limits) => limits?.canCreateMore ?? false)
    );
  }

  /**
   * Helper methods
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
    this.setLoading(false);
  }

  private handleError(message: string, error: any): void {
    console.error(`ProjectService Error: ${message}`, error);

    // Extract user-friendly error message
    let errorMessage = message;
    if (error?.error?.error) {
      errorMessage = error.error.error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.setError(errorMessage);
    this.errorHandler.handleHttpError(error);
  }

  /**
   * Utility methods for project data
   */
  getColorGamutDisplayName(gamut: ColorGamut): string {
    switch (gamut) {
      case ColorGamut.SRGB:
        return 'sRGB (Standard)';
      case ColorGamut.DISPLAY_P3:
        return 'Display P3 (Wide)';
      case ColorGamut.UNLIMITED:
        return 'Unlimited';
      default:
        return gamut;
    }
  }

  getColorSpaceDisplayName(space: ColorSpace): string {
    switch (space) {
      case ColorSpace.LCH:
        return 'LCH';
      case ColorSpace.OKLCH:
        return 'OKLCH';
      default:
        return space;
    }
  }

  formatProjectAge(project: Project): string {
    const now = new Date();
    const created = new Date(project.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
