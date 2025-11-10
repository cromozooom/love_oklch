# Quickstart Guide: Color Setter Component

**Feature**: 005-color-setter-component  
**Target Audience**: Developers implementing the Color Setter Component  
**Estimated Setup Time**: 30 minutes

---

## 📋 Prerequisites

Before starting development, ensure you have:

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Angular CLI**: v18.x (`npm install -g @angular/cli@18`)
- **Git**: Latest version
- **IDE**: VS Code recommended with Angular Language Service extension

**Required Knowledge**:

- TypeScript 5.x
- Angular 18.x (Signals, Standalone Components)
- RxJS basics
- CSS/Tailwind CSS

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Setup

```powershell
# Clone repository
git clone <repository-url>
cd love_oklch

# Checkout feature branch
git checkout 005-color-setter-component

# Install dependencies
npm install

# Verify setup
ng version
```

### 2. Run Development Server

```powershell
# Start dev server with hot reload
ng serve

# Server runs on http://localhost:4200
# Navigate to the Color Setter demo page
```

### 3. Run Tests

```powershell
# Unit tests (Jasmine/Karma)
ng test

# E2E tests (Playwright)
npx playwright test

# Watch mode for TDD
ng test --watch
```

---

## 📂 Project Structure

```
love_oklch/
├── frontend/src/app/
│   └── components/
│       └── color-setter/
│           ├── color-setter.component.ts       # Main component
│           ├── color-setter.component.html     # Template
│           ├── color-setter.component.css      # Styles (Tailwind)
│           ├── color-setter.component.spec.ts  # Unit tests
│           │
│           ├── models/                         # Data models
│           │   ├── color-state.model.ts
│           │   ├── format-config.model.ts
│           │   ├── gamut-profile.model.ts
│           │   ├── wcag-contrast.model.ts
│           │   ├── color-name.model.ts
│           │   └── slider-gradient.model.ts
│           │
│           ├── services/                       # Business logic
│           │   ├── color.service.ts
│           │   ├── gamut.service.ts
│           │   ├── naming.service.ts
│           │   └── wcag.service.ts
│           │
│           └── subcomponents/                  # Child components
│               ├── format-selector/
│               ├── color-sliders/
│               ├── gamut-selector/
│               ├── color-preview/
│               └── wcag-panel/
│
├── e2e/
│   └── specs/
│       └── color-setter/
│           ├── basic-interaction.spec.ts
│           ├── format-conversion.spec.ts
│           ├── gamut-visualization.spec.ts
│           └── accessibility.spec.ts
│
└── specs/
    └── 005-color-setter-component/
        ├── spec.md                             # Feature specification
        ├── plan.md                             # Implementation plan
        ├── research.md                         # Technical research
        ├── data-model.md                       # Data structures
        ├── contracts/                          # API contracts
        └── checklists/                         # Quality checklists
```

---

## 🔧 Development Workflow

### Step 1: Understand the Specification

```powershell
# Read the feature specification
code specs/005-color-setter-component/spec.md

# Review technical research
code specs/005-color-setter-component/research.md

# Study data model
code specs/005-color-setter-component/data-model.md
```

### Step 2: Create Component Skeleton

```powershell
# Generate component (if not exists)
ng generate component components/color-setter --standalone

# Generate services
ng generate service components/color-setter/services/color
ng generate service components/color-setter/services/gamut
ng generate service components/color-setter/services/naming
ng generate service components/color-setter/services/wcag
```

### Step 3: Install Dependencies

```powershell
# Install colorjs.io
npm install colorjs.io

# Install Angular CDK for slider
npm install @angular/cdk

# Install type definitions
npm install --save-dev @types/node
```

### Step 4: Implement Data Models

Create TypeScript interfaces based on `data-model.md`:

```typescript
// models/color-state.model.ts
import Color from "colorjs.io";

export interface ColorState {
  internalValue: Color;
  format: ColorFormat;
  gamut: GamutProfile;
  lastUpdated: number;
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "lch" | "oklch" | "lab";
export type GamutProfile = "srgb" | "display-p3" | "unlimited";
```

### Step 5: Implement Services (TDD Approach)

```typescript
// services/color.service.spec.ts
describe("ColorService", () => {
  it("should parse HEX color", () => {
    const color = service.parse("#FF0000");
    expect(color).toBeDefined();
  });

  it("should convert RGB to OKLCH", () => {
    const oklch = service.convert("rgb(255, 0, 0)", "oklch");
    expect(oklch).toContain("oklch");
  });
});

// services/color.service.ts
@Injectable({ providedIn: "root" })
export class ColorService implements IColorService {
  parse(input: string): IColor {
    return new Color(input);
  }

  convert(input: string, targetFormat: ColorFormat): string {
    const color = this.parse(input);
    return color.to(targetFormat).toString();
  }
}
```

