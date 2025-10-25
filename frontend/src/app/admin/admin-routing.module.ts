import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PlanManagementComponent } from './plan-management/plan-management.component';

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
      // Additional routes will be added as components are implemented:
      // - features: Feature Management
      // - entitlements: Entitlement Matrix
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
