# validated-base

![npm](https://img.shields.io/npm/v/validated-base)
![install size](https://badgen.net/packagephobia/install/validated-base)
![Codecov](https://img.shields.io/codecov/c/gh/ehacke/validated-base)
![GitHub](https://img.shields.io/github/license/ehacke/validated-base)

Abstract validated base class using [class-validator](https://github.com/typestack/class-validator).

## Install

```bash
npm i -S validated-base
```

## Usage

Extend to create a class that will validate the object passed in with whatever class-validator decorators you've added.

From that point forward, the instance of the model can be considered valid as it's passed around, and further validation
checks are not necessary.

```typescript
import { enumError, ValidatedBase } from "validated-base";
import { IsEnum, IsNumber, IsString, MaxLength, Min } from "class-validator";

enum ENUM_THINGS {
  FIRST= 'first',
  SECOND='second',
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
  readonly bar: number;
  
  @IsString()
  @MaxLength(10)
  readonly foo: string;
  
  @IsEnum(ENUM_THINGS, { message: enumError(ENUM_THINGS) })
  readonly things: ENUM_THINGS;
}

// Validates class as it's constructed
const validatedModel = new ValidatedClass({ bar: 10, foo: 'something', things: ENUM_THINGS.FIRST });

// Throws exception if property is invalid
const boom = new ValidatedClass({ bar: -1, foo: 'this-is-too-long', things: 'not-enum' });
``` 
