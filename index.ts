import { validate, validateSync, ValidatorOptions } from 'class-validator';
import cleanDeep from 'clean-deep';
import Err from 'err';
import HTTP_STATUS from 'http-status';
import { isObject, omit } from 'lodash';

const getErrorStrings = (errors, base = ''): string[] => {
  return errors.reduce((result, { constraints = {}, children = [], property }) => {
    result = result.concat(Object.values(constraints).map((constraint) => base + constraint));

    if (children.length > 0) {
      result = result.concat(getErrorStrings(children, (base += `${property}.`)));
    }

    return result;
  }, []);
};

const DEFAULT_VALIDATION_OPTIONS = {
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

/**
 * Enum error message
 *
 * @param {{}} entity
 * @returns {string | undefined}
 */
export const enumError = (entity: any): string | undefined => {
  if (!isObject(entity)) return;
  // eslint-disable-next-line consistent-return
  return `$property must be one of: ${Object.values(entity).join(', ')}`;
};

/**
 * @class
 */
export abstract class ValidatedBase {
  /**
   * Perform async validation
   *
   * @param {ValidatorOptions} [options]
   * @returns {Promise<void>}
   */
  async validateAsync(options?: ValidatorOptions): Promise<void> {
    options = { ...options, ...DEFAULT_VALIDATION_OPTIONS };
    const errors = await validate(this, options);

    if (errors.length > 0) {
      const errorStrings = getErrorStrings(errors);
      throw new Err(errorStrings.join(', '), HTTP_STATUS.BAD_REQUEST);
    }
  }

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

  /**
   * Convert model to json
   *
   * @param {string[]} [omitProperties=[]]
   * @returns {{}}
   */
  convertToJSON(omitProperties: string[] = []): any {
    const self = cleanDeep(this, { emptyStrings: false, emptyArrays: false, nullValues: false });
    const privateKeys = Object.keys(self).filter((key) => key.startsWith('_'));
    const cleaned = omit(self, ...privateKeys);

    return JSON.parse(JSON.stringify(omit(cleaned, omitProperties)));
  }
}
