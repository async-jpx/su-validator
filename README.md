# su-validator

Lightweight TypeScript runtime validators collected under the `Su` facade.

This project exposes small, focused runtime parsers and helpers for validating values at runtime with TypeScript-friendly types.

Core capabilities

- String parsing and checks: `email()`, `password()`, `username()`, `length()`, `match()`
- Number parsing and checks: `min()`, `max()`
- Boolean parsing: `Su.boolean()`
- Date and File parsers
- Arrays: `Su.array(itemParser)` with length checks
- Literal values: `Su.literal([...])` for restricted strings
- Optional / Nullable wrappers: `Su.optional(...)`, `Su.null(...)`
- Object schemas: `Su.object(schema)` with `safeParse()` / `parse()`
- Type inference helper: `SuInfer<typeof schema>`

Usage (minimal example)

```ts
import { Su, SuInfer } from './src/lib/validator/validator';

const UserSchema = Su.object({
   email: Su.string().email(),
   password: Su.string().password(),
   age: Su.number().min(18).max(120),
   isActive: Su.boolean(),
   roles: Su.array(Su.string()).length({ min: 1 }),
   status: Su.literal(['admin', 'user', 'guest']),
});

type User = SuInfer<typeof UserSchema>;

// safeParse returns { success: true, data } or { success: false, error }
const ok = UserSchema.safeParse({
   email: 'dev@example.com',
   password: 'SecurePass123',
   age: 28,
   isActive: true,
   roles: ['developer'],
   status: 'admin',
});

const bad = UserSchema.safeParse({
   email: 'not-an-email',
   password: 'weak',
   age: 15,
   isActive: 'yes',
   roles: [],
   status: 'superuser',
});

console.log(ok);
console.log(bad);
```

That's it — a focused README showing the validator features and a tiny usage snippet suitable for sharing.
