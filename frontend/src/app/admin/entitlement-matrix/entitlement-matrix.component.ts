import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, catchError, of, finalize, forkJoin } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { Plan, Feature, PlanFeature } from '../types/admin.types';

interface MatrixData {
  plan: Plan;
  featureValues: Map<string, PlanFeature | null>;
}

@Component({
  selector: 'app-entitlement-matrix',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './entitlement-matrix.component.html',
  styleUrls: ['./entitlement-matrix.component.scss'],
})
export class EntitlementMatrixComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  plans: Plan[] = [];
  features: Feature[] = [];
  matrixData: MatrixData[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadMatrixData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMatrixData(): void {
    this.isLoading = true;
    this.error = null;

    // Load plans and features in parallel
    forkJoin({
      plans: this.adminService.getPlans(),
      features: this.adminService.getFeatures(),
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading matrix data:', error);
          this.error = 'Failed to load entitlement matrix. Please try again.';
          return of({ plans: [], features: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ plans, features }) => {
          this.plans = plans;
          this.features = features;
          this.buildMatrix();
        },
      });
  }

  private buildMatrix(): void {
    this.matrixData = this.plans.map((plan) => {
      const featureValues = new Map<string, PlanFeature | null>();

      // Initialize all features as null (not configured)
      this.features.forEach((feature) => {
        featureValues.set(feature.featureId, null);
      });

      // Set actual values for features that are configured for this plan
      if (plan.planFeatures) {
        plan.planFeatures.forEach((planFeature) => {
          featureValues.set(planFeature.featureId, planFeature);
        });
      }

      return {
        plan,
        featureValues,
      };
    });
  }

  retryLoading(): void {
    this.loadMatrixData();
  }

  getFeatureValue(matrixRow: MatrixData, feature: Feature): string {
    const planFeature = matrixRow.featureValues.get(feature.featureId);

    if (!planFeature) {
      return 'Not included';
    }

    if (feature.isBoolean) {
      return planFeature.value?.enabled ? 'Enabled' : 'Disabled';
    } else {
      return planFeature.value?.limit !== undefined
        ? `${planFeature.value.limit}`
        : 'Unlimited';
    }
  }

  getFeatureValueClass(matrixRow: MatrixData, feature: Feature): string {
    const planFeature = matrixRow.featureValues.get(feature.featureId);

    if (!planFeature) {
      return 'not-included';
    }

    if (feature.isBoolean) {
      return planFeature.value?.enabled ? 'enabled' : 'disabled';
    } else {
      const limit = planFeature.value?.limit;
      if (limit === undefined || limit === -1) {
        return 'unlimited';
      }
      return limit > 0 ? 'limited' : 'disabled';
    }
  }

  isPlanActive(plan: Plan): boolean {
    return plan.isActive;
  }

  formatPlanPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  getFeatureUnit(feature: Feature): string {
    if (feature.isBoolean) {
      return '';
    }

    // Try to infer unit from feature name
    const keyName = feature.keyName.toLowerCase();
    if (keyName.includes('storage') || keyName.includes('space')) {
      return 'GB';
    }
    if (
      keyName.includes('api') ||
      keyName.includes('call') ||
      keyName.includes('request')
    ) {
      return '/month';
    }
    if (keyName.includes('user') || keyName.includes('member')) {
      return 'users';
    }
    if (keyName.includes('project')) {
      return 'projects';
    }

    return '';
  }

  getMatrixSummary(): {
    totalPlans: number;
    totalFeatures: number;
    totalEntitlements: number;
  } {
    const totalPlans = this.plans.length;
    const totalFeatures = this.features.length;
    const totalEntitlements = this.matrixData.reduce((count, row) => {
      return (
        count +
        Array.from(row.featureValues.values()).filter((pf) => pf !== null)
          .length
      );
    }, 0);

    return { totalPlans, totalFeatures, totalEntitlements };
  }
}
