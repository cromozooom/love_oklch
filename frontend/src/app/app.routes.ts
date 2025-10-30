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
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
    title: 'Dashboard - Love OKLCH',
    children: [
      {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./components/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
        title: 'Projects - Love OKLCH',
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'New Project - Love OKLCH',
      },
      {
        path: 'projects/:projectId',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'Edit Project - Love OKLCH',
      },
      {
        path: 'projects/:projectId/history',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        title: 'Project History - Love OKLCH',
      },
    ],
  },

  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full',
  },

  // Legacy projects routes (redirect to dashboard)
  {
    path: 'projects',
    redirectTo: '/projects',
    pathMatch: 'full',
  },
  {
    path: 'projects/:projectId',
    redirectTo: '/projects/:projectId',
    pathMatch: 'prefix',
  },

  // Legacy home route (redirect to dashboard)
  {
    path: 'home',
    redirectTo: '/',
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
    redirectTo: '/',
    pathMatch: 'full',
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/',
  },
];
