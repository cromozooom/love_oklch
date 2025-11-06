# Frontend Contracts: Project Management

**Date**: October 25, 2025
**Feature**: Project Management with Undo/Redo Functionality

## Angular Services

### ProjectService

Core service for project management operations.

```typescript
@Injectable({
  providedIn: "root",
})
export class ProjectService {
  // Observable state
  readonly projects$ = signal<Project[]>([]);
  readonly currentProject$ = signal<Project | null>(null);
  readonly loading$ = signal<boolean>(false);
  readonly error$ = signal<string | null>(null);

  // Project CRUD operations
  loadProjects(): Observable<Project[]>;
  createProject(data: CreateProjectRequest): Observable<Project>;
  updateProject(id: string, data: UpdateProjectRequest): Observable<Project>;
  deleteProject(id: string): Observable<void>;
  getProject(id: string): Observable<Project>;
  setCurrentProject(project: Project | null): void;

  // Validation
  validateProjectName(name: string): Observable<ValidationResult>;
  validateColorCombination(gamut: ColorGamut, space: ColorSpace): boolean;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
  colorMode: ColorMode;
  colorGamut: ColorGamut;
  colorSpace: ColorSpace;
}

interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### UndoRedoService

Service for managing undo/redo operations with subscription limits.

```typescript
@Injectable({
  providedIn: "root",
})
export class UndoRedoService {
  // Observable state
  readonly canUndo$ = signal<boolean>(false);
  readonly canRedo$ = signal<boolean>(false);
  readonly historyCount$ = signal<number>(0);
  readonly maxOperations$ = signal<number>(5);

  // Command operations
  executeCommand(command: Command): void;
  undo(): boolean;
  redo(): boolean;
  clearHistory(projectId?: string): void;

  // History management
  getHistoryForProject(projectId: string): ProjectModification[];
  isLimitReached(): boolean;
  getRemainingOperations(): number;

  // Subscription integration
  updateLimitsFromSubscription(subscription: SubscriptionInfo): void;
}

interface Command {
  id: string;
  projectId: string;
  execute(): void;
  undo(): void;
  getModification(): ProjectModification;
}
```

### SubscriptionService

Service for subscription-based limit enforcement.

```typescript
@Injectable({
  providedIn: "root",
})
export class SubscriptionService {
  // Observable state
  readonly subscription$ = signal<SubscriptionInfo | null>(null);
  readonly limits$ = computed(() => this.subscription$()?.limits || DEFAULT_LIMITS);
  readonly usage$ = signal<SubscriptionUsage | null>(null);

  // Subscription operations
  loadSubscription(): Observable<SubscriptionInfo>;
  checkProjectLimit(): boolean;
  checkUndoRedoLimit(currentCount: number): boolean;
  getUpgradeUrl(): string;

  // Limit enforcement
  canCreateProject(): boolean;
  canPerformUndoRedo(): boolean;
  getRemainingProjects(): number | null;
  getRemainingUndoRedo(): number;
}

interface SubscriptionInfo {
  type: SubscriptionType;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
}

interface SubscriptionLimits {
  maxActiveProjects: number | null; // null = unlimited
  maxUndoRedoOperations: number;
}

interface SubscriptionUsage {
  activeProjects: number;
  availableProjects: number | null; // null = unlimited
}

const DEFAULT_LIMITS: SubscriptionLimits = {
  maxActiveProjects: 1,
  maxUndoRedoOperations: 5,
};
```

## Angular Components

### ProjectListComponent

Component for displaying and managing the list of projects.

```typescript
@Component({
  selector: "app-project-list",
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule],
  template: `...`,
})
export class ProjectListComponent {
  // Input properties
  projects = input.required<Project[]>();
  canCreateNew = input<boolean>(true);
  loading = input<boolean>(false);

  // Output events
  projectSelected = output<Project>();
  projectDeleted = output<string>();
  createProject = output<void>();

  // Component state
  selectedProjectId = signal<string | null>(null);

  // Event handlers
  onProjectClick(project: Project): void;
  onDeleteProject(projectId: string, event: Event): void;
  onCreateNew(): void;

  // Helper methods
  formatDate(date: Date): string;
  getProjectSummary(project: Project): string;
}
```

### ProjectFormComponent

Component for creating and editing projects.

```typescript
@Component({
  selector: "app-project-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `...`,
})
export class ProjectFormComponent implements OnInit {
  // Input properties
  project = input<Project | null>(null);
  mode = input<"create" | "edit">("create");

  // Output events
  formSubmit = output<CreateProjectRequest | UpdateProjectRequest>();
  formCancel = output<void>();

  // Form state
  projectForm!: FormGroup;
  colorModes = COLOR_MODES;
  colorGamuts = COLOR_GAMUTS;
  colorSpaces = COLOR_SPACES;

  // Validation
  nameValidationErrors = signal<string[]>([]);
  colorCombinationValid = signal<boolean>(true);

  // Form methods
  ngOnInit(): void;
  onSubmit(): void;
  onCancel(): void;

  // Validation methods
  validateColorCombination(): void;
  validateProjectName(): void;

