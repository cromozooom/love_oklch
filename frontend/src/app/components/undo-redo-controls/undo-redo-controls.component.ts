import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UndoRedoService } from '../../services/undo-redo.service';

@Component({
  selector: 'app-undo-redo-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './undo-redo-controls.component.html',
  styleUrl: './undo-redo-controls.component.scss',
})
export class UndoRedoControlsComponent {
  private undoRedoService = inject(UndoRedoService);

  // Input signals
  projectId = input.required<string>();

  // Output events
  undoExecuted = output<void>();
  redoExecuted = output<void>();

  // Computed signals based on project
  canUndo = computed(() =>
    this.undoRedoService.canUndoForProject(this.projectId())()
  );
  canRedo = computed(() =>
    this.undoRedoService.canRedoForProject(this.projectId())()
  );
  undoCount = computed(() =>
    this.undoRedoService.getUndoCountForProject(this.projectId())()
  );
  redoCount = computed(() =>
    this.undoRedoService.getRedoCountForProject(this.projectId())()
  );

  async onUndo(): Promise<void> {
    if (this.canUndo()) {
      await this.undoRedoService.undo(this.projectId());
      this.undoExecuted.emit();
    } else {
      console.warn('❌ Undo not available');
    }
  }

  async onRedo(): Promise<void> {
    if (this.canRedo()) {
      await this.undoRedoService.redo(this.projectId());
      this.redoExecuted.emit();
    } else {
      console.warn('❌ Redo not available');
    }
  }
}
