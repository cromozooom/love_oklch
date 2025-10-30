import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string[];
  active?: boolean;
}

/**
 * Breadcrumb navigation component
 * Displays hierarchical navigation path with clickable segments
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  /**
   * Breadcrumb items to display
   */
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  /**
   * Navigate to a breadcrumb route
   */
  navigateTo(route: string[]): void {
    if (route && route.length > 0) {
      this.router.navigate(route);
    }
  }

  /**
   * Track items for ngFor performance
   */
  trackByIndex(index: number): number {
    return index;
  }
}
