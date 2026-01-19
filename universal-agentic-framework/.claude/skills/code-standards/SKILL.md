---
name: code-standards
description: "Project-specific coding standards and conventions. Automatically activated when writing, reviewing, or refactoring code. Ensures consistency across the codebase."
---

# Code Standards

This skill defines coding standards for this project. Follow these conventions when writing or reviewing code.

---

## Naming Conventions

### Variables & Functions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `totalCount` |
| Functions | camelCase | `getUserById()`, `calculateTotal()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Booleans | is/has/can prefix | `isActive`, `hasPermission`, `canEdit` |

### Classes & Types
| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `UserService`, `OrderController` |
| Interfaces | PascalCase (no I prefix) | `User`, `OrderItem` |
| Type aliases | PascalCase | `UserId`, `OrderStatus` |
| Enums | PascalCase | `OrderStatus.PENDING` |

### Files & Folders
| Type | Convention | Example |
|------|------------|---------|
| Component files | PascalCase | `UserProfile.tsx` |
| Utility files | kebab-case | `date-utils.ts` |
| Test files | Same + `.test.` | `UserService.test.ts` |
| Config files | kebab-case | `eslint-config.js` |

---

## Code Structure

### Function Length
- **Target**: 20 lines or fewer
- **Max**: 50 lines (requires justification)
- If longer, extract helper functions

### Function Arguments
- **Target**: 3 or fewer
- **Max**: 5
- Use options object for many params:
  ```javascript
  // ❌ Bad
  function createUser(name, email, age, role, department, startDate) {}
  
  // ✅ Good
  function createUser({ name, email, age, role, department, startDate }) {}
  ```

### Single Responsibility
- Each function does ONE thing
- Each file has ONE purpose
- Each module handles ONE domain

---

## Error Handling

### Always Catch Errors
```javascript
// ❌ Bad - errors silently swallowed
try {
  await riskyOperation();
} catch (e) {}

// ✅ Good - error logged and handled
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error, context: relevantData });
  throw new OperationError('Failed to complete operation', { cause: error });
}
```

### User-Friendly Messages
```javascript
// ❌ Bad - technical jargon
throw new Error('ECONNREFUSED 127.0.0.1:5432');

// ✅ Good - actionable message
throw new DatabaseConnectionError(
  'Unable to connect to database. Please check your connection settings.'
);
```

### Error Types
- Use custom error classes for different failure modes
- Include relevant context in errors
- Don't expose internal details to users

---

## Async/Await

### Always Await
```javascript
// ❌ Bad - floating promise
saveToDatabase(data);

// ✅ Good - properly awaited
await saveToDatabase(data);
```

### Promise.all for Parallel
```javascript
// ❌ Bad - sequential when parallel is possible
const user = await getUser(id);
const orders = await getOrders(id);

// ✅ Good - parallel execution
const [user, orders] = await Promise.all([
  getUser(id),
  getOrders(id)
]);
```

### Error Handling in Async
```javascript
// ✅ Good - errors bubble up
async function processOrder(orderId) {
  const order = await getOrder(orderId);
  return await processPayment(order);
}

// In the caller - single error handler
try {
  await processOrder(id);
} catch (error) {
  handleError(error);
}
```

---

## Comments

### When to Comment
- Complex business logic
- Non-obvious workarounds
- API contracts
- TODO/FIXME with ticket numbers

### When NOT to Comment
```javascript
// ❌ Bad - states the obvious
// Increment counter
counter++;

// ✅ Good - explains the "why"
// Retry limit is 5 per SEC requirements (ticket #1234)
const MAX_RETRIES = 5;
```

### JSDoc for Public APIs
```javascript
/**
 * Processes a payment for the given order.
 * 
 * @param orderId - The unique identifier of the order
 * @param options - Processing options
 * @param options.captureImmediately - Whether to capture payment immediately
 * @returns The payment confirmation with transaction ID
 * @throws {InsufficientFundsError} When payment method has insufficient funds
 * @throws {InvalidOrderError} When order cannot be found or is invalid
 */
async function processPayment(orderId: string, options: PaymentOptions): Promise<PaymentConfirmation> {
```

---

## Git Commits

### Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `chore` | Build, config, dependencies |

### Examples
```
feat(auth): add JWT refresh token endpoint

- Implement token refresh logic
- Add 7-day expiry for refresh tokens
- Update auth middleware to check token type

Closes #123
```

```
fix(payments): handle declined card gracefully

Previously, declined cards caused unhandled exceptions.
Now returns proper error response.

Fixes #456
```

---

## Testing

### Test Naming
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid input', async () => {});
    it('should throw ValidationError when email is invalid', async () => {});
    it('should hash password before saving', async () => {});
  });
});
```

### Test Structure (AAA)
```javascript
it('should calculate total with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;
  
  // Act
  const total = calculateTotal(items, taxRate);
  
  // Assert
  expect(total).toBe(330);
});
```

### What to Test
| Test | Don't Test |
|------|------------|
| Business logic | Framework code |
| Edge cases | Simple getters/setters |
| Error handling | External libraries |
| Public interfaces | Implementation details |

---

## Security

### Never Hardcode Secrets
```javascript
// ❌ Bad
const apiKey = 'sk_live_abc123';

// ✅ Good
const apiKey = process.env.API_KEY;
```

### Parameterized Queries
```javascript
// ❌ Bad - SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good - parameterized
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

### Validate Input
```javascript
// ❌ Bad - trusts user input
const filename = req.params.filename;
fs.readFile(`./uploads/${filename}`);

// ✅ Good - validates and sanitizes
const filename = path.basename(req.params.filename);
if (!ALLOWED_EXTENSIONS.includes(path.extname(filename))) {
  throw new ValidationError('Invalid file type');
}
```

---

## Performance

### Avoid N+1 Queries
```javascript
// ❌ Bad - N+1 problem
const orders = await Order.findAll();
for (const order of orders) {
  order.items = await OrderItem.findByOrder(order.id);
}

// ✅ Good - single query with join
const orders = await Order.findAll({
  include: [{ model: OrderItem }]
});
```

### Lazy Loading
```javascript
// ❌ Bad - loads everything upfront
import { everything } from './huge-library';

// ✅ Good - dynamic import
const module = await import('./huge-library');
```

---

## Quick Reference

```
✅ DO:
- Use descriptive names
- Handle all errors
- Write tests for new code
- Use async/await properly
- Validate all input
- Keep functions small

❌ DON'T:
- Hardcode secrets
- Ignore linter warnings
- Leave console.logs
- Write God functions
- Trust user input
- Copy-paste code
```
