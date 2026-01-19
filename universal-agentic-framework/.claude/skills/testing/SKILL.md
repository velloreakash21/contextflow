---
name: testing
description: "Best practices for writing and running tests. Activated when creating tests, debugging test failures, or improving test coverage."
---

# Testing Guidelines

This skill provides testing best practices and patterns.

---

## Test Philosophy

### The Testing Pyramid
```
        /\
       /  \
      / E2E \        ← Few: Slow, expensive, brittle
     /______\
    /        \
   /Integration\    ← Some: Test boundaries
  /____________\
 /              \
/   Unit Tests   \  ← Many: Fast, cheap, focused
/________________\
```

### What Makes a Good Test

1. **Fast**: Milliseconds, not seconds
2. **Isolated**: No dependencies on other tests
3. **Repeatable**: Same result every time
4. **Self-validating**: Pass or fail, no interpretation
5. **Timely**: Written with the code

---

## Test Structure (AAA Pattern)

```javascript
describe('ComponentOrModule', () => {
  describe('methodOrBehavior', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange - Set up test data and conditions
      const input = createTestInput();
      const expected = createExpectedOutput();
      
      // Act - Execute the code under test
      const result = functionUnderTest(input);
      
      // Assert - Verify the outcome
      expect(result).toEqual(expected);
    });
  });
});
```

### Good Test Names

```javascript
// ❌ Bad - vague
it('should work correctly', () => {});

// ✅ Good - describes behavior
it('should return empty array when no items match filter', () => {});
it('should throw ValidationError when email format is invalid', () => {});
it('should retry up to 3 times when network request fails', () => {});
```

---

## Unit Tests

### Test One Thing
```javascript
// ❌ Bad - tests multiple behaviors
it('should create user and send email', async () => {
  const user = await createUser(data);
  expect(user.id).toBeDefined();
  expect(mockEmailService.send).toHaveBeenCalled();
});

// ✅ Good - separate tests
it('should create user with generated ID', async () => {
  const user = await createUser(data);
  expect(user.id).toBeDefined();
});

it('should send welcome email after user creation', async () => {
  await createUser(data);
  expect(mockEmailService.send).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'welcome' })
  );
});
```

### Test Edge Cases
```javascript
describe('divide', () => {
  it('should divide two positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
  
  it('should throw when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow(DivisionByZeroError);
  });
  
  it('should handle decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.333, 2);
  });
});
```

### Test Error Cases
```javascript
describe('validateEmail', () => {
  it('should throw ValidationError for missing @', () => {
    expect(() => validateEmail('invalidemail.com'))
      .toThrow(ValidationError);
  });
  
  it('should include field name in error message', () => {
    expect(() => validateEmail('bad'))
      .toThrow(expect.objectContaining({
        message: expect.stringContaining('email')
      }));
  });
});
```

---

## Mocking

### When to Mock

| Mock | Don't Mock |
|------|------------|
| External APIs | Pure functions |
| Databases | Simple utilities |
| File system | Core language features |
| Network calls | What you own |
| Time (Date.now) | Simple data transformations |

### Mock Patterns

```javascript
// Mock implementation
jest.mock('./emailService');
const mockEmailService = require('./emailService');
mockEmailService.send.mockResolvedValue({ messageId: '123' });

// Mock return value
jest.spyOn(Date, 'now').mockReturnValue(1234567890000);

// Mock entire module
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { id: 1 } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));
```

### Verify Mock Calls

```javascript
it('should call API with correct parameters', async () => {
  await submitOrder(orderData);
  
  expect(mockApi.post).toHaveBeenCalledTimes(1);
  expect(mockApi.post).toHaveBeenCalledWith(
    '/orders',
    expect.objectContaining({
      items: orderData.items,
      total: expect.any(Number)
    })
  );
});
```

---

## Integration Tests

### Test Real Boundaries
```javascript
describe('UserRepository', () => {
  let db;
  
  beforeAll(async () => {
    db = await createTestDatabase();
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  beforeEach(async () => {
    await db.clean();
  });
  
  it('should persist and retrieve user', async () => {
    const repo = new UserRepository(db);
    const user = { name: 'John', email: 'john@test.com' };
    
    const created = await repo.create(user);
    const retrieved = await repo.findById(created.id);
    
    expect(retrieved).toMatchObject(user);
  });
});
```

### Test API Endpoints
```javascript
describe('POST /api/users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);
    
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'John',
      email: 'john@test.com'
    });
  });
  
  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'invalid' })
      .expect(400);
    
    expect(response.body.error).toContain('email');
  });
});
```

---

## Test Data

### Use Factories
```javascript
// factories/user.factory.js
const createUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  createdAt: new Date(),
  ...overrides
});

// In tests
const user = createUser({ email: 'specific@test.com' });
```

### Use Fixtures for Complex Data
```javascript
// fixtures/order.fixture.js
export const validOrder = {
  id: 'order-123',
  items: [
    { productId: 'prod-1', quantity: 2, price: 100 },
    { productId: 'prod-2', quantity: 1, price: 50 }
  ],
  total: 250
};

export const emptyOrder = {
  id: 'order-empty',
  items: [],
  total: 0
};
```

---

## Common Testing Patterns

### Testing Async Code
```javascript
// Promise-based
it('should resolve with data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// Error handling
it('should reject with error', async () => {
  await expect(fetchBadData()).rejects.toThrow('Not found');
});
```

### Testing Time-Dependent Code
```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should expire token after 1 hour', () => {
  const token = createToken();
  
  jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
  
  expect(isTokenValid(token)).toBe(false);
});
```

### Testing Event Emitters
```javascript
it('should emit "complete" when processing finishes', (done) => {
  const processor = new Processor();
  
  processor.on('complete', (result) => {
    expect(result.status).toBe('success');
    done();
  });
  
  processor.start();
});
```

---

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.spec.ts

# Run tests matching pattern
npm test -- --grep "UserService"

# Run with coverage
npm test -- --coverage

# Run only changed tests
npm test -- --onlyChanged
```

---

## Coverage Guidelines

### Minimum Coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### What to Cover
| Cover | Skip |
|-------|------|
| Business logic | Generated code |
| Error paths | Simple DTOs |
| Edge cases | External libraries |
| Public APIs | Framework boilerplate |

---

## Quick Reference

```javascript
// Test template
describe('Module', () => {
  // Setup
  beforeAll(() => { /* one-time setup */ });
  afterAll(() => { /* cleanup */ });
  beforeEach(() => { /* reset before each */ });
  
  describe('method', () => {
    it('should [behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});

// Common assertions
expect(value).toBe(expected);           // strict equality
expect(value).toEqual(expected);        // deep equality
expect(value).toBeDefined();            // not undefined
expect(value).toBeNull();               // is null
expect(array).toContain(item);          // array contains
expect(object).toMatchObject(partial);  // partial match
expect(fn).toThrow(Error);              // throws error
expect(fn).toHaveBeenCalled();          // mock was called
expect(fn).toHaveBeenCalledWith(args);  // called with args
```
