import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../breadcrumb/breadcrumb.component';
import {
  LayoutStateStore,
  SpxLayoutContainerComponent,
} from '@solopx/spx-ui-kit';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SpxLayoutContainerComponent,
    BreadcrumbComponent,
  ],
})
export class DashboardComponent implements OnInit {
  // Inject the UI Kit's LayoutStateStore
  private layoutStore = inject(LayoutStateStore);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Access layout state
  readonly layoutState = this.layoutStore.state;

  // Dashboard state management
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Breadcrumb navigation - reactive
  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Dashboard', route: ['/dashboard'], active: false },
  ]);

  ngOnInit() {
    // Update breadcrumbs based on navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBreadcrumbs(event.urlAfterRedirects);
      });

    // Initial breadcrumb update
    this.updateBreadcrumbs(this.router.url);
  }

  private updateBreadcrumbs(url: string): void {
    const baseBreadcrumbs: BreadcrumbItem[] = [];

    if (url.includes('/projects')) {
      baseBreadcrumbs.push({
        label: 'Projects',
        route: ['/', 'projects'],
        active: url === '/projects',
      });

      if (url.includes('/new')) {
        baseBreadcrumbs.push({
          label: 'New Project',
          active: true,
        });
      } else if (url.includes('/history')) {
        baseBreadcrumbs.push({
          label: 'Project Editor',
          route: ['/', 'projects', url.split('/')[2]],
          active: false,
        });
        baseBreadcrumbs.push({
          label: 'History',
          active: true,
        });
      } else if (url.match(/\/projects\/[^\/]+$/)) {
        baseBreadcrumbs.push({
          label: 'Project Editor',
          active: true,
        });
      }
    }

    this.breadcrumbs.set(baseBreadcrumbs);
  }

  // Methods to control layout
  toggleSidebar() {
    this.layoutStore.setSidebarOpen(!this.layoutState().sidebarOpen);
  }

  setTheme(theme: 'light' | 'dark') {
    this.layoutStore.setTheme(theme);
  }

  /**
   * Retry loading dashboard data
   */
  retryLoad(): void {
    this.error.set(null);
    // In a real implementation, this would trigger data reloading
    // For now, just clear the error state
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, redirect to login
        this.router.navigate(['/login']);
      },
    });
  }

  // Dashboard logic: project list is displayed via ProjectListComponent
}
