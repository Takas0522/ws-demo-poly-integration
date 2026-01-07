# Contributing to SaaS Admin Web Application

Thank you for your interest in contributing to this project! This document provides guidelines and standards for contributing to the codebase.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback and collaboration
- Respect differing viewpoints and experiences

## 🔄 Development Workflow

This project follows **trunk-based development** with feature flags for managing incomplete features.

### Branching Strategy

#### Main Branch
- Always deployable and production-ready
- Protected with required reviews and CI checks
- All changes merged via Pull Requests
- Tagged for releases

#### Feature Branches
- Short-lived (ideally < 2 days, maximum 1 week)
- Named using convention: `feature/description` or `fix/description`
- Created from latest `main` branch
- Merged back to `main` via Pull Request

**Examples:**
```bash
feature/user-profile-api
feature/jwt-authentication
fix/permission-check-bug
docs/api-documentation
```

#### Branch Naming Conventions

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

### Feature Flag Usage

For features requiring more than 2 days:

1. **Hide incomplete features behind feature flags:**
   ```typescript
   if (process.env.FEATURE_NEW_DASHBOARD === 'enabled') {
     // New feature code
   }
   ```

2. **Use environment variables for control:**
   - Development: Enable flags in `.env.local`
   - Staging: Selectively enable for testing
   - Production: Enable only when ready

3. **Remove flags after feature stabilizes** (typically 1-2 releases after deployment)

### Daily Development Workflow

1. **Start your day:**
   ```bash
   git checkout main
   git pull --recurse-submodules
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit frequently:**
   ```bash
   git add .
   git commit -m "feat: add user profile endpoint"
   ```

4. **Keep branch updated:**
   ```bash
   git checkout main
   git pull --recurse-submodules
   git checkout feature/your-feature-name
   git rebase main
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

## 💻 Coding Standards

### TypeScript/JavaScript Standards

#### Code Style
- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use **2 spaces** for indentation
- Maximum line length: **100 characters**
- Use **single quotes** for strings (unless template literals needed)

#### Naming Conventions
```typescript
// Classes and Interfaces - PascalCase
class UserService {}
interface UserProfile {}

// Functions and Variables - camelCase
function getUserById() {}
const userName = 'John';

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Private class members - prefix with underscore
class MyClass {
  private _internalState: string;
}

// Type aliases - PascalCase
type UserId = string;
```

#### Best Practices

**1. Type Safety:**
```typescript
// ✅ Good - Explicit types
function getUser(id: string): Promise<User> {
  return userService.findById(id);
}

// ❌ Bad - Using 'any'
function getUser(id: any): Promise<any> {
  return userService.findById(id);
}
```

**2. Error Handling:**
```typescript
// ✅ Good - Proper error handling
async function createUser(data: UserInput): Promise<User> {
  try {
    const user = await userService.create(data);
    return user;
  } catch (error) {
    logger.error('Failed to create user', { error, data });
    throw new UserCreationError('Unable to create user', { cause: error });
  }
}
```

**3. Async/Await:**
```typescript
// ✅ Good - Use async/await
async function fetchUserData(userId: string) {
  const user = await userService.getUser(userId);
  const permissions = await permissionService.getPermissions(userId);
  return { user, permissions };
}

// ❌ Bad - Callback hell
function fetchUserData(userId: string, callback) {
  userService.getUser(userId, (user) => {
    permissionService.getPermissions(userId, (permissions) => {
      callback({ user, permissions });
    });
  });
}
```

**4. Immutability:**
```typescript
// ✅ Good - Immutable operations
const updatedUser = { ...user, name: 'New Name' };
const filteredItems = items.filter(item => item.active);

// ❌ Bad - Mutating objects
user.name = 'New Name';
items.splice(0, 1);
```

### React/Frontend Standards

#### Component Structure
```typescript
// ✅ Good - Functional component with TypeScript
import React from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = React.useState<User | null>(null);
  
  React.useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  const loadUser = async (id: string) => {
    const userData = await userService.getUser(id);
    setUser(userData);
  };
  
  return (
    <div className="user-profile">
      {user && <UserDetails user={user} />}
    </div>
  );
};
```

#### Hooks Guidelines
- Custom hooks start with `use` prefix: `useUserData`, `useAuth`
- Keep hooks focused on single responsibility
- Document complex hooks with JSDoc comments

### Backend/API Standards

#### RESTful API Design
```typescript
// ✅ Good - RESTful endpoints
GET    /api/users              // List users
GET    /api/users/:id          // Get specific user
POST   /api/users              // Create user
PUT    /api/users/:id          // Update user (full)
PATCH  /api/users/:id          // Update user (partial)
DELETE /api/users/:id          // Delete user

// ❌ Bad - Non-RESTful
GET    /api/getUsers
POST   /api/createNewUser
POST   /api/deleteUser/:id
```

