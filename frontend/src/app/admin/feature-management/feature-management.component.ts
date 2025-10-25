import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { Feature, CreateFeatureRequest } from '../types/admin.types';

@Component({
  selector: 'app-feature-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './feature-management.component.html',
  styleUrls: ['./feature-management.component.scss'],
})
export class FeatureManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  features: Feature[] = [];
  selectedFeature: Feature | null = null;
  isLoading = false;
  error: string | null = null;

  featureForm: FormGroup;
  showCreateForm = false;
  editingFeature: Feature | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.featureForm = this.createFeatureForm();
  }

  ngOnInit(): void {
    this.loadFeatures();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFeatureForm(): FormGroup {
    return this.fb.group({
      keyName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[a-z_][a-z0-9_]*$/),
        ],
      ],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      isBoolean: [false],
    });
  }

  private loadFeatures(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService
      .getFeatures()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading features:', error);
          this.error = 'Failed to load features. Please try again.';
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (features: Feature[]) => {
          this.features = features;
        },
      });
  }

  retryLoading(): void {
    this.loadFeatures();
  }

  onSelectFeature(feature: Feature): void {
    this.selectedFeature = feature;
  }

  onCreateNewFeature(): void {
    this.showCreateForm = true;
    this.editingFeature = null;
    this.featureForm.reset();
    this.featureForm.patchValue({ isBoolean: false });
  }

  onEditFeature(feature: Feature): void {
    this.editingFeature = feature;
    this.showCreateForm = true;
    this.populateFeatureForm(feature);
  }

  private populateFeatureForm(feature: Feature): void {
    this.featureForm.patchValue({
      keyName: feature.keyName,
      displayName: feature.displayName,
      description: feature.description,
      isBoolean: feature.isBoolean,
    });

    // Disable keyName editing for existing features to maintain data integrity
    if (this.editingFeature) {
      this.featureForm.get('keyName')?.disable();
    }
  }

  onSaveFeature(): void {
    if (this.featureForm.valid) {
      this.isLoading = true;
      this.error = null;

      const featureData = this.prepareFeatureData();

      const saveOperation = this.editingFeature
        ? this.adminService.updateFeature(
            this.editingFeature.featureId,
            featureData
          )
        : this.adminService.createFeature(featureData);

      saveOperation
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error saving feature:', error);
            this.error = 'Failed to save feature. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (result: Feature | null) => {
            if (result) {
              this.showCreateForm = false;
              this.editingFeature = null;
              this.loadFeatures(); // Refresh features list

              // Enable keyName field for next create operation
              this.featureForm.get('keyName')?.enable();
            }
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private prepareFeatureData(): CreateFeatureRequest {
    const formValue = this.featureForm.value;

    return {
      keyName: formValue.keyName,
      displayName: formValue.displayName,
      description: formValue.description,
      isBoolean: formValue.isBoolean,
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.featureForm.controls).forEach((key) => {
      const control = this.featureForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancelEdit(): void {
    this.showCreateForm = false;
    this.editingFeature = null;
    this.featureForm.reset();
    this.featureForm.get('keyName')?.enable(); // Re-enable for next create
  }

  onDeleteFeature(feature: Feature): void {
    if (
      confirm(
        `Are you sure you want to delete the feature "${feature.displayName}"? This will remove it from all plans and cannot be undone.`
      )
    ) {
      this.isLoading = true;
      this.error = null;

      this.adminService
        .deleteFeature(feature.featureId)
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error deleting feature:', error);
            this.error = 'Failed to delete feature. Please try again.';
            return of(false);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (success: boolean) => {
            if (success) {
              this.loadFeatures(); // Refresh features list
              if (this.selectedFeature?.featureId === feature.featureId) {
                this.selectedFeature = null;
              }
            }
          },
        });
    }
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.featureForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.featureForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(
          fieldName
        )} must be at least ${requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Key name must be lowercase with underscores (e.g., api_calls, storage_limit)';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      keyName: 'Key name',
      displayName: 'Display name',
      description: 'Description',
    };
    return displayNames[fieldName] || fieldName;
  }

  getFeatureTypeLabel(feature: Feature): string {
    return feature.isBoolean ? 'Boolean (Enable/Disable)' : 'Limit (Numeric)';
  }
}
