import { MissingFieldError, TypeValidationError } from './exceptions';
import {
  ArrayParser,
  BooleanParser,
  DateParser,
  FileParser,
  LiteralParser,
  NullParser,
  NumberParser,
  OptionalParser,
  Parser,
  StringParser,
} from './parsers';

type Merge<T> = T extends unknown
  ? T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]: T[K] }
      : T
  : never;

type InferSchemaType<Schema extends Record<string, Parser<any>>> = Merge<
  {
    [Key in keyof Schema as undefined extends ReturnType<Schema[Key]['parse']>
      ? never
      : Key]: ReturnType<Schema[Key]['parse']>;
  } & {
    [Key in keyof Schema as undefined extends ReturnType<Schema[Key]['parse']>
      ? Key
      : never]?: Exclude<ReturnType<Schema[Key]['parse']>, undefined>;
  }
>;

const OPTIONAL = Symbol('su.optional');

function isOptional(parser: unknown): boolean {
  return !!(parser && (parser as any)[OPTIONAL]);
}
export const Su = {
  string: () => new StringParser(),
  number: () => new NumberParser(),
  boolean: () => new BooleanParser(),
  date: () => new DateParser(),
  file: () => new FileParser(),
  literal<const T extends readonly string[]>(literalValues: T) {
    return new LiteralParser<T>(literalValues);
  },
  optional<T>(parser: Parser<T>) {
    return new OptionalParser<T>(parser);
  },
  null<T>(parser: Parser<T>) {
    return new NullParser<T>(parser);
  },
  array<P extends Parser<any>>(itemParser: P) {
    return new ArrayParser<ReturnType<P['parse']>>(itemParser);
  },
  object<T, S extends Record<string, Parser<T>>>(schema: S) {
    function validateSchema(
      value: unknown,
    ): asserts value is InferSchemaType<S> {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new TypeValidationError(value, 'object');
      }

      const obj = value as Record<string, unknown>;
      const missingFields = Object.keys(schema).filter(
        (key) => !(key in obj) && !isOptional(schema[key]),
      );
      if (missingFields.length > 0) {
        throw new MissingFieldError(missingFields);
      }

      for (const key of Object.keys(schema)) {
        schema[key].parse(obj[key]);
      }
    }
    return {
      safeParse(value: unknown) {
        try {
          validateSchema(value);
          return { success: true, data: value as InferSchemaType<S> };
        } catch (error) {
          return { success: false, error };
        }
      },
      parse(value: unknown) {
        validateSchema(value);
        return value;
      },
    };
  },
};
export type SuInfer<T> = T extends Parser<any> ? ReturnType<T['parse']> : never;
