import { ModificationType } from './modification-type.enum';

export interface ProjectModification {
  id: string; // UUID v4
  projectId: string; // Reference to project
  type: ModificationType; // Type of modification
  propertyName: string; // Name of modified property
  previousValue: unknown; // Previous property value
  newValue: unknown; // New property value
  timestamp: Date; // When modification occurred
  commandId: string; // Unique identifier for command
}
