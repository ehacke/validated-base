import { validate, validateSync, ValidatorOptions } from 'class-validator';
import cleanDeep from 'clean-deep';
import Err from 'err';
import HTTP_STATUS from 'http-status';
import { isObject, omit, isDate, isFunction, isNil, isNumber, isString } from 'lodash-es';
import { DateTime } from 'luxon';

export const stringNotDate = (input: unknown | string): input is string => {
	return isString(input);
};

interface FirestoreTimestamp {
	toDate(): Date;
}

export const firestoreTimestamp = (input: unknown | FirestoreTimestamp): input is FirestoreTimestamp => {
	return isFunction((input as FirestoreTimestamp).toDate);
};

export const toDate = (input: Date | string | FirestoreTimestamp | DateTime | number): Date => {
	if (isNil(input)) return new Date('');
	if (isNumber(input))
		return DateTime.fromMillis(input as number)
			.toUTC()
			.toJSDate();
	if (isDate(input)) return DateTime.fromJSDate(input).toUTC().toJSDate();
	if (firestoreTimestamp(input)) return DateTime.fromJSDate(input.toDate()).toJSDate();
	if (DateTime.isDateTime(input)) return input.toJSDate();

	return stringNotDate(input) ? DateTime.fromISO(input).toUTC().toJSDate() : input;
};

/**
 * Strip unsupported characters
 *
 * @param {string} input
 * @returns {string}
 */
export const cleanString = (input: string): string => {
	return input.replace(/\s+/g, ' ').trim();
};

const getErrorStrings = (errors, base = ''): string[] => {
	return errors.reduce((result, { constraints = {}, children = [], property }) => {
		result = [...result, ...Object.values(constraints).map((constraint) => base + constraint)];

		if (children.length > 0) {
			result = [...result, ...getErrorStrings(children, (base += `${property}.`))];
		}

		return result;
	}, []);
};

const DEFAULT_VALIDATION_OPTIONS = {
	forbidNonWhitelisted: true,
	forbidUnknownValues: true,
	whitelist: true,
};

/**
 * Enum error message
 *
 * @param {{}} entity
 * @returns {string | undefined}
 */
export const enumError = (entity: object): string | undefined => {
	if (!isObject(entity)) return;

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
	convertToJSON(omitProperties: string[] = []): object {
		const self = cleanDeep(this, { emptyArrays: false, emptyStrings: false, nullValues: false });
		const privateKeys = Object.keys(self).filter((key) => key.startsWith('_'));
		const cleaned = omit(self, ...privateKeys);

		return JSON.parse(JSON.stringify(omit(cleaned, omitProperties)));
	}
}
