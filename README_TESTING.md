# Testing Documentation for YT2Aptos

This document outlines the testing infrastructure, patterns, and guidelines for the YouTube content archiving system.

## Testing Infrastructure

The project uses Jest as the primary testing framework across all packages, with specific configurations for each package type:

- **Shared Package**: Node.js environment for testing utilities and storage providers
- **Backend Package**: Node.js environment with MongoDB Memory Server for database tests
- **Frontend Package**: JSDOM environment with React Testing Library

## Test Coverage Goals

The project aims for at least 80% test coverage across all packages, focusing on:

- **Line Coverage**: 80%
- **Function Coverage**: 80%
- **Branch Coverage**: 80%
- **Statement Coverage**: 80%

Coverage reports are generated using Istanbul/NYC and can be viewed in the `coverage` directory of each package after running the tests with coverage.

## Package-Specific Testing Patterns

### Shared Package

The shared package tests focus on:

1. **Storage Provider Interface**: Testing the contract and behavior requirements for storage providers
2. **Local File System Provider**: Comprehensive testing of file system operations with mocked fs-extra
3. **Provider Factory**: Testing the registration and creation of storage providers

Tests in the shared package use extensive mocking to avoid actual file system operations.

### Backend Package

The backend package tests include:

1. **Mongoose Models**: Testing model validation, methods, and middleware
2. **Middleware Components**: Testing error handling, authentication, and validation middleware
3. **Service Layer**: Testing business logic and service interactions
4. **API Controllers**: Testing request handling and response formatting

Backend tests use:
- MongoDB Memory Server for in-memory database testing
- Request/Response mocking for HTTP testing
- Environment variable mocking for configuration testing

### Frontend Package

The frontend package tests cover:

1. **React Components**: Testing rendering, props, and user interactions
2. **Custom Hooks**: Testing state management and side effects
3. **Routing**: Testing route configurations and redirects
4. **API Interactions**: Testing API calls with mocked responses

Frontend tests use:
- React Testing Library for component testing
- Jest mocks for API calls and browser APIs
- JSDOM for simulating browser environment

## Mock Utilities

### File System Mocks

```typescript
// Example of file system mocking used in LocalFileSystemProvider tests
jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  // ... other mocked methods
}));
```

### MongoDB Mocks

The MongoDB Memory Server is used to create a real MongoDB instance in memory, allowing for realistic database testing without external dependencies:

```typescript
// From backend/src/__tests__/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### HTTP Request/Response Mocks

```typescript
// Example from error handler middleware tests
const mockRequest = {
  method: 'GET',
  originalUrl: '/test',
};

const jsonMock = jest.fn().mockReturnValue({});
const statusMock = jest.fn().mockReturnThis();

const mockResponse = {
  status: statusMock,
  json: jsonMock,
};

const mockNext = jest.fn();
```

### React Testing Utilities

```typescript
// Example of component testing wrapper
const HeaderWithRouter = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

// Example of component testing
it('renders the app title', () => {
  render(<HeaderWithRouter />);
  const title = screen.getByText('YT2Aptos');
  expect(title).toBeInTheDocument();
});
```

## Running Tests

### Running All Tests

```bash
npm test
```

This command runs tests across all packages. It is configured in the root package.json.

### Running Tests for a Specific Package

```bash
# Run shared package tests
npm run test --workspace=packages/shared

# Run backend package tests
npm run test --workspace=packages/backend

# Run frontend package tests
npm run test --workspace=packages/frontend
```

### Running Tests with Coverage

```bash
# All packages
npm run test:coverage

# Specific package
npm run test:coverage --workspace=packages/shared
```

### Watch Mode

```bash
# All packages
npm run test:watch

# Specific package
npm run test:watch --workspace=packages/backend
```

## Test Organization

Each package follows the same test organization pattern:

```
packages/
  ├── shared/
  │   └── src/
  │       ├── __tests__/
  │       │   └── setup.ts
  │       └── storage/
  │           ├── __tests__/
  │           │   └── provider.factory.test.ts
  │           └── providers/
  │               └── __tests__/
  │                   └── local-file-system.provider.test.ts
  ├── backend/
  │   └── src/
  │       ├── __tests__/
  │       │   └── setup.ts
  │       ├── middleware/
  │       │   └── __tests__/
  │       │       └── error-handler.middleware.test.ts
  │       └── models/
  │           └── __tests__/
  │               └── user.model.test.ts
  └── frontend/
      └── src/
          ├── __tests__/
          │   └── setup.tsx
          └── components/
              └── __tests__/
                  └── Header.test.tsx
```

Tests are co-located with the code they're testing, in a `__tests__` directory at the same level. This organization makes it easy to find tests for a particular module.

## Best Practices

1. **Test Isolation**: Each test should run independently, without relying on the state from other tests.
2. **Focused Tests**: Test one thing at a time, with clear assertions.
3. **Realistic Data**: Use realistic test data that represents actual use cases.
4. **Descriptive Names**: Use descriptive test names that explain what is being tested.
5. **Setup/Teardown**: Clean up resources before and after tests to maintain isolation.
6. **Mocking External Systems**: Mock external dependencies like databases, file systems, and APIs.

## Conclusion

This testing approach provides comprehensive coverage across all components of the YT2Aptos application. By following the patterns and guidelines in this document, we ensure that the application is thoroughly tested and maintains high quality as it evolves.