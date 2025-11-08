import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Subject,
  takeUntil,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  scan,
} from 'rxjs';
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
import { UndoRedoService } from '../../services/undo-redo.service';
import { OptimisticUpdatesService } from '../../services/optimistic-updates.service';
import { UpdateProjectPropertyCommand } from '../../commands/update-project-property.command';
import { ColorSetterComponent } from '../../components/color-setter/color-setter.component';

/**
 * Form component for creating and editing projects
 * Supports both create and edit modes with validation
 */
@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ColorSetterComponent],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly undoRedoService = inject(UndoRedoService);
  private readonly optimisticUpdatesService = inject(OptimisticUpdatesService);
  private readonly destroy$ = new Subject<void>();

  // Input properties
  readonly project = input<Project | null>(null);
  readonly mode = input<'create' | 'edit'>('create');

  // Internal state for live syncing after creation
  private currentProject = signal<Project | null>(null);
  private currentMode = signal<'create' | 'edit'>('create');

  // Computed properties that use internal state when available, otherwise fall back to inputs
  private effectiveProject = computed(
    () => this.currentProject() || this.project()
  );
  private effectiveMode = computed(() => this.currentMode() || this.mode());

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

  // Optimistic updates state
  isSaving = computed(() => this.optimisticUpdatesService.isSaving());
  hasUnsavedChanges = computed(() =>
    this.optimisticUpdatesService.hasUnsavedChanges()
  );

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
    const projectData = this.effectiveProject();

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
      colorCount: [
        projectData?.colorCount || 5,
        [Validators.min(1), Validators.max(100)],
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
    // Store initial values for undo/redo tracking
    const initialValues = { ...this.projectForm.value };

    // Auto-suggest color space based on gamut selection
    this.projectForm
      .get('colorGamut')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((gamut: ColorGamut) => {
        if (gamut && !this.effectiveProject()) {
          // Only auto-suggest for new projects
          const recommendedSpace =
            ColorEnumHelpers.getRecommendedColorSpace(gamut);
          this.projectForm.get('colorSpace')?.setValue(recommendedSpace);
        }
      });

    // Track changes for undo/redo in edit mode or live sync mode (exclude name field)
    const currentProject = this.effectiveProject();

    // Set up form watchers if we have a project (either from input, created, or loaded from route)
    if (currentProject && currentProject.id) {
      const projectId = currentProject.id;

      // Track individual field changes (exclude name)
      const fieldsToTrack = Object.keys(this.projectForm.controls).filter(
        (fieldName) => fieldName !== 'name'
      );

      fieldsToTrack.forEach((fieldName) => {
        const control = this.projectForm.get(fieldName);
        if (!control) return;

        control.valueChanges
          .pipe(
            debounceTime(300), // Wait for user to stop typing
            distinctUntilChanged(), // Only emit if value actually changed
            scan(
              (acc, curr) => ({ prev: acc.curr, curr }),
              { prev: control.value, curr: control.value } // Initialize with current form value
            ),
            takeUntil(this.destroy$)
          )
          .subscribe(({ prev: previousValue, curr: newValue }) => {
            if (newValue !== previousValue) {
              // Create and execute undo/redo command
              const command = new UpdateProjectPropertyCommand(
                this.optimisticUpdatesService,
                projectId,
                fieldName,
                newValue,
                previousValue,
                (property: string, value: unknown) => {
                  // Update form value without triggering change detection loop
                  this.projectForm
                    .get(property)
                    ?.setValue(value, { emitEvent: false });
                }
              );

              this.undoRedoService.executeCommand(command);
            }
          });
      });
    }
  }

  /**
   * Check if we're in live sync mode (project created and syncing)
   */
  private isLiveSyncMode(): boolean {
    return !!this.createdProject;
  }

  /**
   * Get the current project (either from input or created project)
   */
  private getCurrentProject(): Project | null {
    return this.project() || this.createdProject;
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
    const currentProject = this.getCurrentProject();

    if (this.isEditMode() || this.isLiveSyncMode()) {
      const updateData: UpdateProjectRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        colorGamut: formValue.colorGamut,
        colorSpace: formValue.colorSpace,
        colorCount: formValue.colorCount || undefined, // Include demo field
      };

      this.formSubmit.emit(updateData);

      // Call service if we have a project to update
      if (currentProject) {
        this.projectService
          .updateProject(currentProject.id, updateData)
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
        colorCount: formValue.colorCount || undefined, // Include demo field
      };

      this.formSubmit.emit(createData);
    }
  }

  // Internal state for live syncing after creation
  private createdProject: Project | null = null;

  /**
   * Handle project creation and enable live syncing
   */
  onProjectCreated(createdProject: Project): void {
    // Update internal state to switch to live sync mode
    this.currentProject.set(createdProject);
    this.currentMode.set('edit');

    // Reinitialize form with the created project data
    this.initializeForm();

    // Re-setup watchers to enable live syncing
    this.setupFormWatchers();

    // Emit the creation event
    this.projectCreated.emit(createdProject);
  }
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
    return this.effectiveMode() === 'edit' && !!this.effectiveProject();
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

  /**
   * Get the gamut value for the color setter component
   * Maps the form's colorGamut enum to GamutProfile type
   */
  getGamutValue(): 'srgb' | 'display-p3' | 'rec2020' | 'unlimited' {
    const gamut = this.projectForm.get('colorGamut')?.value as ColorGamut;

    switch (gamut) {
      case ColorGamut.SRGB:
        return 'srgb';
      case ColorGamut.DISPLAY_P3:
        return 'display-p3';
      case ColorGamut.REC2020:
        return 'rec2020';
      case ColorGamut.UNLIMITED:
        return 'unlimited';
      default:
        return 'srgb'; // Default fallback
    }
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

  /**
   * Handle gamut changes from the color-setter component
   * Maps GamutProfile values to ColorGamut enum values for the form
   */
  onColorSetterGamutChange(
    gamutProfile: 'srgb' | 'display-p3' | 'rec2020' | 'unlimited'
  ): void {
    let formGamutValue: ColorGamut;

    switch (gamutProfile) {
      case 'srgb':
        formGamutValue = ColorGamut.SRGB;
        break;
      case 'display-p3':
        formGamutValue = ColorGamut.DISPLAY_P3;
        break;
      case 'rec2020':
        formGamutValue = ColorGamut.REC2020;
        break;
      case 'unlimited':
        formGamutValue = ColorGamut.UNLIMITED;
        break;
      default:
        formGamutValue = ColorGamut.SRGB;
    }

    // Update the form control
    this.projectForm.get('colorGamut')?.setValue(formGamutValue);
  }
}
