import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProjectService } from '../../services/project.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { Project } from '../../models/project.interface';
import {
  ColorGamut,
  ColorSpace,
  COLOR_GAMUT_INFO,
  COLOR_SPACE_INFO,
} from '../../models/color-enums';

/**
 * Component for displaying a list of user projects
 * Features:
 * - Displays projects in a responsive grid layout
 * - Shows project metadata (color gamut, color space, creation date)
 * - Provides navigation to project editor
 * - Handles loading states and errors
 * - Integrates with project management system
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  // Services
  private readonly projectService = inject(ProjectService);
  private readonly errorHandler = inject(ErrorHandlerService);

  // State signals
  public readonly projects = signal<Project[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  // Computed values
  public readonly hasProjects = computed(() => this.projects().length > 0);
  public readonly displayProjects = computed(() =>
    this.projects().map((project) => ({
      ...project,
      colorGamutDisplay: COLOR_GAMUT_INFO[project.colorGamut].label,
      colorSpaceDisplay: COLOR_SPACE_INFO[project.colorSpace].label,
      formattedCreatedAt: new Date(project.createdAt).toLocaleDateString(),
      formattedUpdatedAt: new Date(project.updatedAt).toLocaleDateString(),
    }))
  );

  // Color gamut and space display names for template
  public readonly COLOR_GAMUT_INFO = COLOR_GAMUT_INFO;
  public readonly COLOR_SPACE_INFO = COLOR_SPACE_INFO;

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  /**
   * Load projects from the backend
   */
  public async loadProjects(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      this.projectService.getProjects().subscribe({
        next: (projects) => {
          this.projects.set(projects);
        },
        error: (error) => {
          const errorMessage = error?.message || 'Failed to load projects';
          this.error.set(errorMessage);
          this.errorHandler.handleError(error, 'Failed to load projects');
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load projects';
      this.error.set(errorMessage);
      this.errorHandler.handleError(error, 'Failed to load projects');
      this.isLoading.set(false);
    }
  }

  /**
   * Navigate to project editor
   * @param projectId - The ID of the project to edit
   */
  public editProject(projectId: string): void {
    // TODO: Implement navigation to project editor when routing is complete
    console.log('Navigate to project editor:', projectId);
  }

  /**
   * Delete a project with confirmation
   * @param project - The project to delete
   */
  public async deleteProject(project: Project): Promise<void> {
    const confirmed = confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      this.isLoading.set(true);

      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          // Remove from local state
          this.projects.update((projects) =>
            projects.filter((p) => p.id !== project.id)
          );

          // Show success message using browser notification
          this.errorHandler.displayError(
            `Project "${project.name}" deleted successfully`,
            { severity: 'info', duration: 3000 }
          );
        },
        error: (error) => {
          const errorMessage =
            error?.message || `Failed to delete project "${project.name}"`;
          this.errorHandler.handleError(
            error,
            `Failed to delete project "${project.name}"`
          );
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      this.errorHandler.handleError(
        error,
        `Failed to delete project "${project.name}"`
      );
      this.isLoading.set(false);
    }
  }

  /**
   * Refresh the project list
   */
  public async refreshProjects(): Promise<void> {
    await this.loadProjects();
  }

  /**
   * Get project card elevation based on state
   * @param project - The project to check
   * @returns Material elevation level
   */
  public getCardElevation(project: Project): number {
    // Higher elevation for recently updated projects
    const hoursSinceUpdate =
      (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate < 24 ? 4 : 2;
  }

  /**
   * Track projects for ngFor performance
   * @param index - Array index
   * @param project - Project item
   * @returns Unique identifier
   */
  public trackByProject(index: number, project: Project): string {
    return project.id;
  }
}
