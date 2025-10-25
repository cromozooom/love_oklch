import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    component: LoginComponent,
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
