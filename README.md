# 🚀 Bolt DIY - Advanced AI Development Platform

A comprehensive AI development platform that supports both local and cloud AI models, featuring a web-based development environment, real-time collaboration tools, and multi-platform deployment capabilities.

## ✨ Features

### 🤖 AI Capabilities
- **Multi-Provider Support**: OpenAI, Anthropic, Google, Mistral, Ollama, and more
- **Local AI Models**: Run AI models locally with offline inference
- **Real-time Chat**: Interactive AI conversations with streaming responses
- **AI Agents**: Create and manage AI agents for automated tasks
- **Model Management**: Upload, validate, and manage local AI models

### 🛠️ Development Tools
- **WebContainer Integration**: Run Node.js projects directly in the browser
- **Code Editor**: Advanced code editing with syntax highlighting and autocomplete
- **Terminal**: Integrated terminal for command-line operations
- **File Management**: Complete file system management within the browser
- **Git Integration**: Full Git workflow with repository management

### 🌐 Multi-Platform Support
- **Web Application**: Progressive Web App (PWA) with offline support
- **Desktop Application**: Electron-based desktop app
- **Mobile Applications**: Android and iOS apps via Capacitor
- **Docker Container**: Containerized deployment for any environment

### 🔧 State Management
- **Zustand Stores**: Efficient state management for AI models and chat
- **Persistent Storage**: IndexedDB for chat history and project snapshots
- **Real-time Updates**: Live synchronization across all components

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- pnpm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/you112ef/Bbolt.diy.git
cd Bbolt.diy

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
MISTRAL_API_KEY=your_mistral_key

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
AUTH_SECRET=your_auth_secret
SESSION_SECRET=your_session_secret
```

## 🏗️ CI/CD Pipeline

This project includes comprehensive CI/CD workflows for automated deployment:

### 📋 Available Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`/`develop` branches, Pull Requests
- **Builds**:
  - 🌐 **Web App**: Builds and deploys to Cloudflare Pages
  - 🐳 **Docker Image**: Builds and pushes to GitHub Container Registry
  - 📱 **Android APK**: Creates APK using Bubblewrap (PWA to APK)

#### 2. **Release Pipeline** (`.github/workflows/release.yml`)
- **Triggers**: Push tags starting with `v*` (e.g., `v1.0.0`)
- **Actions**:
  - Creates GitHub Release with APK attachment
  - Pushes Docker image with version tags
  - Generates release notes automatically

### 🔑 Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Cloudflare Pages
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id

# GitHub Token (automatically available)
GITHUB_TOKEN=your_github_token
```

### 🚀 Deployment Options

#### 1. **Web Deployment (Cloudflare Pages)**
```bash
# Automatic deployment on push to main branch
# Access your app at: https://your-project.pages.dev
```

#### 2. **Docker Deployment**
```bash
# Pull the latest image
docker pull ghcr.io/you112ef/Bbolt.diy:latest

# Run the container
docker run -p 3000:3000 ghcr.io/you112ef/Bbolt.diy:latest

# Access at: http://localhost:3000
```

#### 3. **Android APK**
- Download APK from GitHub Actions artifacts
- Enable "Install from unknown sources" in Android settings
- Install the APK file

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm typecheck        # Run TypeScript type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues

# Testing
pnpm test             # Run tests
pnpm test:run         # Run tests without watch mode
pnpm test:coverage    # Run tests with coverage

# Mobile Development
pnpm capacitor:build  # Build mobile apps
pnpm capacitor:run:android  # Run on Android
pnpm capacitor:run:ios      # Run on iOS

# Desktop Development
pnpm electron:build   # Build desktop app
pnpm electron:dev     # Start Electron development

# Docker
pnpm docker:build     # Build Docker image
pnpm docker:run       # Run Docker container
```

## 📁 Project Structure

```
├── app/                    # Main application code
│   ├── components/         # React components
│   ├── lib/               # Utilities and libraries
│   ├── routes/            # Remix routes
│   └── types/             # TypeScript type definitions
├── enhanced/              # Enhanced features
│   ├── ai-agents/         # AI agents implementation
│   └── models/            # AI model providers
├── electron/              # Desktop app configuration
├── android/               # Mobile app configuration
├── .github/workflows/     # CI/CD workflows
├── Dockerfile             # Docker configuration
└── package.json           # Project dependencies
```

## 🔧 Configuration Files

### Vite Configuration (`vite.config.ts`)
- Optimized for Cloudflare Pages deployment
- Sourcemap disabled for production builds
- Chunk size optimization
- Node.js polyfills for browser compatibility

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking
- Sourcemap generation disabled
- Performance optimizations
- Path mapping for clean imports

### Cloudflare Configuration (`wrangler.toml`)
- Simplified configuration for Pages deployment
- Environment-specific settings
- Security headers and caching rules
- SPA routing configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/you112ef/Bbolt.diy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/you112ef/Bbolt.diy/discussions)
- **Documentation**: [Project Wiki](https://github.com/you112ef/Bbolt.diy/wiki)

## 🙏 Acknowledgments

- [Remix](https://remix.run/) - Full-stack web framework
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting platform
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) - PWA to APK conversion
- [WebContainer](https://webcontainers.io/) - Browser-based Node.js runtime

---

**Made with ❤️ by the Bolt DIY Team**
