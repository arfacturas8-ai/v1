# CRYB Platform - Testing Guide

## 🧪 Test Infrastructure Overview

**Total Test Files: 239**
- Component Tests: 52
- Service Tests: 48
- Page Tests: 92
- Integration Tests: 47

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- src/components/ui/__tests__/Button.test.jsx
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="renders"
```

---

## 📊 Test Types

### 1. Component Tests
**Location**: `src/components/**/__tests__/*.test.jsx`

**Example**:
```javascript
describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const onClick = jest.fn();
    render(<ComponentName onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 2. Service Tests
**Location**: `src/services/*.test.js`

**Example**:
```javascript
describe('serviceName', () => {
  it('calls API with correct parameters', async () => {
    apiService.get.mockResolvedValue({ data: 'test' });

    await serviceFunction();

    expect(apiService.get).toHaveBeenCalledWith('/endpoint');
  });
});
```

### 3. Page Tests
**Location**: `src/pages/__tests__/*.test.jsx`

**Example**:
```javascript
describe('PageName', () => {
  it('renders page without crashing', () => {
    renderWithProviders(<PageName />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

---

## 🛠️ Test Utilities

### renderWithProviders
Renders component with all necessary providers:

```javascript
import { renderWithProviders } from '../../__test__/utils/testUtils';

renderWithProviders(<MyComponent />, {
  route: '/custom-route'
});
```

### Mock Generators
```javascript
import {
  mockUser,
  mockCommunity,
  mockPost
} from '../../__test__/utils/testUtils';

const user = mockUser({ username: 'custom' });
const community = mockCommunity({ name: 'Test' });
```

### API Mocks
```javascript
import { mockApiService } from '../../__test__/mocks/apiMocks';

mockApiService.get.mockResolvedValue({ data: 'test' });
```

---

## ✅ Coverage Goals

**Target: 80%+ across all metrics**

Check coverage:
```bash
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

**Metrics**:
- Lines: 80%+
- Statements: 80%+
- Functions: 80%+
- Branches: 80%+

---

## 🐛 Debugging Tests

### Run Single Test in Watch Mode
```bash
npm test -- Button.test.jsx --watch
```

### See Detailed Output
```bash
npm test -- --verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🚫 Common Issues

### Issue: "Cannot find module"
**Solution**: Check import paths are correct
```javascript
// Wrong
import Component from './Component';

// Right (if using alias)
import Component from '@/components/Component';
```

### Issue: "Element not found"
**Solution**: Use `waitFor` for async elements
```javascript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Issue: "Not wrapped in act()"
**Solution**: Use `userEvent` instead of `fireEvent`
```javascript
// Better
await userEvent.click(button);

// Instead of
fireEvent.click(button);
```

---

## 📝 Writing Good Tests

### ✅ DO
- Test user-visible behavior
- Use accessible queries (getByRole, getByLabelText)
- Test edge cases (null, empty, error states)
- Mock external dependencies
- Keep tests isolated

### ❌ DON'T
- Test implementation details
- Use brittle selectors (getByClassName)
- Test library code
- Share state between tests
- Make tests dependent on each other

---

## 🎯 Test Patterns

### Testing Async Operations
```javascript
it('loads data', async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
```

### Testing Forms
```javascript
it('submits form', async () => {
  const onSubmit = jest.fn();
  render(<Form onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### Testing Error Handling
```javascript
it('displays error', async () => {
  apiService.get.mockRejectedValue(new Error('Failed'));

  render(<Component />);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: npm test -- --coverage --ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm test -- --bail --findRelatedTests
```

---

## 📚 Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎉 Quick Wins

### Run Tests for Changed Files Only
```bash
npm test -- --onlyChanged
```

### Run Failed Tests Only
```bash
npm test -- --onlyFailures
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

---

**Happy Testing! 🧪**
