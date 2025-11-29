# Comprehensive Testing Strategy

## Overview
This document outlines the testing strategy for the Cryb platform frontend application, designed to achieve and maintain 80%+ code coverage across all critical paths.

## Testing Pyramid

```
         /\
        /E2E\         ← End-to-End Tests (5%)
       /______\
      /        \
     /Integration\    ← Integration Tests (15%)
    /____________\
   /              \
  /   Unit Tests   \  ← Unit Tests (80%)
 /__________________\
```

## Test Types

### 1. Unit Tests (80% of tests)
**Purpose:** Test individual components, functions, and modules in isolation

**Coverage:**
- **Pages:** All 46 pages in `src/pages/`
- **Components:** All 218+ components in `src/components/`
- **Services:** All 42 services in `src/services/`
- **Hooks:** All 13 custom hooks in `src/hooks/`
- **Utils:** All utility functions in `src/utils/`

**Testing Framework:**
- Jest 30.2.0 (test runner)
- Vitest (alternative test runner)
- React Testing Library 16.3.0
- @testing-library/jest-dom 6.8.0
- @testing-library/user-event 14.6.1

**Example Structure:**
```javascript
describe('ComponentName', () => {
  it('renders without crashing', () => { ... });
  it('handles user interactions', () => { ... });
  it('displays correct data', () => { ... });
  it('handles error states', () => { ... });
  it('is accessible', () => { ... });
});
```

### 2. Integration Tests (15% of tests)
**Purpose:** Test how multiple components work together

**Critical Flows:**
- ✅ Authentication flow (signup → login → logout)
- ✅ Post creation flow (create → edit → delete post)
- ✅ Community flow (join → post → leave)
- ✅ NFT flow (view → purchase → own)
- ✅ Messaging flow (send → receive → delete)
- ✅ Settings flow (update profile → change settings)

**Location:** `tests/integration/`

### 3. End-to-End Tests (5% of tests)
**Purpose:** Test complete user journeys in a real browser

**Framework:** Playwright 1.55.1

**Critical Paths:**
- User registration and onboarding
- Community discovery and joining
- Post creation and engagement
- NFT marketplace transactions
- Voice/video chat sessions
- Admin moderation workflows

**Location:** `tests/e2e/`

## Coverage Goals

### Global Thresholds
```json
{
  "branches": 80,
  "functions": 80,
  "lines": 80,
  "statements": 80
}
```

### Per-Module Targets
- **Pages:** 85%+ (user-facing, critical)
- **Components:** 80%+ (reusable, high-impact)
- **Services:** 90%+ (business logic, API calls)
- **Hooks:** 85%+ (shared state and effects)
- **Utils:** 95%+ (pure functions, easy to test)

## Test Organization

```
apps/react-app/
├── src/
│   ├── pages/__tests__/           # Page component tests
│   ├── components/
│   │   └── ui/__tests__/          # UI component tests
│   ├── services/__tests__/        # Service layer tests
│   ├── hooks/__tests__/           # Custom hooks tests
│   └── utils/__tests__/           # Utility function tests
├── tests/
│   ├── setup.js                   # Jest setup
│   ├── utils/
│   │   └── testUtils.jsx          # Test utilities
│   ├── mocks/
│   │   ├── mockData.js           # Mock data
│   │   └── handlers.js           # Mock service handlers
│   ├── integration/               # Integration tests
│   │   ├── auth-flow.test.js
│   │   ├── post-creation-flow.test.js
│   │   └── ...
│   └── e2e/                      # E2E tests
│       ├── critical-paths.spec.js
│       └── ...
└── coverage/                      # Coverage reports
```

## Testing Utilities

### renderWithRouter
Renders components with React Router and Auth context:
```javascript
import { renderWithRouter } from '../../../tests/utils/testUtils';

renderWithRouter(<HomePage />, {
  authValue: mockAuthContext,
  route: '/'
});
```

### Mock Data
Centralized mock data for consistency:
```javascript
import { mockUser, mockPost, mockCommunity } from '../../../tests/mocks/mockData';
```

### Mock Services
Pre-configured service mocks:
```javascript
import { mockAuthService, mockPostsService } from '../../../tests/mocks/handlers';
```

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test
```bash
npm test HomePage.test.jsx
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Accessibility Tests
```bash
npm run test:accessibility
```

### CI/CD Pipeline
```bash
npm run test:ci
```

## Best Practices

### 1. Test Behavior, Not Implementation
❌ Bad:
```javascript
expect(component.state.count).toBe(5);
```

✅ Good:
```javascript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Semantic Queries
Priority order:
1. `getByRole` (most accessible)
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (last resort)

### 3. Test User Interactions
```javascript
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'test' } });
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 4. Mock External Dependencies
```javascript
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));
```

### 5. Test Error States
```javascript
it('handles API errors gracefully', async () => {
  apiMock.get.mockRejectedValueOnce(new Error('API Error'));
  renderWithRouter(<HomePage />);
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### 6. Test Accessibility
```javascript
it('is keyboard accessible', () => {
  renderWithRouter(<Modal isOpen={true} />);
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
});
```

### 7. Keep Tests Isolated
- Clear mocks before each test
- Don't rely on test execution order
- Clean up side effects

```javascript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Continuous Integration

### Pre-commit Hooks
- Run linting
- Run unit tests for changed files
- Check code formatting

### CI Pipeline
1. **Build:** Compile application
2. **Lint:** Check code quality
3. **Test:** Run all unit and integration tests
4. **Coverage:** Generate coverage report
5. **E2E:** Run critical path tests
6. **Accessibility:** Run a11y audit
7. **Report:** Publish test results

### Coverage Gates
- Block PRs with <80% coverage
- Require all new code to have tests
- Monitor coverage trends

## Maintenance

### Weekly Tasks
- Review failing tests
- Update snapshots if needed
- Check for flaky tests
- Monitor test execution time

### Monthly Tasks
- Review coverage reports
- Identify untested code
- Update test utilities
- Refactor slow tests

### Quarterly Tasks
- Update testing dependencies
- Review testing strategy
- Evaluate new testing tools
- Conduct test workshops

## Metrics to Track

1. **Coverage Percentage**
   - Lines, branches, functions, statements
   - Track trends over time

2. **Test Count**
   - Total number of tests
   - Tests per module

3. **Test Execution Time**
   - Total suite time
   - Slowest tests

4. **Flakiness Rate**
   - Number of intermittent failures
   - Most flaky tests

5. **Bug Escape Rate**
   - Bugs found in production that should have been caught
   - Root cause analysis

## Resources

- **Jest Documentation:** https://jestjs.io/
- **React Testing Library:** https://testing-library.com/react
- **Playwright Docs:** https://playwright.dev/
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Support

For testing questions or issues:
1. Check this documentation
2. Review existing tests for examples
3. Consult team testing guidelines
4. Ask in #testing Slack channel

---

**Last Updated:** November 3, 2025
**Version:** 1.0
**Maintained by:** Engineering Team
