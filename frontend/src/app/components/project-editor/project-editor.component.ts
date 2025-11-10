import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProjectFormComponent } from '../../components/project-form/project-form.component';
import { UndoRedoControlsComponent } from '../../components/undo-redo-controls/undo-redo-controls.component';
import { ModificationHistoryComponent } from '../../components/modification-history/modification-history.component';
import { ColorSetterComponent } from '../../components/color-setter/color-setter.component';
import { ProjectService } from '../../services/project.service';
import { OptimisticUpdatesService } from '../../services/optimistic-updates.service';
import { Project } from '../../models/project.interface';
import { ProjectModification } from '../../models/project-modification.interface';

@Component({
  selector: 'app-project-editor',
  standalone: true,
  imports: [
    CommonModule,
    ProjectFormComponent,
    UndoRedoControlsComponent,
    ModificationHistoryComponent,
  ],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss',
})
export class ProjectEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private optimisticUpdatesService = inject(OptimisticUpdatesService);

  projectId = signal<string>('');
  project = signal<Project | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  modifications = signal<ProjectModification[]>([]);
  modificationsLoading = signal<boolean>(false);
  modificationsError = signal<string | null>(null);

  // Optimistic updates state
  isSaving = computed(() => this.optimisticUpdatesService.isSaving());
  hasUnsavedChanges = computed(() =>
    this.optimisticUpdatesService.hasUnsavedChanges()
  );

  ngOnInit(): void {
    const projectId = this.route.snapshot.params['projectId'];
    if (projectId) {
      this.projectId.set(projectId);
      this.loadProject(projectId);
    } else {
      this.isLoading.set(false);
      this.error.set('No project ID provided');
    }
  }

  loadProject(projectId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.projectService.getProjectById(projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.isLoading.set(false);

        // Restore any pending changes from session
        this.restoreSessionChanges(projectId);

        // Load modifications after project is loaded
        this.loadModifications(projectId);
      },
      error: (err) => {
        this.error.set('Failed to load project');
        console.error('Error loading project:', err);
        this.isLoading.set(false);
      },
    });
  }

  private loadModifications(projectId: string): void {
    this.modificationsLoading.set(true);
    this.modificationsError.set(null);

    this.projectService.getProjectModifications(projectId).subscribe({
      next: (modifications) => {
        this.modifications.set(modifications);
        this.modificationsLoading.set(false);
      },
      error: (err) => {
        this.modificationsError.set('Failed to load modification history');
        console.error('Error loading modifications:', err);
        this.modificationsLoading.set(false);
      },
    });
  }

  private restoreSessionChanges(projectId: string): void {
    // Get pending changes for this project
    const pendingChanges =
      this.optimisticUpdatesService.getPendingChanges(projectId);

    if (pendingChanges.length > 0) {
      // The changes will be applied by the form component when it initializes
      // The optimistic updates service will handle re-applying them
    }
  }

  onProjectUpdated(): void {
    // Reload project data after updates
    if (this.projectId()) {
      this.loadProject(this.projectId());
      this.loadModifications(this.projectId());
    }
  }

  onUndoExecuted(): void {
    // Don't reload from server - the undo callback already updated the form
    // Just refresh the modification history
    if (this.projectId()) {
      this.loadModifications(this.projectId());
    }
  }

  onRedoExecuted(): void {
    // Don't reload from server - the redo callback already updated the form
    // Just refresh the modification history
    if (this.projectId()) {
      this.loadModifications(this.projectId());
    }
  }
}
