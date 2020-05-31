import { expect } from 'chai';
import { IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';

import { enumError, ValidatedBase } from '..';

enum ENUM_THINGS {
  FIRST = 'first',
  SECOND = 'second',
}

interface ValidatedClassInterface {
  foo: string;
  bar: number;
  things: ENUM_THINGS;
}

class ValidatedClass extends ValidatedBase implements ValidatedClassInterface {
  constructor(params: ValidatedClassInterface, validate = true) {
    super();

    this.bar = params.bar;
    this.foo = params.foo;
    this.things = params.things;

    if (validate) {
      this.validate();
    }
  }

  @IsNumber()
  @Min(0)
  bar: number;

  @IsString()
  @MaxLength(10)
  foo: string;

  @IsEnum(ENUM_THINGS, { message: enumError(ENUM_THINGS) })
  things: ENUM_THINGS;
}

describe('validated base unit tests', () => {
  it('sync validation', () => {
    const created = new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });

    expect(created).to.eql({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });
    expect(() => new ValidatedClass({ bar: -1, foo: 'something', things: ENUM_THINGS.FIRST })).to.throw('bar must not be less than 0');
    expect(() => new ValidatedClass({ bar: 10, foo: 'something-something', things: ENUM_THINGS.FIRST })).to.throw(
      'foo must be shorter than or equal to 10 characters'
    );
    expect(() => new ValidatedClass({ bar: 10, foo: 'something', things: 'not enum' as any })).to.throw('things must be one of: first, second');
  });

  it('async validation', async () => {
    const created = await new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST }, false);

    expect(async () => created.validateAsync()).to.not.throw();
    expect(created).to.eql({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });
    expect(
      await new ValidatedClass({ bar: -1, foo: 'something', things: ENUM_THINGS.FIRST }, false).validateAsync().catch((error) => error.message)
    ).to.eql('bar must not be less than 0');
    expect(
      await new ValidatedClass({ bar: 10, foo: 'something-something', things: ENUM_THINGS.FIRST }, false)
        .validateAsync()
        .catch((error) => error.message)
    ).to.eql('foo must be shorter than or equal to 10 characters');
    expect(
      await new ValidatedClass({ bar: 10, foo: 'something', things: 'not enum' as any }, false).validateAsync().catch((error) => error.message)
    ).to.eql('things must be one of: first, second');
  });

  it('get json', () => {
    const created = new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });
    expect(created.convertToJSON(['bar'])).to.eql({ foo: 'something', things: ENUM_THINGS.FIRST });
  });
});
