# 🤝 Contributing to Bolt DIY

Thank you for your interest in contributing to Bolt DIY! This document provides guidelines and best practices for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Development Setup](#development-setup)
- [Package Manager Guidelines](#package-manager-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Review Process](#review-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9.14.4 (automatically managed)
- Git

### Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/Bbolt.diy.git
cd Bbolt.diy

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 🔄 Pull Request Guidelines

### 📝 PR Title Conventions

**🚫 Invalid PR Titles:**
```
Implement all application features and replace mocks
Fix the bug in the chat component
Add new AI model support
```

**✅ Valid PR Titles (Conventional Commits):**
```
feat: implement all application features and replace mocks
fix: resolve chat component message display issue
feat: add support for new AI model providers
docs: update README with new deployment instructions
test: add unit tests for AI model validation
refactor: improve state management with Zustand
```

### 📋 Required PR Title Format

All PR titles **MUST** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 🏷️ Type Categories

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add dark mode support` |
| `fix` | Bug fix | `fix: resolve authentication issue` |
| `docs` | Documentation changes | `docs: update API documentation` |
| `style` | Code style changes (formatting, etc.) | `style: format code with prettier` |
| `refactor` | Code refactoring | `refactor: extract utility functions` |
| `test` | Adding or updating tests | `test: add unit tests for auth module` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `perf` | Performance improvements | `perf: optimize bundle size` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |
| `build` | Build system changes | `build: update Vite configuration` |
| `revert` | Revert previous changes | `revert: remove experimental feature` |

#### 🎯 Scope (Optional)

You can specify a scope to indicate which part of the codebase is affected:

```
feat(chat): add message threading support
fix(ai): resolve model loading timeout
docs(deploy): update Cloudflare Pages setup
```

#### 📝 Description Guidelines

- **Use imperative mood**: "add" not "added" or "adds"
- **Don't capitalize the first letter**
- **No period at the end**
- **Keep it concise but descriptive**

**✅ Good:**
```
feat: add real-time collaboration features
fix: resolve memory leak in AI model loading
docs: update deployment instructions for Cloudflare
```

**❌ Bad:**
```
feat: Added real-time collaboration features.
fix: Resolves memory leak in AI model loading
docs: Updated deployment instructions for Cloudflare.
```

### 📋 PR Description Template

Use this template when creating PRs:

```markdown
## 📋 Description

Brief description of the changes made.

## 🎯 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)

## 🔧 Changes Made

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## 🧪 Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No breaking changes introduced

## 📸 Screenshots (if applicable)

Add screenshots for UI changes.

## 🔗 Related Issues

Closes #123
Related to #456

## ✅ Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

## 💬 Commit Message Conventions

### 📝 Commit Message Format

Follow the same [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 🔧 Commit Message Examples

```bash
# Feature
git commit -m "feat: add support for local AI models"

# Bug fix
git commit -m "fix: resolve chat message duplication issue"

# Documentation
git commit -m "docs: update README with new features"

# Refactoring
git commit -m "refactor: improve state management architecture"

# Test
git commit -m "test: add unit tests for AI model validation"

# Chore
git commit -m "chore: update dependencies to latest versions"
```

### 🚫 Common Mistakes to Avoid

**❌ Don't:**
```bash
git commit -m "fixed bug"
git commit -m "Added new feature"
git commit -m "update docs"
git commit -m "WIP"
git commit -m "."
```

**✅ Do:**
```bash
git commit -m "fix: resolve authentication timeout issue"
git commit -m "feat: add dark mode toggle"
git commit -m "docs: update API documentation"
git commit -m "feat: implement user authentication system"
git commit -m "fix: correct typo in error message"
```

## 📦 Package Manager Guidelines

### 🎯 pnpm Version Management

This project uses **pnpm 9.14.4** as the package manager. The version is managed centrally to avoid conflicts.

#### ✅ Correct Setup

**package.json:**
```json
{
  "packageManager": "pnpm@9.14.4"
}
```

**GitHub Actions:**
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    run_install: false
```

#### ❌ Avoid These Patterns

**Don't specify version in multiple places:**
```yaml
# ❌ Wrong - version conflict
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 9.14.4  # This conflicts with package.json
    run_install: false
```

**Don't use npm install -g pnpm:**
```yaml
# ❌ Wrong - inconsistent versioning
- name: Install pnpm
  run: npm install -g pnpm
```

#### 🔧 Version Update Process

When updating pnpm version:

1. **Update package.json:**
   ```json
   {
     "packageManager": "pnpm@9.15.0"
   }
   ```

2. **Update lockfile:**
   ```bash
   pnpm install
   ```

3. **Test locally:**
   ```bash
   pnpm run test
   pnpm run build
   ```

4. **Commit changes:**
   ```bash
   git commit -m "chore: update pnpm to 9.15.0"
   ```

### 📋 Package Management Best Practices

#### ✅ Do's
- Use `pnpm install --frozen-lockfile` in CI/CD
- Keep `pnpm-lock.yaml` in version control
- Use exact versions for critical dependencies
- Update dependencies regularly

#### ❌ Don'ts
- Don't use `npm` or `yarn` in this project
- Don't manually edit `pnpm-lock.yaml`
- Don't use `^` or `~` for critical dependencies
- Don't ignore lockfile changes

## 🧪 Testing Guidelines

### 📋 Test Requirements

- **Unit Tests**: Required for all new features
- **Integration Tests**: Required for API changes
- **E2E Tests**: Required for critical user flows
- **Manual Testing**: Required for UI changes

### 🚀 Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- src/components/Chat.test.tsx

# Run tests matching pattern
pnpm test -- -t "authentication"
```

### 📝 Writing Tests

#### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { Chat } from '../Chat';

describe('Chat Component', () => {
  it('should render chat interface', () => {
    render(<Chat />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    render(<Chat />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(input, 'Hello, AI!');
    await userEvent.click(button);
    
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
  });
});
```

## 🎨 Code Style

### 📋 Style Guidelines

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic formatting
- **Import Order**: Alphabetical, grouped by type

### 🔧 Code Quality Tools

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm typecheck
```

### 📝 Code Style Examples

#### ✅ Good Code
```typescript
import React, { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';

import { chatStore, chatActions } from '~/lib/stores/chat';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

interface ChatProps {
  initialMessage?: string;
  onMessageSend?: (message: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ 
  initialMessage = '', 
  onMessageSend 
}) => {
  const [input, setInput] = useState(initialMessage);
  const { messages, isLoading } = chatStore();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onMessageSend?.(input);
    setInput('');
  }, [input, isLoading, onMessageSend]);

  return (
    <div className="chat-container">
      {/* Component JSX */}
    </div>
  );
};
```

#### ❌ Bad Code
```typescript
import { chatStore } from '~/lib/stores/chat'
import React from 'react'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

export const Chat = ({initialMessage, onMessageSend}) => {
  const [input, setInput] = React.useState(initialMessage || '')
  const {messages, isLoading} = chatStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onMessageSend && onMessageSend(input)
    setInput('')
  }

  return <div className="chat-container">{/* JSX */}</div>
}
```

## 🔍 Review Process

### 📋 Review Checklist

Before submitting a PR, ensure:

- [ ] **Title follows conventional commits format**
- [ ] **Description is clear and complete**
- [ ] **Code follows style guidelines**
- [ ] **Tests are included and passing**
- [ ] **Documentation is updated**
- [ ] **No breaking changes (or properly documented)**
- [ ] **Performance impact is considered**
- [ ] **Security implications are reviewed**

### 🔄 Review Process Steps

1. **Self-Review**: Review your own code first
2. **Automated Checks**: Ensure CI/CD passes
3. **Peer Review**: Request review from team members
4. **Address Feedback**: Respond to review comments
5. **Final Approval**: Get approval from maintainers
6. **Merge**: Merge after approval

### 💬 Review Comments

When reviewing code:

- **Be constructive and specific**
- **Explain the reasoning behind suggestions**
- **Use the review template**
- **Focus on code quality and maintainability**

## 🚀 Getting Help

### 📚 Resources

- [Project Documentation](README.md)
- [CI/CD Workflows](docs/CI-CD-WORKFLOWS.md)
- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

### 💬 Support Channels

- **Issues**: [GitHub Issues](https://github.com/you112ef/Bbolt.diy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/you112ef/Bbolt.diy/discussions)
- **Wiki**: [Project Wiki](https://github.com/you112ef/Bbolt.diy/wiki)

### 🐛 Reporting Issues

When reporting issues:

1. **Use the issue template**
2. **Provide detailed reproduction steps**
3. **Include error messages and logs**
4. **Add screenshots if applicable**
5. **Specify your environment details**

## 🎉 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

---

**Thank you for contributing to Bolt DIY! 🚀**

**Together, we're building the future of AI development platforms.**
