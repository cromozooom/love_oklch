# Quickstart: Hidden Native Input for ColorSetterComponent

## Prerequisites

- Angular 18.x project
- TypeScript 5.x
- Angular CDK, RxJS installed

## Steps

1. Add ColorSetterComponent to your Angular module.
2. In your form template, use:
   ```html
   <app-color-setter [(ngModel)]="colorValue" required></app-color-setter>
   <!-- or -->
   <app-color-setter formControlName="colorValue" required></app-color-setter>
   ```
3. The component will internally manage a hidden `<input type="color">` bound to the form model.
4. Interact with the custom UI to select colors; changes propagate to the form model and hidden input.
5. Validation and disabled state are handled automatically via Angular forms.

## Testing

- Use Playwright for E2E tests covering value propagation, validation, disabled state, and edge cases.