### Step 6: Build Component

```typescript
// color-setter.component.ts
@Component({
  selector: "app-color-setter",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./color-setter.component.html",
  styleUrls: ["./color-setter.component.css"],
})
export class ColorSetterComponent implements OnInit {
  // Inputs
  @Input() initialColor: string = "#FF0000";
  @Input() initialFormat: ColorFormat = "hex";

  // Outputs
  @Output() colorChange = new EventEmitter<IColorChangeEvent>();

  // State (Angular Signals)
  colorState = signal<ColorState>({
    internalValue: new Color("#FF0000"),
    format: "hex",
    gamut: "srgb",
    lastUpdated: Date.now(),
  });

  // Computed values
  displayValue = computed(() => {
    const state = this.colorState();
    return this.colorService.convert(state.internalValue.toString(), state.format);
  });

  constructor(private colorService: ColorService, private gamutService: GamutService, private namingService: NamingService, private wcagService: WCAGService) {}

  ngOnInit() {
    this.setColor(this.initialColor);
  }

  setColor(color: string): void {
    const parsed = this.colorService.parse(color);
    this.colorState.update((state) => ({
      ...state,
      internalValue: parsed,
      lastUpdated: Date.now(),
    }));
    this.emitColorChange();
  }

  private emitColorChange(): void {
    const state = this.colorState();
    const event: IColorChangeEvent = {
      value: this.displayValue(),
      oklch: state.internalValue.toString({ format: "oklch" }),
      formats: this.colorService.toAllFormats(state.internalValue),
      name: this.namingService.getName(state.internalValue),
      wcag: {
        onWhite: this.wcagService.analyze(state.internalValue, "#FFFFFF"),
        onBlack: this.wcagService.analyze(state.internalValue, "#000000"),
      },
      gamutStatus: this.gamutService.check(state.internalValue, state.gamut),
      timestamp: state.lastUpdated,
    };
    this.colorChange.emit(event);
  }
}
```

### Step 7: Write Tests

```typescript
// color-setter.component.spec.ts
describe("ColorSetterComponent", () => {
  let component: ColorSetterComponent;
  let fixture: ComponentFixture<ColorSetterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ColorSetterComponent],
    });
    fixture = TestBed.createComponent(ColorSetterComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with default red color", () => {
    component.ngOnInit();
    expect(component.currentColor).toBe("#FF0000");
  });

  it("should emit colorChange event on color update", (done) => {
    component.colorChange.subscribe((event) => {
      expect(event.value).toBe("#00FF00");
      done();
    });
    component.setColor("#00FF00");
  });
});
```

---

## 🎨 Usage Examples

### Basic Usage

```typescript
// In parent component template
<app-color-setter
  [initialColor]="'#FF0000'"
  [initialFormat]="'hex'"
  [showColorName]="true"
  [showWCAG]="true"
  (colorChange)="onColorChange($event)"
/>

// In parent component class
onColorChange(event: IColorChangeEvent) {
  console.log('New color:', event.value);
  console.log('OKLCH:', event.oklch);
  console.log('Color name:', event.name.name);
  console.log('WCAG on white:', event.wcag.onWhite.ratio);
}
```

### Advanced Usage with Reactive Forms

```typescript
export class MyFormComponent {
  colorForm = new FormGroup({
    primaryColor: new FormControl("#FF0000"),
    gamut: new FormControl<GamutProfile>("srgb"),
  });

  @ViewChild(ColorSetterComponent) colorSetter!: ColorSetterComponent;

  onColorChange(event: IColorChangeEvent) {
    this.colorForm.patchValue({
      primaryColor: event.value,
    });
  }

  resetColor() {
    this.colorSetter.reset();
  }
}
```

### Programmatic Control

```typescript
export class ColorEditorComponent {
  @ViewChild(ColorSetterComponent) colorSetter!: ColorSetterComponent;

  async applyPreset(presetColor: string) {
    await this.colorSetter.setColor(presetColor);
    const oklch = this.colorSetter.getColor("oklch");
    console.log("Applied preset:", oklch);
  }

  checkAccessibility() {
    const wcag = this.colorSetter.getWCAGAnalysis();
    if (!wcag.onWhite.aaSmall) {
      alert("Color does not meet WCAG AA for small text on white");
    }
  }
}
```

