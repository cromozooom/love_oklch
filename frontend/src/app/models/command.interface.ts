import { ProjectModification } from './project-modification.interface';

export interface Command {
  id: string;
  projectId: string;
  execute(): void;
  undo(): void;
  getModification(): ProjectModification;
}
