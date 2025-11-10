export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
export class TypeValidationError extends ValidationError {
  constructor(val: any, typeName: string) {
    super(`Invalid value '${val}' for type '${typeName}'`);
  }
}

export class CheckValidationError extends ValidationError {
  constructor(val: any, message: string) {
    super(`Invalid value '${val}': value ${message}`);
  }
}

export class MissingFieldError extends ValidationError {
  constructor(field: string | string[]) {
    super(
      `Missing required field: '${Array.isArray(field) ? field.join(', ') : field}'`,
    );
  }
}