---

## 🧪 Testing Guide

### Unit Tests (Jasmine/Karma)

```powershell
# Run all unit tests
ng test

# Run with coverage
ng test --code-coverage

# Watch mode for TDD
ng test --watch

# Run specific test file
ng test --include='**/*color.service.spec.ts'
```

**Coverage Requirements**:

- Services: ≥90%
- Components: ≥80%
- Models: ≥70%

### E2E Tests (Playwright)

```powershell
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test suite
npx playwright test color-setter/basic-interaction

# Debug mode with UI
npx playwright test --debug

# Run in specific browser
npx playwright test --project=chromium
```

**E2E Test Example**:

```typescript
// e2e/specs/color-setter/basic-interaction.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Color Setter - Basic Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/color-setter-demo");
  });

  test("should initialize with red color", async ({ page }) => {
    const preview = page.locator('[data-testid="color-preview"]');
    await expect(preview).toHaveCSS("background-color", "rgb(255, 0, 0)");
  });

  test("should update color via slider", async ({ page }) => {
    const hueSlider = page.locator('[data-testid="hue-slider"]');
    await hueSlider.fill("120"); // Green hue

    const colorValue = page.locator('[data-testid="color-value"]');
    await expect(colorValue).toContainText("oklch");
  });

  test("should convert between formats", async ({ page }) => {
    const formatSelect = page.locator('[data-testid="format-selector"]');
    await formatSelect.selectOption("rgb");

    const colorValue = page.locator('[data-testid="color-value"]');
    await expect(colorValue).toContainText("rgb(");
  });
});
```

### Accessibility Testing

```powershell
# Run axe accessibility tests
npx playwright test --grep="@a11y"

# Generate accessibility report
npx playwright test --reporter=html
```

---

## 🐛 Debugging Tips

### Common Issues

**Issue**: `Cannot find module 'colorjs.io'`

```powershell
# Solution: Install dependency
npm install colorjs.io
```

**Issue**: Slider gradient not rendering

```typescript
// Check gamut service gradient generation
const gradient = this.gamutService.generateSliderGradient({
  channel: "h",
  format: "oklch",
  fixedChannels: { l: 50, c: 0.15 },
  gamut: "srgb",
});
console.log("Generated gradient:", gradient);
```

**Issue**: WCAG calculation performance

```typescript
// Add debouncing to WCAG calculation
private wcagDebounce$ = new Subject<Color>();

constructor() {
  this.wcagDebounce$
    .pipe(debounceTime(100))
    .subscribe(color => this.calculateWCAG(color));
}
```

### Debug Mode

```typescript
// Enable debug logging
export class ColorSetterComponent {
  @Input() debug: boolean = false;

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[ColorSetter]", ...args);
    }
  }
}
```

---

## 📚 Additional Resources

### Documentation

- **Specification**: `specs/005-color-setter-component/spec.md`
- **API Contracts**: `specs/005-color-setter-component/contracts/`
- **Research**: `specs/005-color-setter-component/research.md`

### External Resources

- [colorjs.io Documentation](https://colorjs.io/)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [OKLCH Color Space](https://oklch.com/)

### Team Contacts

- **Tech Lead**: [Contact info]
- **Design**: [Contact info]
- **QA**: [Contact info]

---

## ✅ Checklist: Ready to Start?

- [ ] Prerequisites installed (Node.js, Angular CLI, Playwright)
- [ ] Repository cloned and dependencies installed
- [ ] Development server running successfully
- [ ] Tests passing (`ng test` and `npx playwright test`)
- [ ] Read specification (`spec.md`) and research (`research.md`)
- [ ] Reviewed data model (`data-model.md`) and contracts
- [ ] IDE configured with Angular Language Service
- [ ] Git branch `005-color-setter-component` checked out

**If all checked, you're ready to implement! 🎉**

---

## 🚀 Next Steps

1. **Implement Phase 1**: Create data models and service interfaces
2. **Implement Phase 2**: Build core color conversion service
3. **Implement Phase 3**: Build gamut and naming services
4. **Implement Phase 4**: Build component and UI
5. **Implement Phase 5**: Add WCAG panel and accessibility features
6. **Test & Refine**: Achieve ≥80% coverage and pass all E2E tests

Refer to `plan.md` for detailed implementation phases and tasks.

---

**Questions?** Check the specification documents or reach out to the team!
