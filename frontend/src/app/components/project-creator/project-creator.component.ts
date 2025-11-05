import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectFormComponent } from '../../components/project-form/project-form.component';
import { ProjectService } from '../../services/project.service';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../../models/project.interface';

@Component({
  selector: 'app-project-creator',
  standalone: true,
  imports: [CommonModule, ProjectFormComponent],
  templateUrl: './project-creator.component.html',
  styleUrl: './project-creator.component.scss',
})
export class ProjectCreatorComponent implements OnInit {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  ngOnInit(): void {
    // Component initialization if needed
  }

  onFormSubmit(request: CreateProjectRequest | UpdateProjectRequest): void {
    // Since this is a creator component, we only expect CreateProjectRequest
    if ('name' in request && typeof request.name === 'string') {
      this.projectService
        .createProject(request as CreateProjectRequest)
        .subscribe({
          next: (project) => {
            // Navigate to the newly created project editor
            this.router
              .navigate(['/projects', project.id])
              .then((success) => {});
          },
          error: (error) => {
            console.error('❌ Failed to create project:', error);
            // Error handling could be improved here
          },
        });
    } else {
      console.warn(
        '⚠️  Unexpected request type in creator component:',
        request
      );
    }
  }

  onFormCancel(): void {
    // Navigate back to project list
    this.router.navigate(['/projects']);
  }
}
