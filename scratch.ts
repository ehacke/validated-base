import { validateSync, ValidatorOptions } from "class-validator";

/**
 * @class
 */
export abstract class ValidatedBase {
  /**
   * Perform sync validation
   *
   * @param {ValidatorOptions} [options]
   * @returns {void}
   */
  validate(options?: ValidatorOptions): void {
    options = { ...options, ...DEFAULT_VALIDATION_OPTIONS };
    const errors = validateSync(this, options);

    if (errors.length > 0) {
      const errorStrings = getErrorStrings(errors);
      throw new Err(errorStrings.join(', '), HTTP_STATUS.BAD_REQUEST);
    }
  }
}
