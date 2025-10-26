import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    component: LoginComponent,
  },

  // Protected routes - Project Management
  {
    path: 'dashboard',
    component: HomeComponent, // Placeholder until DashboardComponent is implemented
    canActivate: [AuthGuard],
    title: 'Dashboard - Love OKLCH',
  },
  {
    path: 'projects',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'new',
        component: HomeComponent, // Placeholder until ProjectFormComponent is implemented
        title: 'New Project - Love OKLCH',
      },
      {
        path: ':projectId',
        component: HomeComponent, // Placeholder until ProjectEditorComponent is implemented
        title: 'Edit Project - Love OKLCH',
      },
      {
        path: ':projectId/history',
        component: HomeComponent, // Placeholder until ModificationHistoryComponent is implemented
        title: 'Project History - Love OKLCH',
      },
    ],
  },

  // Legacy home route (redirect to dashboard)
  {
    path: 'home',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },

  // Admin routes (lazy-loaded)
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin-routing.module').then((m) => m.AdminRoutingModule),
    canActivate: [AuthGuard],
  },

  // Default redirects
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
