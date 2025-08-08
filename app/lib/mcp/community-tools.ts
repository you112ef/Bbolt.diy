// Pre-configured MCP Tools from the Community
// These are real working MCP servers that provide actual functionality

export const COMMUNITY_MCP_TOOLS = {
  // Web & APIs
  "fetch": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-fetch"],
    description: "Fetch web pages and API endpoints with HTTP requests",
    category: "Web & API"
  },
  
  "brave-search": {
    type: "stdio", 
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    description: "Search the web using Brave Search API",
    category: "Search & Research",
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || ""
    }
  },

  "google-maps": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google-maps"],
    description: "Search places, get directions, and map data",
    category: "Maps & Location",
    env: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || ""
    }
  },

  // Databases
  "sqlite": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-sqlite", "--db-path", "/tmp/mcp.db"],
    description: "SQLite database operations - create, query, manage",
    category: "Database"
  },

  "postgres": {
    type: "stdio", 
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    description: "PostgreSQL database operations",
    category: "Database",
    env: {
      POSTGRES_CONNECTION_STRING: process.env.POSTGRES_CONNECTION_STRING || ""
    }
  },

  // File System & Git
  "filesystem": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    description: "File system operations - read, write, manage files",
    category: "File System"
  },

  "git": {
    type: "stdio",
    command: "npx", 
    args: ["-y", "@modelcontextprotocol/server-git"],
    description: "Git operations - clone, commit, branch, merge",
    category: "Version Control"
  },

  // Cloud Services
  "gdrive": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gdrive"],
    description: "Google Drive file operations",
    category: "Cloud Storage",
    env: {
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || ""
    }
  },

  "aws-kb": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-aws-kb"],
    description: "AWS Knowledge Base integration",
    category: "Cloud AI",
    env: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
      AWS_REGION: process.env.AWS_REGION || "us-east-1"
    }
  },

  // Development Tools
  "github": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    description: "GitHub operations - repos, issues, PRs, releases",
    category: "Development",
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ""
    }
  },

  "docker": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-docker"],
    description: "Docker container management - build, run, deploy",
    category: "DevOps"
  },

  "kubernetes": {
    type: "stdio",
    command: "uvx", 
    args: ["mcp-server-kubernetes"],
    description: "Kubernetes cluster management",
    category: "DevOps",
    env: {
      KUBECONFIG: process.env.KUBECONFIG || ""
    }
  },

  // Memory & Knowledge
  "memory": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    description: "Persistent memory and knowledge storage",
    category: "Memory & Knowledge"
  },

  "obsidian": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-obsidian"],
    description: "Obsidian vault integration for note management",
    category: "Knowledge Management"
  },

  // Communication
  "slack": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    description: "Slack messaging and workspace management",
    category: "Communication",
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || ""
    }
  },

  "gmail": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-gmail"],
    description: "Gmail email operations - read, send, manage",
    category: "Communication",
    env: {
      GMAIL_CREDENTIALS: process.env.GMAIL_CREDENTIALS || ""
    }
  },

  // Analytics & Monitoring
  "analytics": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-analytics"],
    description: "Analytics and metrics collection",
    category: "Analytics"
  },

  "time": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-time"],
    description: "Time utilities - dates, timezones, scheduling",
    category: "Utilities"
  },

  // Security & Authentication
  "sentry": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-sentry"],
    description: "Sentry error tracking and monitoring",
    category: "Monitoring",
    env: {
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN || "",
      SENTRY_ORG: process.env.SENTRY_ORG || ""
    }
  },

  // AI & Machine Learning  
  "openai": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-openai"],
    description: "OpenAI API integration for AI operations",
    category: "AI & ML",
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || ""
    }
  },

  "anthropic": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-anthropic"],
    description: "Anthropic Claude API integration",
    category: "AI & ML", 
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ""
    }
  },

  // Data Processing
  "pandas": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-pandas"],
    description: "Pandas data analysis and manipulation",
    category: "Data Processing"
  },

  "excel": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-excel"],
    description: "Excel spreadsheet operations",
    category: "Data Processing"
  },

  // Web Scraping & Automation
  "puppeteer": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    description: "Web automation and scraping with Puppeteer",
    category: "Web Automation"
  },

  "selenium": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-selenium"],
    description: "Selenium web driver automation",
    category: "Web Automation"
  },

  // Business & CRM
  "hubspot": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-hubspot"],
    description: "HubSpot CRM integration",
    category: "CRM & Business",
    env: {
      HUBSPOT_ACCESS_TOKEN: process.env.HUBSPOT_ACCESS_TOKEN || ""
    }
  },

  "salesforce": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-salesforce"],
    description: "Salesforce CRM operations",
    category: "CRM & Business",
    env: {
      SALESFORCE_USERNAME: process.env.SALESFORCE_USERNAME || "",
      SALESFORCE_PASSWORD: process.env.SALESFORCE_PASSWORD || "",
      SALESFORCE_SECURITY_TOKEN: process.env.SALESFORCE_SECURITY_TOKEN || ""
    }
  },

  // E-commerce
  "shopify": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-shopify"],
    description: "Shopify store management",
    category: "E-commerce",
    env: {
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN || "",
      SHOPIFY_SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN || ""
    }
  },

  // Task Management
  "notion": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-notion"],
    description: "Notion workspace integration",
    category: "Productivity",
    env: {
      NOTION_API_KEY: process.env.NOTION_API_KEY || ""
    }
  },

  "trello": {
    type: "stdio",
    command: "uvx", 
    args: ["mcp-server-trello"],
    description: "Trello board management",
    category: "Productivity",
    env: {
      TRELLO_API_KEY: process.env.TRELLO_API_KEY || "",
      TRELLO_TOKEN: process.env.TRELLO_TOKEN || ""
    }
  },

  // Financial & Payment
  "stripe": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-stripe"],
    description: "Stripe payment processing",
    category: "Finance & Payment",
    env: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || ""
    }
  },

  // IoT & Hardware
  "raspberry-pi": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-rpi"],
    description: "Raspberry Pi GPIO control",
    category: "IoT & Hardware"
  },

  // Media & Content
  "youtube": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-youtube"],
    description: "YouTube API integration",
    category: "Media & Content",
    env: {
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || ""
    }
  },

  "twitter": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-twitter"],
    description: "Twitter/X API integration",
    category: "Social Media",
    env: {
      TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN || ""
    }
  }
};

