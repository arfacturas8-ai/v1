# Contributing to CRYB Platform

We welcome contributions to the CRYB Platform! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists
2. Provide a clear description of the problem
3. Include steps to reproduce the issue
4. Mention your environment (OS, Node version, etc.)
5. Add relevant logs or screenshots if applicable

### Suggesting Features

1. Check if the feature has been requested
2. Provide a clear use case
3. Explain the expected behavior
4. Consider implementation complexity

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)
- pnpm package manager

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/cryb/platform.git
cd cryb-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
pnpm db:push
pnpm db:seed # Optional: add sample data
```

5. Start development servers:
```bash
pnpm dev
```

## Project Structure

```
/apps
  /api         - Backend API (Fastify)
  /web         - Frontend (Next.js)
  /mobile      - Mobile app (React Native)
  /admin       - Admin panel

/packages
  /database    - Prisma schemas
  /auth        - Authentication utilities
  /ui          - Shared components

/services
  /workers     - Background jobs
  /redis       - Redis configuration

/tests
  /e2e         - End-to-end tests
  /performance - Load tests
  /security    - Security tests
```

## Coding Standards

### General Guidelines

- Write clean, readable code
- Follow existing patterns and conventions
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid code duplication

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type
- Enable strict mode
- Use enums for constants

### React/Next.js

- Use functional components
- Implement proper error boundaries
- Use React hooks appropriately
- Keep components small and reusable
- Follow React best practices

### API Development

- Follow RESTful conventions
- Implement proper validation
- Use appropriate HTTP status codes
- Include error messages
- Document endpoints

### Database

- Write efficient queries
- Use transactions where appropriate
- Add proper indexes
- Follow naming conventions
- Document schema changes

## Testing

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write tests for new features
- Maintain at least 80% coverage
- Test edge cases
- Use descriptive test names
- Mock external dependencies

## Documentation

- Update README for significant changes
- Document new API endpoints
- Add JSDoc comments for functions
- Update changelog for releases
- Include examples where helpful

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

Example:
```
feat: add user profile editing

- Add profile edit form
- Implement avatar upload
- Add validation
```

### Pull Request Process

1. Update your branch with latest `develop`
2. Ensure CI/CD passes
3. Request review from maintainers
4. Address review comments
5. Squash commits if requested
6. Merge after approval

## Release Process

1. Merge to `develop` for staging
2. Test in staging environment
3. Create release branch
4. Update version and changelog
5. Merge to `main`
6. Tag release
7. Deploy to production

## Performance Guidelines

- Optimize database queries
- Implement proper caching
- Lazy load components
- Minimize bundle size
- Use pagination
- Optimize images

## Security Guidelines

- Never commit secrets
- Validate all inputs
- Sanitize user content
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

## Getting Help

- Check documentation first
- Search existing issues
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Recognition

Contributors will be recognized in:
- Contributors list
- Release notes
- Project documentation

Thank you for contributing to CRYB Platform!