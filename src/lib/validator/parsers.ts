import { CheckValidationError, TypeValidationError } from './exceptions';

export type AssertFunc<T> = (value: unknown) => asserts value is T;
export type CheckFunc<T> = (value: T) => void;
export type ParseFunc<T> = (value: unknown) => T;
export type SafeParseFunc<T> = (
  value: unknown,
) => T | { success: false; error: Error };
export interface Parser<T> {
  safeParse: SafeParseFunc<T>;
  parse: ParseFunc<T>;
}

export function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeValidationError(value, 'string');
  }
}
export function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypeValidationError(value, 'number');
  }
}

export function assertBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new TypeValidationError(value, 'boolean');
  }
}

export function assertDate(value: unknown): asserts value is Date {
  if (!(value instanceof Date)) {
    throw new TypeValidationError(value, 'Date');
  }
}

export function assertFile(value: unknown): asserts value is File {
  if (!(value instanceof File)) {
    throw new TypeValidationError(value, 'File');
  }
}

export class StringParser implements Parser<string> {
  private readonly checks: CheckFunc<string>[] = [];

  constructor(checks?: CheckFunc<string>[]) {
    if (checks) {
      this.checks.push(...checks);
    }
  }
  safeParse: SafeParseFunc<string> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<string> = (value: unknown) => {
    assertString(value);
    for (const check of this.checks) {
      check(value);
    }
    return value;
  };

  email() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (!emailPattern.test(value)) {
          throw new CheckValidationError(value, 'not a valid email');
        }
      },
    ]);
  }

  password() {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (!passwordPattern.test(value)) {
          const masked = '*'.repeat(value.length);
          throw new CheckValidationError(masked, 'not a valid password');
        }
      },
    ]);
  }

  username() {
    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (!usernamePattern.test(value)) {
          throw new CheckValidationError(value, 'not a valid username');
        }
      },
    ]);
  }

  length({ min, max, fix }: { min?: number; max?: number; fix?: number }) {
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (min !== undefined && value.length < min) {
          throw new CheckValidationError(
            value,
            `shorter than ${min} characters`,
          );
        }
        if (max !== undefined && value.length > max) {
          throw new CheckValidationError(
            value,
            `longer than ${max} characters`,
          );
        }
        if (fix !== undefined && value.length !== fix) {
          throw new CheckValidationError(
            value,
            `must be exactly ${fix} characters`,
          );
        }
      },
    ]);
  }

  match(strToMatch: string | undefined) {
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (value !== strToMatch) {
          throw new CheckValidationError(value, `must match ${strToMatch}`);
        }
      },
    ]);
  }
}

export class NumberParser implements Parser<number> {
  private readonly checks: CheckFunc<number>[];
  constructor(checks?: CheckFunc<number>[]) {
    this.checks = checks || [];
  }

  safeParse: SafeParseFunc<number> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<number> = (value: unknown) => {
    assertNumber(value);
    for (const check of this.checks) {
      check(value);
    }
    return value;
  };

  min(minValue: number) {
    return new NumberParser([
      ...this.checks,
      (value) => {
        if (value < minValue) {
          throw new CheckValidationError(value, `less than ${minValue}`);
        }
      },
    ]);
  }
  max(maxValue: number) {
    return new NumberParser([
      ...this.checks,
      (value) => {
        if (value > maxValue) {
          throw new CheckValidationError(value, `greater than ${maxValue}`);
        }
      },
    ]);
  }
}

export class BooleanParser implements Parser<boolean> {
  safeParse: SafeParseFunc<boolean> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<boolean> = (value: unknown) => {
    assertBoolean(value);
    return value;
  };
}

export class DateParser implements Parser<Date> {
  safeParse: SafeParseFunc<Date> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<Date> = (value: unknown) => {
    assertDate(value);
    return value;
  };
}

