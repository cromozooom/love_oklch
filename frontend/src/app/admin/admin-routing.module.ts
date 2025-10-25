import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PlanManagementComponent } from './plan-management/plan-management.component';
import { FeatureManagementComponent } from './feature-management/feature-management.component';
import { EntitlementMatrixComponent } from './entitlement-matrix/entitlement-matrix.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AdminAuthGuard],
    canActivateChild: [AdminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'plans',
        pathMatch: 'full',
      },
      {
        path: 'plans',
        component: PlanManagementComponent,
        data: {
          title: 'Plan Management',
          description: 'Manage subscription plans and features',
        },
      },
      {
        path: 'features',
        component: FeatureManagementComponent,
        data: {
          title: 'Feature Management',
          description: 'Create and manage features for subscription plans',
        },
      },
      {
        path: 'entitlements',
        component: EntitlementMatrixComponent,
        data: {
          title: 'Entitlement Matrix',
          description: 'View feature entitlements across all plans',
        },
      },
      // Additional routes will be added as components are implemented:
      // - analytics: Analytics Dashboard
      // - users: User Management
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}

// Export route configuration for standalone component setup
export const adminRoutes: Routes = routes;
