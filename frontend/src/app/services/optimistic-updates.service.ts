import { Injectable, signal, computed } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  timer,
  debounceTime,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { ProjectService } from './project.service';
import { ProjectModification } from '../models/project-modification.interface';
import { ModificationType } from '../models/modification-type.enum';

export interface OptimisticChange {
  id: string;
  projectId: string;
  propertyName: string;
  newValue: unknown;
  previousValue: unknown;
  timestamp: Date;
  status: 'pending' | 'saving' | 'saved' | 'error';
  retryCount: number;
}

export interface SessionState {
  projectId: string;
  changes: OptimisticChange[];
  lastSaved: Date;
}

@Injectable({
  providedIn: 'root',
})
export class OptimisticUpdatesService {
  private readonly SESSION_KEY = 'love-oklch-session-state';
  private readonly HISTORY_KEY = 'love-oklch-history';
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly SAVE_DEBOUNCE_MS = 1000; // 1 second after last change (like Google Docs)
  private readonly MAX_MEMORY_CHANGES = 1000; // Keep 1000 changes in memory
  private readonly MAX_LOCALSTORAGE_CHANGES = 100; // Keep 100 most recent in localStorage
  private readonly SERVER_SYNC_INTERVAL = 300000; // Sync to server every 5 minutes

  // Signals for reactive state
  private changesSubject = new BehaviorSubject<OptimisticChange[]>([]);
  public changes = computed(() => this.changesSubject.value);

  private savingSubject = new BehaviorSubject<boolean>(false);
  public isSaving = computed(() => this.savingSubject.value);

  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(false);
  public hasUnsavedChanges = computed(
    () => this.hasUnsavedChangesSubject.value
  );

  // Events
  private saveTrigger = new Subject<void>();
  private changeSaved = new Subject<OptimisticChange>();
  private changeError = new Subject<{ change: OptimisticChange; error: any }>();

  constructor(private projectService: ProjectService) {
    this.initializeAutoSave();
    this.loadSessionState();
  }

