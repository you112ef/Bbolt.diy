// Pre-configured MCP Tools from the Community
// These are real working MCP servers that provide actual functionality

export interface MCPTool {
  type: "stdio" | "sse" | "streamable-http";
  command: string;
  args: string[];
  description: string;
  category: string;
  envVars?: string[];
  requiresAuth?: boolean;
}

export interface MCPToolConfig extends MCPTool {
  name: string;
  enabled: boolean;
  env?: Record<string, string>;
}

export const COMMUNITY_MCP_TOOLS: Record<string, MCPTool> = {
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
    envVars: ["BRAVE_API_KEY"],
    requiresAuth: true
  },

  "google-maps": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google-maps"],
    description: "Search places, get directions, and map data",
    category: "Maps & Location",
    envVars: ["GOOGLE_MAPS_API_KEY"],
    requiresAuth: true
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
    envVars: ["POSTGRES_CONNECTION_STRING"],
    requiresAuth: true
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
    envVars: ["GOOGLE_APPLICATION_CREDENTIALS"],
    requiresAuth: true
  },

  "aws-kb": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-aws-kb"],
    description: "AWS Knowledge Base integration",
    category: "Cloud AI",
    envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
    requiresAuth: true
  },

  // Development Tools
  "github": {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    description: "GitHub operations - repos, issues, PRs, releases",
    category: "Development",
    envVars: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    requiresAuth: true
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
    envVars: ["KUBECONFIG"],
    requiresAuth: true
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
    envVars: ["SLACK_BOT_TOKEN"],
    requiresAuth: true
  },

  "gmail": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-gmail"],
    description: "Gmail email operations - read, send, manage",
    category: "Communication",
    envVars: ["GMAIL_CREDENTIALS"],
    requiresAuth: true
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
    envVars: ["SENTRY_AUTH_TOKEN", "SENTRY_ORG"],
    requiresAuth: true
  },

  // AI & Machine Learning  
  "openai": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-openai"],
    description: "OpenAI API integration for AI operations",
    category: "AI & ML",
    envVars: ["OPENAI_API_KEY"],
    requiresAuth: true
  },

  "anthropic": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-anthropic"],
    description: "Anthropic Claude API integration",
    category: "AI & ML",
    envVars: ["ANTHROPIC_API_KEY"],
    requiresAuth: true
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
    envVars: ["HUBSPOT_ACCESS_TOKEN"],
    requiresAuth: true
  },

  "salesforce": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-salesforce"],
    description: "Salesforce CRM operations",
    category: "CRM & Business",
    envVars: ["SALESFORCE_USERNAME", "SALESFORCE_PASSWORD", "SALESFORCE_SECURITY_TOKEN"],
    requiresAuth: true
  },

  // E-commerce
  "shopify": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-shopify"],
    description: "Shopify store management",
    category: "E-commerce",
    envVars: ["SHOPIFY_ACCESS_TOKEN", "SHOPIFY_SHOP_DOMAIN"],
    requiresAuth: true
  },

  // Task Management
  "notion": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-notion"],
    description: "Notion workspace integration",
    category: "Productivity",
    envVars: ["NOTION_API_KEY"],
    requiresAuth: true
  },

  "trello": {
    type: "stdio",
    command: "uvx", 
    args: ["mcp-server-trello"],
    description: "Trello board management",
    category: "Productivity",
    envVars: ["TRELLO_API_KEY", "TRELLO_TOKEN"],
    requiresAuth: true
  },

  // Financial & Payment
  "stripe": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-stripe"],
    description: "Stripe payment processing",
    category: "Finance & Payment",
    envVars: ["STRIPE_SECRET_KEY"],
    requiresAuth: true
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
    envVars: ["YOUTUBE_API_KEY"],
    requiresAuth: true
  },

  "twitter": {
    type: "stdio",
    command: "uvx",
    args: ["mcp-server-twitter"],
    description: "Twitter/X API integration",
    category: "Social Media",
    envVars: ["TWITTER_BEARER_TOKEN"],
    requiresAuth: true
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

// Helper functions
export function getToolsByCategory(category: string): string[] {
  return Object.entries(COMMUNITY_MCP_TOOLS)
    .filter(([_, tool]) => tool.category === category)
    .map(([name, _]) => name);
}

export function getRequiredEnvVars(toolName: string): string[] {
  const tool = COMMUNITY_MCP_TOOLS[toolName];
  return tool?.envVars || [];
}

export function toolRequiresAuth(toolName: string): boolean {
  const tool = COMMUNITY_MCP_TOOLS[toolName];
  return tool?.requiresAuth || false;
}

// Default enabled tools (empty to stop all by default)
export const DEFAULT_ENABLED_TOOLS: string[] = [];

// Tools that require API keys or authentication
export const AUTH_REQUIRED_TOOLS = Object.entries(COMMUNITY_MCP_TOOLS)
  .filter(([_, tool]) => tool.requiresAuth)
  .map(([name, _]) => name);

// All available tool names
export const ALL_TOOL_NAMES = Object.keys(COMMUNITY_MCP_TOOLS);

// Get all categories
export const ALL_CATEGORIES = [...new Set(Object.values(COMMUNITY_MCP_TOOLS).map(tool => tool.category))];