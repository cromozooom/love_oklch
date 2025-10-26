import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  Project,
} from '../../models/project.interface';
import {
  ColorGamut,
  ColorSpace,
  ColorEnumHelpers,
} from '../../models/color-enums';
import { ProjectValidators } from '../../validators/project.validators';

/**
 * Form component for creating and editing projects
 * Supports both create and edit modes with validation
 */
@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="project-form-container">
      <form
        [formGroup]="projectForm"
        (ngSubmit)="onSubmit()"
        class="project-form"
      >
        <!-- Form Title -->
        <div class="form-header">
          <h2 class="form-title">
            {{ isEditMode() ? 'Edit Project' : 'Create New Project' }}
          </h2>
          @if (projectLimits) {
          <div class="subscription-info">
            <span class="current-projects">{{
              projectLimits.currentProjects
            }}</span>
            @if (projectLimits.projectLimit > 0) {
            <span class="project-limit"
              >/ {{ projectLimits.projectLimit }}</span
            >
            } @else {
            <span class="unlimited">unlimited</span>
            }
            <span class="projects-label">projects</span>
          </div>
          }
        </div>

        <!-- Project Name Field -->
        <div class="form-field">
          <label for="name" class="field-label"> Project Name * </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Enter project name"
            class="field-input"
            [class.error]="isFieldInvalid('name')"
            maxlength="100"
          />
          @if (isFieldInvalid('name')) {
          <div class="field-error">
            @if (projectForm.get('name')?.errors?.['required']) { Project name
            is required } @if (projectForm.get('name')?.errors?.['minlength']) {
            Project name must be at least 1 character } @if
            (projectForm.get('name')?.errors?.['maxlength']) { Project name must
            be 100 characters or less }
          </div>
          }
        </div>

        <!-- Project Description Field -->
        <div class="form-field">
          <label for="description" class="field-label"> Description </label>
          <textarea
            id="description"
            formControlName="description"
            placeholder="Enter project description (optional)"
            class="field-textarea"
            [class.error]="isFieldInvalid('description')"
            maxlength="500"
            rows="3"
          ></textarea>
          @if (isFieldInvalid('description')) {
          <div class="field-error">
            @if (projectForm.get('description')?.errors?.['maxlength']) {
            Description must be 500 characters or less }
          </div>
          }
          <div class="field-hint">
            {{ getDescriptionCharCount() }}/500 characters
          </div>
        </div>

        <!-- Color Gamut Field -->
        <div class="form-field">
          <label for="colorGamut" class="field-label"> Color Gamut * </label>
          <select
            id="colorGamut"
            formControlName="colorGamut"
            class="field-select"
            [class.error]="isFieldInvalid('colorGamut')"
          >
            <option value="" disabled>Select color gamut</option>
            @for (option of colorGamutOptions; track option.value) {
            <option [value]="option.value">
              {{ option.label }}
            </option>
            }
          </select>
          @if (selectedGamutInfo()) {
          <div class="field-info">
            {{ selectedGamutInfo()?.description }}
            <br />
            <strong>Coverage:</strong> {{ selectedGamutInfo()?.coverage }}
            <br />
            <strong>Best for:</strong> {{ selectedGamutInfo()?.recommendation }}
          </div>
          } @if (isFieldInvalid('colorGamut')) {
          <div class="field-error">Color gamut is required</div>
          }
        </div>

        <!-- Color Space Field -->
        <div class="form-field">
          <label for="colorSpace" class="field-label"> Color Space * </label>
          <select
            id="colorSpace"
            formControlName="colorSpace"
            class="field-select"
            [class.error]="isFieldInvalid('colorSpace')"
          >
            <option value="" disabled>Select color space</option>
            @for (option of colorSpaceOptions; track option.value) {
            <option [value]="option.value">
              {{ option.label }}
            </option>
            }
          </select>
          @if (selectedSpaceInfo()) {
          <div class="field-info">
            {{ selectedSpaceInfo()?.description }}
            <br />
            <strong>Perceptual Uniformity:</strong>
            {{ selectedSpaceInfo()?.perceptualUniformity }}
            <br />
            <strong>Best for:</strong> {{ selectedSpaceInfo()?.recommendation }}
          </div>
          } @if (isFieldInvalid('colorSpace')) {
          <div class="field-error">Color space is required</div>
          }
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel()"
            [disabled]="isSubmitting()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!projectForm.valid || isSubmitting() || !canSubmit()"
          >
            @if (isSubmitting()) {
            <span class="loading-spinner"></span>
            {{ isEditMode() ? 'Updating...' : 'Creating...' }}
            } @else {
            {{ isEditMode() ? 'Update Project' : 'Create Project' }}
            }
          </button>
        </div>

        <!-- Limit Warning -->
        @if (!isEditMode() && projectLimits && !projectLimits.canCreateMore) {
        <div class="limit-warning">
          <p>You've reached your project limit for this subscription.</p>
          @if (projectLimits.subscriptionType === 'default') {
          <button type="button" class="btn btn-upgrade">
            Upgrade to Premium
          </button>
          }
        </div>
        }
      </form>
    </div>
  `,
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly destroy$ = new Subject<void>();

  // Input properties
  readonly project = input<Project | null>(null);
  readonly mode = input<'create' | 'edit'>('create');

  // Output events
  readonly formSubmit = output<CreateProjectRequest | UpdateProjectRequest>();
  readonly formCancel = output<void>();
  readonly projectCreated = output<Project>();
  readonly projectUpdated = output<Project>();

  // Form and validation
  projectForm!: FormGroup;
  isSubmitting = input<boolean>(false);

  // Options and metadata
  colorGamutOptions = ColorEnumHelpers.getColorGamutOptions();
  colorSpaceOptions = ColorEnumHelpers.getColorSpaceOptions();

  // State
  projectLimits: any = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadProjectLimits();
    this.setupFormWatchers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    const defaultConfig = ColorEnumHelpers.getDefaultProjectConfig();
    const projectData = this.project();

    this.projectForm = this.formBuilder.group({
      name: [
        projectData?.name || '',
        [
          ProjectValidators.projectName(),
          ProjectValidators.uniqueProjectName(),
        ],
      ],
      description: [
        projectData?.description || '',
        [Validators.maxLength(500)],
      ],
      colorGamut: [
        projectData?.colorGamut || defaultConfig.colorGamut,
        [ProjectValidators.colorGamut()],
      ],
      colorSpace: [
        projectData?.colorSpace || defaultConfig.colorSpace,
        [ProjectValidators.colorSpace()],
      ],
    });
  }

  /**
   * Load project creation limits
   */
  private loadProjectLimits(): void {
    if (!this.isEditMode()) {
      this.projectService
        .getProjectLimits()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (limits) => {
            this.projectLimits = limits;
          },
          error: (error) => {
            console.error('Failed to load project limits:', error);
          },
        });
    }
  }

  /**
   * Setup form value watchers for real-time updates
   */
  private setupFormWatchers(): void {
    // Auto-suggest color space based on gamut selection
    this.projectForm
      .get('colorGamut')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((gamut: ColorGamut) => {
        if (gamut && !this.project()) {
          // Only auto-suggest for new projects
          const recommendedSpace =
            ColorEnumHelpers.getRecommendedColorSpace(gamut);
          this.projectForm.get('colorSpace')?.setValue(recommendedSpace);
        }
      });
  }

  /**
   * Form submission handler
   */
  onSubmit(): void {
    if (!this.projectForm.valid || !this.canSubmit()) {
      this.markAllFieldsAsTouched();
      return;
    }

    const formValue = this.projectForm.value;

    if (this.isEditMode()) {
      const updateData: UpdateProjectRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        colorGamut: formValue.colorGamut,
        colorSpace: formValue.colorSpace,
      };

      this.formSubmit.emit(updateData);

      // Call service if no external handler
      if (this.project()) {
        this.projectService
          .updateProject(this.project()!.id, updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedProject) => {
              this.projectUpdated.emit(updatedProject);
            },
            error: (error) => {
              console.error('Failed to update project:', error);
            },
          });
      }
    } else {
      const createData: CreateProjectRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        colorGamut: formValue.colorGamut,
        colorSpace: formValue.colorSpace,
      };

      this.formSubmit.emit(createData);

      // Call service if no external handler
      this.projectService
        .createProject(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newProject) => {
            this.projectCreated.emit(newProject);
            this.resetForm();
          },
          error: (error) => {
            console.error('Failed to create project:', error);
          },
        });
    }
  }

  /**
   * Cancel form handler
   */
  onCancel(): void {
    this.formCancel.emit();
    if (!this.isEditMode()) {
      this.resetForm();
    }
  }

  /**
   * Utility methods
   */
  isEditMode(): boolean {
    return this.mode() === 'edit' && !!this.project();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Check if form can be submitted (no blocking errors and within limits)
   */
  canSubmit(): boolean {
    // Check form validity using our enhanced validation
    const formValidation = this.getFormValidation();
    if (!formValidation.isValid) {
      return false;
    }

    // For edit mode, always allow submission if form is valid
    if (this.isEditMode()) {
      return true;
    }

    // For create mode, check project limits
    return this.projectLimits?.canCreateMore ?? true;
  }

  getDescriptionCharCount(): number {
    return this.projectForm.get('description')?.value?.length || 0;
  }

  selectedGamutInfo() {
    const gamut = this.projectForm.get('colorGamut')?.value;
    return gamut ? ColorEnumHelpers.getColorGamutInfo(gamut) : null;
  }

  selectedSpaceInfo() {
    const space = this.projectForm.get('colorSpace')?.value;
    return space ? ColorEnumHelpers.getColorSpaceInfo(space) : null;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.projectForm.controls).forEach((key) => {
      this.projectForm.get(key)?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.projectForm.reset();
    this.initializeForm();
  }

  /**
   * Get validation error message for a form field
   * Uses our custom ProjectValidators for user-friendly messages
   */
  getFieldError(fieldName: string): string | null {
    const field = this.projectForm.get(fieldName);
    if (!field || !field.touched) {
      return null;
    }
    return ProjectValidators.getErrorMessage(field);
  }

  /**
   * Get validation warning message for a form field
   * For non-blocking validation feedback
   */
  getFieldWarning(fieldName: string): string | null {
    const field = this.projectForm.get(fieldName);
    if (!field || !field.touched) {
      return null;
    }
    return ProjectValidators.getWarningMessage(field);
  }

  /**
   * Check if a field has validation errors (excluding warnings)
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    if (!field || !field.touched) {
      return false;
    }
    return ProjectValidators.hasErrors(field);
  }

  /**
   * Get comprehensive validation summary for the entire form
   */
  getFormValidation(): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
  } {
    return ProjectValidators.validateProjectForm(this.projectForm);
  }
}
