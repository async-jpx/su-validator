import { Su, ValidationError } from '../src/lib/validator';

describe('Su.string', () => {
  it('parses valid string', () => {
    expect(Su.string().parse('hello')).toBe('hello');
  });
  it('throws on non-string', () => {
    expect(() => Su.string().parse(123)).toThrow(ValidationError);
    expect(() => Su.string().parse(null)).toThrow(ValidationError);
  });
});

describe('Su.string().email()', () => {
  it('parses valid email', () => {
    expect(Su.string().email().parse('test@example.com')).toBe(
      'test@example.com',
    );
    expect(Su.string().email().parse('foo.bar@baz.co')).toBe('foo.bar@baz.co');
  });
  it('throws on invalid email', () => {
    expect(() => Su.string().email().parse('not-an-email')).toThrow(
      ValidationError,
    );
    expect(() => Su.string().email().parse('foo@bar')).toThrow(ValidationError);
    expect(() => Su.string().email().parse('foo@bar.')).toThrow(
      ValidationError,
    );
    expect(() => Su.string().email().parse('foo@.com')).toThrow(
      ValidationError,
    );
    expect(() => Su.string().email().parse('')).toThrow(ValidationError);
  });
});

describe('Su.number', () => {
  it('parses valid number', () => {
    expect(Su.number().parse(42)).toBe(42);
  });
  it('throws on non-number', () => {
    expect(() => Su.number().parse('42')).toThrow(ValidationError);
    expect(() => Su.number().parse(undefined)).toThrow(ValidationError);
  });
});

describe('Su.boolean', () => {
  it('parses valid boolean', () => {
    expect(Su.boolean().parse(true)).toBe(true);
    expect(Su.boolean().parse(false)).toBe(false);
  });
  it('throws on non-boolean', () => {
    expect(() => Su.boolean().parse('true')).toThrow(ValidationError);
    expect(() => Su.boolean().parse(0)).toThrow(ValidationError);
  });
});

describe('Su.date', () => {
  it('parses valid Date', () => {
    const d = new Date();
    expect(Su.date().parse(d)).toBe(d);
  });
  it('throws on non-Date', () => {
    expect(() => Su.date().parse('2020-01-01')).toThrow(ValidationError);
    expect(() => Su.date().parse(123)).toThrow(ValidationError);
  });
});

describe('Su.object', () => {
  const schema = {
    name: Su.string(),
    age: Su.number(),
    isActive: Su.boolean(),
  };
  it('parses valid object', () => {
    const obj = { name: 'Alice', age: 30, isActive: true };
    expect(Su.object(schema).parse(obj)).toBe(obj);
  });
  it('throws on missing property', () => {
    expect(() => Su.object(schema).parse({ name: 'Bob', age: 25 })).toThrow(
      ValidationError,
    );
  });
  it('throws on wrong property type', () => {
    expect(() =>
      Su.object(schema).parse({ name: 'Bob', age: '25', isActive: true }),
    ).toThrow(ValidationError);
  });
  it('throws on non-object', () => {
    expect(() => Su.object(schema).parse(null)).toThrow(ValidationError);
    expect(() => Su.object(schema).parse('not an object')).toThrow(
      ValidationError,
    );
  });
});