export class FileParser implements Parser<File> {
  private readonly checks: CheckFunc<File>[];
  readonly baseMimeTypes = {
    image: ['image/png', 'image/jpeg', 'image/webp'],
  };
  constructor(checks?: CheckFunc<File>[]) {
    this.checks = checks || [];
  }
  /**
   * @param mimeTypes additional mime types to allow
   * Defaults to common image mime types if not provided
   */
  image(mimeTypes?: string[]) {
    const mimeTypesToCheck = [
      ...(mimeTypes || []),
      ...this.baseMimeTypes.image,
    ];
    return new FileParser([
      ...this.checks,
      (file) => {
        if (!mimeTypesToCheck.includes(file.type)) {
          throw new CheckValidationError(
            file,
            `file type is not supported: ${file.type}`,
          );
        }
      },
    ]);
  }

  /**
   * @param max maximum file size in bytes
   */
  sizeMax(max: number) {
    return new FileParser([
      ...this.checks,
      (file) => {
        if (file.size > max) {
          throw new CheckValidationError(
            file,
            `file size exceeds the limit of ${max} bytes`,
          );
        }
      },
    ]);
  }

  safeParse: SafeParseFunc<File> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<File> = (value: unknown) => {
    assertFile(value);

    for (const check of this.checks) {
      check(value);
    }
    return value;
  };
}

export class ArrayParser<T> implements Parser<T[]> {
  private readonly itemParser: Parser<T>;
  private readonly checks: CheckFunc<T[]>[];

  constructor(itemParser: Parser<T>, checks?: CheckFunc<T[]>[]) {
    this.itemParser = itemParser;
    this.checks = checks || [];
  }
  private validate(value: unknown): asserts value is T[] {
    if (!Array.isArray(value)) {
      throw new TypeValidationError(value, 'array');
    }
    for (const item of value) {
      this.itemParser.parse(item);
    }
  }

  length({ min, max, fix }: { min?: number; max?: number; fix?: number }) {
    return new ArrayParser<T>(this.itemParser, [
      ...this.checks,
      (value: T[]) => {
        if (min !== undefined && value.length < min) {
          throw new CheckValidationError(value, `array shorter than ${min}`);
        }
        if (max !== undefined && value.length > max) {
          throw new CheckValidationError(value, `array longer than ${max}`);
        }
        if (fix !== undefined && value.length !== fix) {
          throw new CheckValidationError(
            value,
            `array must have exactly ${fix} items`,
          );
        }
      },
    ]);
  }

  safeParse: SafeParseFunc<T[]> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };
  parse: ParseFunc<T[]> = (value: unknown) => {
    this.validate(value);
    for (const check of this.checks) {
      check(value);
    }
    return value;
  };
}

export class NullParser<T> implements Parser<T | null> {
  private readonly innerParser: Parser<T>;
  constructor(innerParser: Parser<T>) {
    this.innerParser = innerParser;
  }
  safeParse: SafeParseFunc<T | null> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<T | null> = (value: unknown) => {
    if (value === null) {
      return null;
    }
    return this.innerParser.parse(value);
  };
}

export class OptionalParser<T> implements Parser<T | undefined> {
  private readonly innerParser: Parser<T>;
  constructor(innerParser: Parser<T>) {
    this.innerParser = innerParser;
  }
  safeParse: SafeParseFunc<T | undefined> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  parse: ParseFunc<T | undefined> = (value: unknown) => {
    if (value === undefined) {
      return undefined;
    }
    return this.innerParser.parse(value);
  };
}

export class LiteralParser<const T extends readonly string[]>
  implements Parser<T[number]>
{
  private readonly literalValues: T;
  constructor(literalValues: T) {
    this.literalValues = literalValues;
  }
  safeParse: SafeParseFunc<T[number]> = (value: unknown) => {
    try {
      const parsedValue = this.parse(value);
      return parsedValue;
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };
  parse: ParseFunc<T[number]> = (value: unknown) => {
    if (this.literalValues.indexOf(value as T[number]) === -1) {
      throw new TypeValidationError(value, 'literal');
    }
    return value as T[number];
  };
}
