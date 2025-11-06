import { Injectable, signal } from '@angular/core';
import { Command } from '../models/command.interface';
import { ProjectModification } from '../models/project-modification.interface';

interface SubscriptionInfo {
  type: string;
  maxProjects: number;
  maxUndoRedo: number;
}

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  // Observable state using signals (per-project)
  private canUndoSignals = new Map<
    string,
    ReturnType<typeof signal<boolean>>
  >();
  private canRedoSignals = new Map<
    string,
    ReturnType<typeof signal<boolean>>
  >();
  private historyCountSignals = new Map<
    string,
    ReturnType<typeof signal<number>>
  >();

  readonly maxOperations$ = signal<number>(1000); // Match unlimited history feature

  // Internal state
  private history: Map<string, ProjectModification[]> = new Map();
  private currentIndex: Map<string, number> = new Map();
  private commands: Map<string, Command[]> = new Map(); // Store command objects for undo/redo

  constructor() {
    // Initialize with default limits (increased to support unlimited history)
    this.maxOperations$.set(1000);
  }

  // Get or create signals for a project
  private getOrCreateCanUndoSignal(projectId: string) {
    if (!this.canUndoSignals.has(projectId)) {
      this.canUndoSignals.set(projectId, signal(false));
    }
    return this.canUndoSignals.get(projectId)!;
  }

  private getOrCreateCanRedoSignal(projectId: string) {
    if (!this.canRedoSignals.has(projectId)) {
      this.canRedoSignals.set(projectId, signal(false));
    }
    return this.canRedoSignals.get(projectId)!;
  }

  private getOrCreateHistoryCountSignal(projectId: string) {
    if (!this.historyCountSignals.has(projectId)) {
      this.historyCountSignals.set(projectId, signal(0));
    }
    return this.historyCountSignals.get(projectId)!;
  }

  // Command operations
  executeCommand(command: Command): void {
    if (this.isLimitReached(command.projectId)) {
      console.error('Undo/redo limit reached!');
      throw new Error('Undo/redo limit reached for this project');
    }

    // Execute the command
    command.execute();

    // Add modification to history
    this.addToHistory(command.projectId, command.getModification());

    // Store command for undo/redo
    this.addCommandToHistory(command.projectId, command);

    // Update state
    this.updateState(command.projectId);
  }

  undo(projectId: string): boolean {
    const projectCommands = this.commands.get(projectId) || [];
    const currentIdx = this.currentIndex.get(projectId) || 0;

    if (currentIdx <= 0) {
      return false; // Nothing to undo
    }

    // Find the last executed command and undo it
    const command = projectCommands[currentIdx - 1];
    if (!command) {
      return false;
    }

    // Execute the undo
    command.undo();

    // Update index
    this.currentIndex.set(projectId, currentIdx - 1);
    this.updateState(projectId);

    return true;
  }

  redo(projectId: string): boolean {
    const projectCommands = this.commands.get(projectId) || [];
    const currentIdx = this.currentIndex.get(projectId) || 0;

    if (currentIdx >= projectCommands.length) {
      return false; // Nothing to redo
    }

    // Find the next command to redo
    const command = projectCommands[currentIdx];
    if (!command) {
      return false;
    }

    // Re-execute the command
    command.execute();

    // Update index
    this.currentIndex.set(projectId, currentIdx + 1);
    this.updateState(projectId);

    return true;
  }

  clearHistory(projectId?: string): void {
    if (projectId) {
      this.history.delete(projectId);
      this.commands.delete(projectId);
      this.currentIndex.delete(projectId);
      this.canUndoSignals.delete(projectId);
      this.canRedoSignals.delete(projectId);
      this.historyCountSignals.delete(projectId);
    } else {
      this.history.clear();
      this.commands.clear();
      this.currentIndex.clear();
      this.canUndoSignals.clear();
      this.canRedoSignals.clear();
      this.historyCountSignals.clear();
    }
  }

  // History management
  getHistoryForProject(projectId: string): ProjectModification[] {
    return this.history.get(projectId) || [];
  }

  isLimitReached(projectId: string): boolean {
    const projectHistory = this.history.get(projectId) || [];
    const maxOps = this.maxOperations$();
    return projectHistory.length >= maxOps;
  }

  getRemainingOperations(projectId: string): number {
    const projectHistory = this.history.get(projectId) || [];
    const maxOps = this.maxOperations$();
    return Math.max(0, maxOps - projectHistory.length);
  }

  // Public methods to check state for specific projects - return signals for reactivity
  canUndoForProject(projectId: string) {
    return this.getOrCreateCanUndoSignal(projectId);
  }

  canRedoForProject(projectId: string) {
    return this.getOrCreateCanRedoSignal(projectId);
  }

  getUndoCountForProject(projectId: string) {
    const currentIdx = this.currentIndex.get(projectId) || 0;
    return signal(currentIdx);
  }

  getRedoCountForProject(projectId: string) {
    const projectCommands = this.commands.get(projectId) || [];
    const currentIdx = this.currentIndex.get(projectId) || 0;
    return signal(projectCommands.length - currentIdx);
  }

  // Subscription integration
  updateLimitsFromSubscription(subscription: {
    type: string;
    maxProjects: number;
    maxUndoRedo: number;
  }): void {
    this.maxOperations$.set(subscription.maxUndoRedo);

    // Update all project states
    for (const projectId of this.history.keys()) {
      this.updateState(projectId);
    }
  }

  // Private methods
  private addToHistory(
    projectId: string,
    modification: ProjectModification
  ): void {
    if (!this.history.has(projectId)) {
      this.history.set(projectId, []);
      this.currentIndex.set(projectId, 0);
    }

    const projectHistory = this.history.get(projectId)!;
    const currentIdx = this.currentIndex.get(projectId)!;

    // Remove any history after current index (for when user makes new changes after undo)
    projectHistory.splice(currentIdx);

    // Add new modification
    projectHistory.push(modification);

    // Update current index to point to the new modification
    this.currentIndex.set(projectId, projectHistory.length);
  }

  private addCommandToHistory(projectId: string, command: Command): void {
    if (!this.commands.has(projectId)) {
      this.commands.set(projectId, []);
    }

    const projectCommands = this.commands.get(projectId)!;
    const currentIdx = this.currentIndex.get(projectId) || 0;

    // Remove any commands after current index (when user makes new changes after undo)
    projectCommands.splice(currentIdx);

    // Add new command
    projectCommands.push(command);

    // Update current index to point after the new command
    this.currentIndex.set(projectId, projectCommands.length);
  }

  private updateState(projectId: string): void {
    const projectCommands = this.commands.get(projectId) || [];
    const currentIdx = this.currentIndex.get(projectId) || 0;

    const canUndo = currentIdx > 0;
    const canRedo = currentIdx < projectCommands.length;

    // Update signals for this project
    this.getOrCreateCanUndoSignal(projectId).set(canUndo);
    this.getOrCreateCanRedoSignal(projectId).set(canRedo);
    this.getOrCreateHistoryCountSignal(projectId).set(projectCommands.length);
  }
}
