import { Command } from '../models/command.interface';
import { ProjectModification } from '../models/project-modification.interface';
import { ModificationType } from '../models/modification-type.enum';
import { ProjectService } from '../services/project.service';
import { OptimisticUpdatesService } from '../services/optimistic-updates.service';

export class UpdateProjectPropertyCommand implements Command {
  readonly id: string;
  readonly projectId: string;
  private executed = false;

  constructor(
    private optimisticUpdatesService: OptimisticUpdatesService,
    projectId: string,
    private propertyName: string,
    private newValue: unknown,
    private previousValue: unknown,
    private onFormUpdate?: (property: string, value: unknown) => void
  ) {
    this.id = crypto.randomUUID();
    this.projectId = projectId;
  }

  execute(): void {
    if (this.executed) {
      return; // Already executed
    }

    // Update form if callback provided (for form-level undo/redo)
    if (this.onFormUpdate) {
      this.onFormUpdate(this.propertyName, this.newValue);
    }

    // Add optimistic change to the queue (will be saved in background)
    this.optimisticUpdatesService.addChange(
      this.projectId,
      this.propertyName,
      this.newValue,
      this.previousValue
    );

    this.executed = true;
  }

  undo(): void {
    if (!this.executed) {
      return; // Not executed yet
    }

    // Revert form value if callback provided
    if (this.onFormUpdate) {
      this.onFormUpdate(this.propertyName, this.previousValue);
    }

    // Undo the optimistic change
    this.optimisticUpdatesService.undoChange(this.id);

    this.executed = false;
  }

  getModification(): ProjectModification {
    return {
      id: crypto.randomUUID(),
      projectId: this.projectId,
      type: ModificationType.PROPERTY_CHANGE,
      propertyName: this.propertyName,
      previousValue: this.previousValue,
      newValue: this.newValue,
      timestamp: new Date(),
      commandId: this.id,
    };
  }
}
