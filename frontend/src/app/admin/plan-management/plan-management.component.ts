import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { Plan, Feature, PlanFeature } from '../types/admin.types';

@Component({
  selector: 'app-plan-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './plan-management.component.html',
  styleUrls: ['./plan-management.component.scss'],
})
export class PlanManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  plans: Plan[] = [];
  features: Feature[] = [];
  selectedPlan: Plan | null = null;
  isLoading = false;
  error: string | null = null;

  planForm: FormGroup;
  showCreateForm = false;
  editingPlan: Plan | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.planForm = this.createPlanForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createPlanForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      features: this.fb.array([]),
    });
  }

  get featuresFormArray(): FormArray {
    return this.planForm.get('features') as FormArray;
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.error = null;

    // Load plans and features in parallel
    Promise.all([this.loadPlans(), this.loadFeatures()]).finally(() => {
      this.isLoading = false;
    });
  }

  retryLoading(): void {
    this.loadInitialData();
  }

  private loadPlans(): Promise<void> {
    return new Promise((resolve) => {
      this.adminService
        .getPlans()
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error loading plans:', error);
            this.error = 'Failed to load plans. Please try again.';
            return of([]);
          })
        )
        .subscribe({
          next: (plans: Plan[]) => {
            this.plans = plans;
            resolve();
          },
        });
    });
  }

  private loadFeatures(): Promise<void> {
    return new Promise((resolve) => {
      this.adminService
        .getFeatures()
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error loading features:', error);
            this.error = 'Failed to load features. Please try again.';
            return of([]);
          })
        )
        .subscribe({
          next: (features: Feature[]) => {
            this.features = features;
            resolve();
          },
        });
    });
  }

  onSelectPlan(plan: Plan): void {
    this.selectedPlan = plan;
    this.loadPlanFeatures(plan.planId);
  }

  private loadPlanFeatures(planId: string): void {
    this.adminService
      .getPlanFeatures(planId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading plan features:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (planFeatures: PlanFeature[]) => {
          if (this.selectedPlan) {
            this.selectedPlan.planFeatures = planFeatures;
          }
        },
      });
  }

  onCreateNewPlan(): void {
    this.showCreateForm = true;
    this.editingPlan = null;
    this.planForm.reset();
    this.setupFeaturesFormArray();
  }

  onEditPlan(plan: Plan): void {
    this.editingPlan = plan;
    this.showCreateForm = true;
    this.populatePlanForm(plan);
  }

  private populatePlanForm(plan: Plan): void {
    this.planForm.patchValue({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      isActive: plan.isActive,
    });
    this.setupFeaturesFormArray(plan.planFeatures);
  }

  private setupFeaturesFormArray(planFeatures: PlanFeature[] = []): void {
    const featuresArray = this.planForm.get('features') as FormArray;
    featuresArray.clear();

    this.features.forEach((feature) => {
      const existingPlanFeature = planFeatures.find(
        (pf) => pf.featureId === feature.featureId
      );
      const featureGroup = this.fb.group({
        featureId: [feature.featureId],
        featureName: [feature.displayName],
        isEnabled: [!!existingPlanFeature],
        value: [
          existingPlanFeature?.value || this.getDefaultFeatureValue(feature),
        ],
      });

      featuresArray.push(featureGroup);
    });
  }

  private getDefaultFeatureValue(feature: Feature): any {
    if (feature.isBoolean) {
      return { enabled: false };
    } else {
      return { limit: 0 };
    }
  }

  onSavePlan(): void {
    if (this.planForm.valid) {
      this.isLoading = true;
      this.error = null;

      const planData = this.preparePlanData();

      const saveOperation = this.editingPlan
        ? this.adminService.updatePlan(this.editingPlan.planId, planData)
        : this.adminService.createPlan(planData);

      saveOperation
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error saving plan:', error);
            this.error = 'Failed to save plan. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (result: Plan | null) => {
            if (result) {
              this.showCreateForm = false;
              this.editingPlan = null;
              this.loadPlans(); // Refresh plans list
            }
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private preparePlanData(): any {
    const formValue = this.planForm.value;

    return {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      isActive: formValue.isActive,
      features: formValue.features
        .filter((f: any) => f.isEnabled)
        .map((f: any) => ({
          featureId: f.featureId,
          value: f.value,
        })),
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.planForm.controls).forEach((key) => {
      const control = this.planForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach((arrayKey) => {
              arrayControl.get(arrayKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  onCancelEdit(): void {
    this.showCreateForm = false;
    this.editingPlan = null;
    this.planForm.reset();
  }

  onDeletePlan(plan: Plan): void {
    if (
      confirm(
        `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`
      )
    ) {
      this.isLoading = true;
      this.error = null;

      this.adminService
        .deletePlan(plan.planId)
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Error deleting plan:', error);
            this.error = 'Failed to delete plan. Please try again.';
            return of(false);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (success: boolean) => {
            if (success) {
              this.loadPlans(); // Refresh plans list
              if (this.selectedPlan?.planId === plan.planId) {
                this.selectedPlan = null;
              }
            }
          },
        });
    }
  }

  onTogglePlanStatus(plan: Plan): void {
    this.isLoading = true;
    this.error = null;

    const updatedPlan = { ...plan, isActive: !plan.isActive };

    this.adminService
      .updatePlan(plan.planId, updatedPlan)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error updating plan status:', error);
          this.error = 'Failed to update plan status. Please try again.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (result: Plan | null) => {
          if (result) {
            this.loadPlans(); // Refresh plans list
          }
        },
      });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.planForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.planForm.get(fieldName);
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
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(
          fieldName
        )} must be greater than or equal to 0`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Plan name',
      description: 'Description',
      price: 'Price',
    };
    return displayNames[fieldName] || fieldName;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  getFeatureDisplayValue(planFeature: PlanFeature): string {
    if (typeof planFeature.value === 'object') {
      if ('enabled' in planFeature.value) {
        return planFeature.value.enabled ? 'Enabled' : 'Disabled';
      }
      if ('limit' in planFeature.value) {
        return `Limit: ${planFeature.value.limit}`;
      }
    }
    return 'N/A';
  }
}
