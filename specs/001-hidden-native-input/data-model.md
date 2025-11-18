# Data Model: Hidden Native Input for ColorSetterComponent

## Entities

### ColorSetterComponent

- colorValue: string (hex, e.g., "#RRGGBB")
- isDisabled: boolean
- validationState: valid | invalid
- customUI: object (visual elements, event handlers)
- hiddenInputRef: reference to <input type="color">

### Hidden Native Input

- value: string (hex)
- disabled: boolean
- required: boolean
- validationState: valid | invalid

### Form Model

- value: string (hex)
- validationState: valid | invalid

## Relationships

- ColorSetterComponent synchronizes colorValue with Hidden Native Input and Form Model
- Hidden Native Input is bound to Form Model via ngModel or formControlName
- Custom UI updates colorValue, which updates Hidden Native Input and Form Model

## Validation Rules

- colorValue must be a valid hex string (e.g., "#RRGGBB"); if invalid, reset to default (#FFFFFF) and notify user
- required: if true, colorValue must not be empty
- disabled: if true, all UI and input interactions are blocked