  // Helper methods
  getCompatibleColorSpaces(gamut: ColorGamut): ColorSpace[];
  resetForm(): void;
}

const COLOR_MODES: ColorMode[] = ["oklch", "hsla", "rgba"];
const COLOR_GAMUTS: ColorGamut[] = ["srgb", "p3", "rec2020"];
const COLOR_SPACES: ColorSpace[] = ["srgb", "display-p3", "rec2020"];
```

### UndoRedoControlsComponent

Component for undo/redo buttons with subscription limit indicators.

```typescript
@Component({
  selector: "app-undo-redo-controls",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule],
  template: `...`,
})
export class UndoRedoControlsComponent {
  // Input properties
  canUndo = input<boolean>(false);
  canRedo = input<boolean>(false);
  historyCount = input<number>(0);
  maxOperations = input<number>(5);
  subscriptionType = input<SubscriptionType>("default");

  // Output events
  undoRequested = output<void>();
  redoRequested = output<void>();
  upgradeRequested = output<void>();

  // Computed properties
  remainingOperations = computed(() => this.maxOperations() - this.historyCount());
  showUpgradePrompt = computed(() => this.subscriptionType() === "default" && this.remainingOperations() <= 1);

  // Event handlers
  onUndo(): void;
  onRedo(): void;
  onUpgrade(): void;

  // Helper methods
  getUndoTooltip(): string;
  getRedoTooltip(): string;
  getUpgradeMessage(): string;
}
```

### DashboardComponent

Main dashboard component that orchestrates project management.

```typescript
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectListComponent, ProjectFormComponent, UndoRedoControlsComponent],
  template: `...`,
})
export class DashboardComponent implements OnInit {
  // Injected services
  private projectService = inject(ProjectService);
  private undoRedoService = inject(UndoRedoService);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  // Component state
  projects = this.projectService.projects$;
  currentProject = this.projectService.currentProject$;
  subscription = this.subscriptionService.subscription$;
  loading = this.projectService.loading$;

  showCreateForm = signal<boolean>(false);
  editingProject = signal<Project | null>(null);

  // Undo/redo state
  canUndo = this.undoRedoService.canUndo$;
  canRedo = this.undoRedoService.canRedo$;
  historyCount = this.undoRedoService.historyCount$;
  maxOperations = this.undoRedoService.maxOperations$;

  // Lifecycle
  ngOnInit(): void;

  // Project management
  onProjectSelected(project: Project): void;
  onProjectCreated(data: CreateProjectRequest): void;
  onProjectUpdated(data: UpdateProjectRequest): void;
  onProjectDeleted(projectId: string): void;

  // Form management
  showCreateProjectForm(): void;
  showEditProjectForm(project: Project): void;
  hideProjectForm(): void;

  // Undo/redo operations
  onUndo(): void;
  onRedo(): void;
  onUpgradeSubscription(): void;

  // Navigation
  navigateToProject(projectId: string): void;
  canCreateNewProject(): boolean;
}
```

## Route Guards

### ProjectLimitGuard

Guard to enforce subscription-based project creation limits.

```typescript
@Injectable({
  providedIn: "root",
})
export class ProjectLimitGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.subscriptionService.canCreateProject()) {
      return true;
    }

    // Redirect to upgrade page or show modal
    this.router.navigate(["/upgrade"]);
    return false;
  }
}
```

### ProjectExistsGuard

Guard to validate project exists and user has access.

```typescript
@Injectable({
  providedIn: "root",
})
export class ProjectExistsGuard implements CanActivate {
  constructor(private projectService: ProjectService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const projectId = route.params["id"];

    return this.projectService.getProject(projectId).pipe(
      map(() => true),
      catchError(() => {
        this.router.navigate(["/dashboard"]);
        return of(false);
      })
    );
  }
}
```

## Command Implementations

### UpdateProjectPropertyCommand

Command for updating project properties with undo support.

```typescript
export class UpdateProjectPropertyCommand implements Command {
  readonly id = crypto.randomUUID();

  constructor(private projectService: ProjectService, public readonly projectId: string, private propertyName: keyof Project, private newValue: unknown, private previousValue: unknown) {}

  execute(): void {
    const project = this.projectService.currentProject$();
    if (project && project.id === this.projectId) {
      const updated = { ...project, [this.propertyName]: this.newValue };
      this.projectService.setCurrentProject(updated);
    }
  }

  undo(): void {
    const project = this.projectService.currentProject$();
    if (project && project.id === this.projectId) {
      const reverted = { ...project, [this.propertyName]: this.previousValue };
      this.projectService.setCurrentProject(reverted);
    }
  }

  getModification(): ProjectModification {
    return {
      id: crypto.randomUUID(),
      projectId: this.projectId,
      type: "property_change",
      propertyName: this.propertyName as string,
      previousValue: this.previousValue,
      newValue: this.newValue,
      timestamp: new Date(),
      commandId: this.id,
    };
  }
}
```

This frontend contract provides a complete interface specification for implementing the project management feature with undo/redo functionality and subscription-based limits.
