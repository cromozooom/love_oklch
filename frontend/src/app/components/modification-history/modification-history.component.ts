import { Component, input, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectModification } from '../../models/project-modification.interface';
import { OptimisticUpdatesService } from '../../services/optimistic-updates.service';

@Component({
  selector: 'app-modification-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modification-history.component.html',
  styleUrl: './modification-history.component.scss',
})
export class ModificationHistoryComponent {
  private optimisticUpdatesService = inject(OptimisticUpdatesService);

  // Input signals
  modifications = input<ProjectModification[]>([]);
  projectId = input<string>('');
  loading = input<boolean>(false);
  error = input<string | null>(null);

  // History count
  historyCount = signal<number>(0);

  constructor() {
    // Update history count when changes occur
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.historyCount.set(
          this.optimisticUpdatesService.getHistoryCount(pid)
        );
      }
    });
  }

  /**
   * Format modification value for display
   */
  formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Get modification type display text
   */
  getModificationTypeText(type: string): string {
    switch (type) {
      case 'property_change':
        return 'Property Changed';
      case 'initial_state':
        return 'Initial State';
      default:
        return type;
    }
  }

  /**
   * Track by function for ngFor performance
   */
  trackByModificationId(
    index: number,
    modification: ProjectModification
  ): string {
    return modification.id;
  }
}
