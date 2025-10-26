import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  ColorGamut,
  ColorSpace,
  ColorEnumHelpers,
} from '../models/color-enums';

/**
 * Custom validators for project form fields
 * Provides validation for project name, color gamut, and color space
 */
export class ProjectValidators {
  /**
   * Validator for project name
   * Rules:
   * - Required (min 1 character)
   * - Maximum 100 characters
   * - No leading/trailing whitespace
   * - Must contain at least one non-whitespace character
   * - Cannot be only special characters
   */
  static projectName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Check if value exists
      if (!value) {
        return { required: { message: 'Project name is required' } };
      }

      // Convert to string and trim
      const name = String(value).trim();

      // Check minimum length
      if (name.length === 0) {
        return { required: { message: 'Project name is required' } };
      }

      // Check maximum length
      if (name.length > 100) {
        return {
          maxLength: {
            message: 'Project name cannot exceed 100 characters',
            actualLength: name.length,
            maxLength: 100,
          },
        };
      }

      // Check for meaningful content (not just special characters)
      const meaningfulContent = /[a-zA-Z0-9]/.test(name);
      if (!meaningfulContent) {
        return {
          pattern: {
            message: 'Project name must contain at least one letter or number',
          },
        };
      }

      // Check for leading/trailing whitespace in original value
      if (value !== name) {
        return {
          whitespace: {
            message: 'Project name cannot start or end with spaces',
          },
        };
      }

      return null;
    };
  }

  /**
   * Validator for color gamut selection
   * Ensures the selected value is a valid ColorGamut enum value
   */
  static colorGamut(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Check if value exists
      if (!value) {
        return { required: { message: 'Color gamut selection is required' } };
      }

      // Validate against enum values
      if (!ColorEnumHelpers.isValidColorGamut(value)) {
        return {
          invalidGamut: {
            message: 'Please select a valid color gamut',
            availableOptions: Object.values(ColorGamut),
          },
        };
      }

      return null;
    };
  }

  /**
   * Validator for color space selection
   * Ensures the selected value is a valid ColorSpace enum value
   */
  static colorSpace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Check if value exists
      if (!value) {
        return { required: { message: 'Color space selection is required' } };
      }

      // Validate against enum values
      if (!ColorEnumHelpers.isValidColorSpace(value)) {
        return {
          invalidColorSpace: {
            message: 'Please select a valid color space',
            availableOptions: Object.values(ColorSpace),
          },
        };
      }

      return null;
    };
  }

  /**
   * Cross-field validator for color gamut and color space compatibility
   * Provides recommendations but doesn't fail validation
   */
  static colorCompatibility(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) {
        return null;
      }

      const colorGamut = parent.get('colorGamut')?.value;
      const colorSpace = parent.get('colorSpace')?.value;

      // Only validate if both values are present and valid
      if (
        !colorGamut ||
        !colorSpace ||
        !ColorEnumHelpers.isValidColorGamut(colorGamut) ||
        !ColorEnumHelpers.isValidColorSpace(colorSpace)
      ) {
        return null;
      }

      // Get recommended color space for the selected gamut
      const recommended = ColorEnumHelpers.getRecommendedColorSpace(colorGamut);

      // This is a warning, not an error - don't fail validation
      if (colorSpace !== recommended) {
        return {
          compatibility: {
            message: `For ${colorGamut}, ${recommended} is typically recommended`,
            isWarning: true,
            currentSelection: colorSpace,
            recommendation: recommended,
          },
        };
      }

      return null;
    };
  }

  /**
   * Async validator for project name uniqueness
   * Note: This would typically check against a backend service
   * For now, it's a placeholder that always passes
   */
  static uniqueProjectName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // TODO: Implement async validation against backend
      // This would check if project name already exists for the current user

      // For now, just validate locally against common reserved names
      const value = control.value;
      if (!value) {
        return null;
      }

      const name = String(value).trim().toLowerCase();
      const reservedNames = [
        'admin',
        'api',
        'test',
        'null',
        'undefined',
        'system',
      ];

      if (reservedNames.includes(name)) {
        return {
          reserved: {
            message: `"${value}" is a reserved name and cannot be used`,
          },
        };
      }

      return null;
    };
  }

  /**
   * Get validation error message from form control
   * Provides user-friendly messages for all validation errors
   */
  static getErrorMessage(control: AbstractControl): string | null {
    if (!control.errors) {
      return null;
    }

    // Priority order for multiple errors
    const errorKeys = [
      'required',
      'maxLength',
      'pattern',
      'whitespace',
      'invalidGamut',
      'invalidColorSpace',
      'reserved',
    ];

    for (const key of errorKeys) {
      if (control.errors[key]) {
        return control.errors[key].message || `Invalid ${key}`;
      }
    }

    // Fallback for any other errors
    const firstError = Object.keys(control.errors)[0];
    return control.errors[firstError]?.message || 'Invalid input';
  }

  /**
   * Get validation warning message from form control
   * For non-blocking validation feedback (like compatibility warnings)
   */
  static getWarningMessage(control: AbstractControl): string | null {
    if (!control.errors) {
      return null;
    }

    // Look for warning-type errors
    for (const [key, error] of Object.entries(control.errors)) {
      if (error && typeof error === 'object' && error.isWarning) {
        return error.message || `Warning: ${key}`;
      }
    }

    return null;
  }

  /**
   * Check if control has validation errors (excluding warnings)
   * Useful for determining if form can be submitted
   */
  static hasErrors(control: AbstractControl): boolean {
    if (!control.errors) {
      return false;
    }

    // Check if any errors are not warnings
    for (const error of Object.values(control.errors)) {
      if (!error || typeof error !== 'object' || !error.isWarning) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate entire project form
   * Returns comprehensive validation summary
   */
  static validateProjectForm(form: AbstractControl): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Validate each field
    const fields = ['name', 'colorGamut', 'colorSpace'];

    for (const fieldName of fields) {
      const field = form.get(fieldName);
      if (field) {
        const errorMessage = this.getErrorMessage(field);
        const warningMessage = this.getWarningMessage(field);

        if (errorMessage && this.hasErrors(field)) {
          errors[fieldName] = errorMessage;
        }

        if (warningMessage) {
          warnings[fieldName] = warningMessage;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }
}