#### Response Format
```typescript
// ✅ Good - Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Status Codes
- **200 OK** - Successful GET, PUT, PATCH
- **201 Created** - Successful POST
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing/invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Unexpected error

### Database Standards

#### CosmosDB Conventions
- Use meaningful partition keys (e.g., `tenantId`)
- Prefix document types: `USER_`, `PERMISSION_`, `SETTING_`
- Include `_ts` timestamp for all documents
- Use snake_case for field names in stored data

```typescript
// ✅ Good - Document structure
interface UserDocument {
  id: string;
  type: 'USER';
  tenant_id: string;  // Partition key
  email: string;
  created_at: string;
  updated_at: string;
  _ts: number;
}
```

## 📝 Commit Guidelines

We follow **Conventional Commits** specification for clear, semantic commit messages.

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Scope (Optional)
The scope specifies what part of the codebase is affected:
- `auth` - Authentication service
- `user` - User management service
- `settings` - Service settings service
- `frontend` - Frontend application
- `api` - API changes
- `db` - Database related

### Examples

```bash
# Feature addition
feat(auth): add JWT token refresh endpoint

# Bug fix
fix(user): resolve null pointer in user profile fetch

# Documentation
docs: update API documentation for auth endpoints

# Refactoring
refactor(frontend): simplify user component state management

# Breaking change
feat(api)!: change user API response format

BREAKING CHANGE: User API now returns nested profile object
instead of flat structure. Update client code accordingly.
```

### Commit Best Practices

1. **Atomic commits** - One logical change per commit
2. **Present tense** - "add feature" not "added feature"
3. **Imperative mood** - "change" not "changes" or "changed"
4. **Descriptive subject** - Clear, concise description (max 72 chars)
5. **Body for context** - Explain "why" not "what" (if needed)
6. **Reference issues** - Include issue numbers in footer

**Good commit examples:**
```bash
git commit -m "feat(auth): implement password reset flow"
git commit -m "fix(user): prevent duplicate email registration"
git commit -m "docs: add API examples to README"
git commit -m "test(auth): add integration tests for login"
```

## 🔍 Pull Request Process

### Before Creating PR

1. **Update your branch:**
   ```bash
   git checkout main
   git pull --recurse-submodules
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run all checks:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Update documentation** if needed

4. **Test manually** in your local environment

### PR Title Format

Follow same convention as commits:
```
feat(auth): add JWT token refresh endpoint
fix(user): resolve null pointer in user profile fetch
```

### PR Description Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Related Issues
Fixes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### PR Review Process

1. **Automated checks must pass:**
   - Linting
   - Type checking
   - Unit tests
   - Integration tests
   - Build success

2. **Code review required:**
   - At least 1 approval from team member
   - All review comments addressed
   - No unresolved conversations

3. **Merge strategy:**
   - Use **squash and merge** for feature branches
   - Ensure final commit message follows conventions
   - Delete branch after merge

### Reviewing PRs

As a reviewer:

✅ **Do:**
- Review within 24 hours
- Test changes locally if significant
- Provide constructive feedback
- Ask questions to understand reasoning
- Approve when satisfied

❌ **Don't:**
- Nitpick on personal preferences
- Request changes without explanation
- Approve without reviewing code
- Let PRs sit without feedback

## 🧪 Testing Requirements

### Test Coverage Standards
- **Minimum coverage**: 80% for all services
- **Critical paths**: 100% coverage required
- **New features**: Must include tests

### Test Types

#### Unit Tests
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const result = await userService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
    
    it('should throw error for duplicate email', async () => {
      const userData = { email: 'existing@example.com', name: 'Test' };
      
      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

#### Integration Tests
```typescript
describe('User API Integration', () => {
  it('should create and retrieve user', async () => {
    // Create user
    const createResponse = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);
    
    const userId = createResponse.body.data.id;
    
    // Retrieve user
    const getResponse = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
    
    expect(getResponse.body.data.email).toBe('test@example.com');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- user.service.test.ts

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm run test:integration
```

## 📚 Documentation Standards

### Code Documentation

#### JSDoc Comments
```typescript
/**
 * Retrieves a user by their unique identifier.
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the user object
 * @throws {UserNotFoundError} When user doesn't exist
 * @throws {DatabaseError} When database query fails
 * 
 * @example
 * ```typescript
 * const user = await getUserById('user-123');
 * console.log(user.email);
 * ```
 */
async function getUserById(userId: string): Promise<User> {
  // Implementation
}
```

#### Complex Logic Comments
```typescript
// Calculate the weighted score based on user activity and engagement
// Formula: (activity_count * 0.6) + (engagement_rate * 0.4)
// This favors active users while still considering engagement quality
const weightedScore = (activityCount * 0.6) + (engagementRate * 0.4);
```

### API Documentation

- Use **OpenAPI 3.0** specification
- Document all endpoints with examples
- Include request/response schemas
- Add authentication requirements
- Provide error response examples

### README Documentation

Each service should have a README with:
- Service overview and purpose
- Setup instructions
- Environment variables
- API endpoints (brief)
- Development commands
- Testing guidelines

Use the template in `docs/templates/SERVICE_README.md`.

## 🚀 Release Process

### Version Numbers
Follow **Semantic Versioning** (SemVer):
- **MAJOR**: Breaking changes (2.0.0)
- **MINOR**: New features, backward compatible (1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.1)

### Release Checklist
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. GitHub Actions will handle deployment

## ❓ Questions?

If you have questions about contributing:

1. Check existing documentation in `/docs`
2. Search existing GitHub Issues
3. Create a new issue with `question` label
4. Reach out to maintainers

## 🙏 Thank You!

Your contributions make this project better. We appreciate your time and effort in following these guidelines and helping maintain code quality.

---

**Last Updated**: 2026-01-07  
**Maintained By**: Development Team