  /**
   * Add an optimistic change to the queue
   */
  addChange(
    projectId: string,
    propertyName: string,
    newValue: unknown,
    previousValue: unknown
  ): OptimisticChange {
    const change: OptimisticChange = {
      id: crypto.randomUUID(),
      projectId,
      propertyName,
      newValue,
      previousValue,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    const currentChanges = this.changesSubject.value;
    let updatedChanges = [...currentChanges, change];

    // Keep only the most recent changes in memory
    if (updatedChanges.length > this.MAX_MEMORY_CHANGES) {
      // Archive older changes to server before removing from memory
      const toArchive = updatedChanges.slice(
        0,
        updatedChanges.length - this.MAX_MEMORY_CHANGES
      );
      this.archiveOldChanges(toArchive);
      updatedChanges = updatedChanges.slice(-this.MAX_MEMORY_CHANGES);
    }

    this.changesSubject.next(updatedChanges);
    this.hasUnsavedChangesSubject.next(true);
    this.saveSessionState();

    // Trigger auto-save
    this.saveTrigger.next();

    return change;
  }

  /**
   * Undo a change (revert to previous value)
   */
  undoChange(changeId: string): boolean {
    const changes = this.changesSubject.value;
    const changeIndex = changes.findIndex((c) => c.id === changeId);

    if (changeIndex === -1) return false;

    const change = changes[changeIndex];

    // Create a revert change
    const revertChange: OptimisticChange = {
      id: crypto.randomUUID(),
      projectId: change.projectId,
      propertyName: change.propertyName,
      newValue: change.previousValue,
      previousValue: change.newValue,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    // Remove the original change and add the revert
    const updatedChanges = changes.filter((c) => c.id !== changeId);
    updatedChanges.push(revertChange);

    this.changesSubject.next(updatedChanges);
    this.saveTrigger.next();

    return true;
  }

  /**
   * Redo a previously undone change
   */
  redoChange(changeId: string): boolean {
    // For simplicity, we'll implement redo by re-adding the change
    // In a full implementation, you'd maintain an undo stack
    return false; // Not implemented yet
  }

  /**
   * Get pending changes for a project
   */
  getPendingChanges(projectId: string): OptimisticChange[] {
    return this.changesSubject.value.filter(
      (change) =>
        change.projectId === projectId &&
        (change.status === 'pending' || change.status === 'saving')
    );
  }

  /**
   * Force immediate save of all pending changes
   */
  async saveNow(): Promise<void> {
    await this.performSave();
  }

  /**
   * Clear all changes for a project (after successful save)
   */
  clearChanges(projectId: string): void {
    const changes = this.changesSubject.value;
    const filteredChanges = changes.filter((c) => c.projectId !== projectId);
    this.changesSubject.next(filteredChanges);
    this.hasUnsavedChangesSubject.next(filteredChanges.length > 0);
    this.saveSessionState();
  }

  /**
   * Initialize auto-save with debouncing
   */
  private initializeAutoSave(): void {
    this.saveTrigger.pipe(debounceTime(this.SAVE_DEBOUNCE_MS)).subscribe(() => {
      this.performSave();
    });
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(): Promise<void> {
    const pendingChanges = this.changesSubject.value.filter(
      (c) => c.status === 'pending'
    );

    if (pendingChanges.length === 0) return;

    this.savingSubject.next(true);

    // Group changes by project
    const changesByProject = pendingChanges.reduce((acc, change) => {
      if (!acc[change.projectId]) {
        acc[change.projectId] = [];
      }
      acc[change.projectId].push(change);
      return acc;
    }, {} as Record<string, OptimisticChange[]>);

    // Save changes for each project
    const savePromises = Object.entries(changesByProject).map(
      async ([projectId, changes]) => {
        try {
          // Mark changes as saving
          this.updateChangesStatus(
            changes.map((c) => c.id),
            'saving'
          );

          // Batch save modifications
          const modifications = changes.map((change) => ({
            type: ModificationType.PROPERTY_CHANGE,
            propertyName: change.propertyName,
            previousValue: change.previousValue,
            newValue: change.newValue,
            commandId: change.id,
          }));

          await this.projectService
            .batchUpdateProjectProperties(projectId, modifications)
            .toPromise();

          // Mark as saved
          this.updateChangesStatus(
            changes.map((c) => c.id),
            'saved'
          );

          // Clear saved changes after a delay
          setTimeout(() => {
            this.clearChanges(projectId);
          }, 1000);
        } catch (error: any) {
          console.error(
            'Failed to save changes for project:',
            projectId,
            error
          );

          // If project not found (404), clear those changes - project was likely deleted
          if (error?.status === 404) {
            console.warn(
              `Project ${projectId} not found (404). Clearing stale changes.`
            );
            this.clearChanges(projectId);
            return;
          }

          // Handle retry logic
          const failedChanges = changes.map((change) => ({
            ...change,
            retryCount: change.retryCount + 1,
            status: (change.retryCount >= this.MAX_RETRY_ATTEMPTS
              ? 'error'
              : 'pending') as OptimisticChange['status'],
          }));

          this.updateChanges(failedChanges);
          this.changeError.next({ change: changes[0], error });
        }
      }
    );

    try {
      await Promise.all(savePromises);
    } finally {
      this.savingSubject.next(false);
    }
  }

  /**
   * Update status of multiple changes
   */
  private updateChangesStatus(
    changeIds: string[],
    status: OptimisticChange['status']
  ): void {
    const changes = this.changesSubject.value;
    const updatedChanges = changes.map((change) =>
      changeIds.includes(change.id) ? { ...change, status } : change
    );
    this.changesSubject.next(updatedChanges);
  }

  /**
   * Update multiple changes
   */
  private updateChanges(updatedChanges: OptimisticChange[]): void {
    const changes = this.changesSubject.value;
    const changeMap = new Map(changes.map((c) => [c.id, c]));

    updatedChanges.forEach((update) => {
      changeMap.set(update.id, update);
    });

    this.changesSubject.next(Array.from(changeMap.values()));
  }

  /**
   * Save session state to localStorage
   */
  private saveSessionState(): void {
    try {
      const sessionState: SessionState = {
        projectId: '', // We'll set this when we know the current project
        changes: this.changesSubject.value.filter((c) => c.status !== 'saved'),
        lastSaved: new Date(),
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionState));
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  }

  /**
   * Load session state from localStorage
   */
  private loadSessionState(): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const sessionState: SessionState = JSON.parse(stored);

        // Only restore recent changes (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentChanges = sessionState.changes.filter(
          (c) => new Date(c.timestamp) > oneHourAgo
        );

        if (recentChanges.length > 0) {
          this.changesSubject.next(recentChanges);
          this.hasUnsavedChangesSubject.next(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load session state:', error);
    }
  }

  /**
   * Clear session state
   */
  clearSessionState(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Archive old changes to server for unlimited history
   */
  private archiveOldChanges(changes: OptimisticChange[]): void {
    if (changes.length === 0) return;

    // Group by project
    const changesByProject = changes.reduce((acc, change) => {
      if (!acc[change.projectId]) {
        acc[change.projectId] = [];
      }
      acc[change.projectId].push(change);
      return acc;
    }, {} as Record<string, OptimisticChange[]>);

    // Archive to server (don't wait for response)
    Object.entries(changesByProject).forEach(([projectId, projectChanges]) => {
      const modifications = projectChanges.map((change) => ({
        type: ModificationType.PROPERTY_CHANGE,
        propertyName: change.propertyName,
        previousValue: change.previousValue,
        newValue: change.newValue,
        commandId: change.id,
      }));

      this.projectService
        .batchUpdateProjectProperties(projectId, modifications)
        .subscribe({
          next: () => {
            // Changes archived successfully
          },
          error: (err) => console.warn('Failed to archive changes:', err),
        });
    });
  }

  /**
   * Get full history for a project (from memory + server)
   */
  async getFullHistory(projectId: string): Promise<OptimisticChange[]> {
    // Get from memory
    const memoryChanges = this.changesSubject.value.filter(
      (c) => c.projectId === projectId
    );

    // Get from server
    try {
      const serverModifications = await this.projectService
        .getProjectModifications(projectId)
        .toPromise();

      // Convert server modifications to OptimisticChange format
      const serverChanges: OptimisticChange[] = (serverModifications || []).map(
        (mod) => ({
          id: mod.commandId,
          projectId: mod.projectId,
          propertyName: mod.propertyName,
          newValue: mod.newValue,
          previousValue: mod.previousValue,
          timestamp: new Date(mod.timestamp),
          status: 'saved' as const,
          retryCount: 0,
        })
      );

      // Combine and deduplicate
      const allChanges = [...serverChanges, ...memoryChanges];
      const uniqueChanges = Array.from(
        new Map(allChanges.map((c) => [c.id, c])).values()
      );

      // Sort by timestamp
      return uniqueChanges.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.warn('Failed to fetch server history:', error);
      return memoryChanges;
    }
  }

  /**
   * Get history count for a project
   */
  getHistoryCount(projectId: string): number {
    return this.changesSubject.value.filter((c) => c.projectId === projectId)
      .length;
  }

  /**
   * Get observables for external subscription
   */
  get changeSaved$() {
    return this.changeSaved.asObservable();
  }

  get changeError$() {
    return this.changeError.asObservable();
  }
}
