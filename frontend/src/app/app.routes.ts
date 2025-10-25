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

  // Protected routes
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    component: HomeComponent, // For now, redirect to home
    canActivate: [AuthGuard],
  },

  // Admin routes (lazy-loaded)
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin-routing.module').then((m) => m.AdminRoutingModule),
  },

  // Default redirects
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/login',
  },
];
