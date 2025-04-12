import { expect } from 'chai';
import { isDateString, IsEnum, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { enumError, ValidatedBase, toDate } from '../index';

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
    expect(
      () =>
        new ValidatedClass({
          bar: -1,
          foo: 'something',
          things: ENUM_THINGS.FIRST,
        })
    ).to.throw('bar must not be less than 0');
    expect(() => new ValidatedClass({ bar: 10, foo: 'something-something', things: ENUM_THINGS.FIRST })).to.throw(
      'foo must be shorter than or equal to 10 characters'
    );
    expect(
      () =>
        new ValidatedClass({
          bar: 10,
          foo: 'something',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          things: 'not enum' as any,
        })
    ).to.throw('things must be one of: first, second');
  });

  it('async validation', async () => {
    const created = await new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST }, false);

    expect(async () => created.validateAsync()).to.not.throw();
    expect(created).to.eql({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });
    expect(
      await new ValidatedClass(
        {
          bar: -1,
          foo: 'something',
          things: ENUM_THINGS.FIRST,
        },
        false
      )
        .validateAsync()
        .catch((error) => error.message)
    ).to.eql('bar must not be less than 0');
    expect(
      await new ValidatedClass({ bar: 10, foo: 'something-something', things: ENUM_THINGS.FIRST }, false)
        .validateAsync()
        .catch((error) => error.message)
    ).to.eql('foo must be shorter than or equal to 10 characters');
    expect(
      await new ValidatedClass(
        {
          bar: 10,
          foo: 'something',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          things: 'not enum' as any,
        },
        false
      )
        .validateAsync()
        .catch((error) => error.message)
    ).to.eql('things must be one of: first, second');
  });

  it('get json', () => {
    const created = new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });
    expect(created.convertToJSON(['bar'])).to.eql({ foo: 'something', things: ENUM_THINGS.FIRST });
  });
});

describe('toDate unit tests', () => {
  it('valid dates', () => {
    const date = new Date('2018-01-01T00:00:00Z');
    expect(toDate('2018-01-01T00:00:00Z')).to.eql(date);
    expect(toDate('2017-12-31T19:00:00.000-05:00')).to.eql(date);
    expect(toDate(date)).to.eql(date);
    expect(toDate(date.valueOf())).to.eql(date);
    const mockFirestoreDate = { toDate: () => date };
    expect(toDate(mockFirestoreDate)).to.eql(date);
  });

  it('invalid dates', () => {
    expect(isDateString(toDate('2018-01-0100:00:00Z').toString())).to.eql(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isDateString(toDate(null as any).toString())).to.eql(false);
    expect(isDateString(toDate(9999999999999999).toString())).to.eql(false);
    const badMockFirestoreDate = { toDate: () => 'foo' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isDateString(toDate(badMockFirestoreDate as any).toString())).to.eql(false);
  });
});