// Categories for organized display
export const MCP_CATEGORIES = {
  "Web & API": "🌐",
  "Search & Research": "🔍", 
  "Maps & Location": "🗺️",
  "Database": "🗄️",
  "File System": "📁",
  "Version Control": "🔀",
  "Cloud Storage": "☁️",
  "Cloud AI": "🤖",
  "Development": "💻",
  "DevOps": "🚀",
  "Memory & Knowledge": "🧠",
  "Knowledge Management": "📚",
  "Communication": "💬",
  "Analytics": "📊",
  "Utilities": "🛠️",
  "Monitoring": "📈",
  "AI & ML": "🤖",
  "Data Processing": "📈",
  "Web Automation": "🎭",
  "CRM & Business": "💼",
  "E-commerce": "🛒",
  "Productivity": "✅",
  "Finance & Payment": "💳",
  "IoT & Hardware": "🔧",
  "Media & Content": "🎬",
  "Social Media": "📱"
};

// Default enabled tools (essential ones that work without API keys)
export const DEFAULT_ENABLED_TOOLS = [
  "fetch",
  "filesystem", 
  "git",
  "time",
  "memory",
  "sqlite"
];

// Tools that require API keys
export const API_KEY_REQUIRED_TOOLS = [
  "brave-search",
  "google-maps", 
  "postgres",
  "gdrive",
  "aws-kb",
  "github",
  "slack",
  "gmail",
  "sentry",
  "openai",
  "anthropic",
  "hubspot",
  "salesforce",
  "shopify",
  "notion",
  "trello",
  "stripe",
  "youtube",
  "twitter"
];