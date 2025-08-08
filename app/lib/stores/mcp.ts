import { create } from 'zustand';
import type { MCPConfig, MCPServerTools } from '~/lib/services/mcpService';
import { COMMUNITY_MCP_TOOLS, DEFAULT_ENABLED_TOOLS, type MCPTool } from '~/lib/mcp/community-tools';

const MCP_SETTINGS_KEY = 'mcp_settings';
const isBrowser = typeof window !== 'undefined';

// Env-driven default MCP servers (build-time via Vite)
const GENSPARK_URL = (import.meta as any).env?.VITE_GENSPARK_URL as string | undefined;
const GENSPARK_TOKEN = (import.meta as any).env?.VITE_GENSPARK_TOKEN as string | undefined;

type MCPSettings = {
  mcpConfig: MCPConfig;
  maxLLMSteps: number;
};

// Compose default servers from env (no-op if not set)
function getDefaultServersFromEnv(): MCPConfig['mcpServers'] {
  const servers: MCPConfig['mcpServers'] = {};

  if (GENSPARK_URL) {
    servers.genspark = {
      type: 'streamable-http',
      url: GENSPARK_URL,
      headers: GENSPARK_TOKEN ? { Authorization: `Bearer ${GENSPARK_TOKEN}` } : undefined,
    } as any;
  }

  return servers;
}

const defaultSettings = {
  maxLLMSteps: 5,
  mcpConfig: {
    mcpServers: {
      ...getDefaultServersFromEnv(),
    },
  },
} satisfies MCPSettings;

interface CommunityToolConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
  enabled: boolean;
  type?: string;
  command?: string;
  args?: string[];
  envVars?: Record<string, string>;
  requiredEnvVars?: string[];
  requiresAuth?: boolean;
}

type Store = {
  isInitialized: boolean;
  settings: MCPSettings;
  serverTools: MCPServerTools;
  mcpServers: Record<string, any>;
  serverConnections: Record<string, 'connected' | 'disconnected' | 'connecting'>;
  communityTools: Record<string, CommunityToolConfig>;
  error: string | null;
  isUpdatingConfig: boolean;
};

type Actions = {
  initialize: () => Promise<void>;
  updateSettings: (settings: MCPSettings) => Promise<void>;
  checkServersAvailabilities: () => Promise<void>;
  loadCommunityTools: () => Promise<void>;
  updateCommunityTool: (toolName: string, updates: Partial<CommunityToolConfig>) => Promise<void>;
  saveCommunityTools: () => Promise<void>;
};

export const useMCPStore = create<Store & Actions>((set, get) => ({
  isInitialized: false,
  settings: defaultSettings,
  serverTools: {},
  mcpServers: {},
  serverConnections: {},
  communityTools: {},
  error: null,
  isUpdatingConfig: false,
  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    if (isBrowser) {
      const savedConfig = localStorage.getItem(MCP_SETTINGS_KEY);

      if (savedConfig) {
        try {
          const settings = JSON.parse(savedConfig) as MCPSettings;
          const serverTools = await updateServerConfig(settings.mcpConfig);
          set(() => ({ settings, serverTools }));
        } catch (error) {
          console.error('Error parsing saved mcp config:', error);
          set(() => ({
            error: `Error parsing saved mcp config: ${error instanceof Error ? error.message : String(error)}`,
          }));
        }
      } else {
        // Seed default env servers at first run
        localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(defaultSettings));
        const serverTools = await updateServerConfig(defaultSettings.mcpConfig);
        set(() => ({ serverTools }));
      }
    }

    set(() => ({ isInitialized: true }));
  },
  updateSettings: async (newSettings: MCPSettings) => {
    if (get().isUpdatingConfig) {
      return;
    }

    try {
      set(() => ({ isUpdatingConfig: true }));

      const serverTools = await updateServerConfig(newSettings.mcpConfig);

      if (isBrowser) {
        localStorage.setItem(MCP_SETTINGS_KEY, JSON.stringify(newSettings));
      }

      set(() => ({ settings: newSettings, serverTools }));
    } catch (error) {
      throw error;
    } finally {
      set(() => ({ isUpdatingConfig: false }));
    }
  },
  checkServersAvailabilities: async () => {
    const response = await fetch('/api/mcp-check', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const serverTools = (await response.json()) as MCPServerTools;

    set(() => ({ serverTools }));
  },
  
  loadCommunityTools: async () => {
    try {
      const response = await fetch('/api/mcp-tools');
      if (response.ok) {
        const data = await response.json() as { success: boolean; tools?: Record<string, CommunityToolConfig> };
        set(() => ({ communityTools: data.tools || {} }));
      } else {
        // Initialize with default configuration
        const defaultTools: Record<string, CommunityToolConfig> = {};
        
        Object.entries(COMMUNITY_MCP_TOOLS).forEach(([name, tool]) => {
          const mcpTool = tool as any; // Type assertion for community tools
          defaultTools[name] = {
            id: name,
            name,
            description: mcpTool.description,
            category: mcpTool.category,
            // Do not enable STDIO tools by default in browser/edge runtimes
            enabled: DEFAULT_ENABLED_TOOLS.includes(name) && mcpTool.type !== 'stdio',
            type: mcpTool.type || 'stdio',
            command: mcpTool.command,
            args: mcpTool.args,
            envVars: mcpTool.envVars?.reduce((acc: Record<string, string>, varName: string) => {
              acc[varName] = '';
              return acc;
            }, {} as Record<string, string>) || {},
            requiredEnvVars: mcpTool.envVars,
            requiresAuth: mcpTool.requiresAuth,
          };
        });
        
        set(() => ({ communityTools: defaultTools }));
      }
    } catch (error) {
      console.error('Error loading community tools:', error);
      set(() => ({ error: `Failed to load community tools: ${error instanceof Error ? error.message : String(error)}` }));
    }
  },
  
  updateCommunityTool: async (toolName: string, updates: Partial<CommunityToolConfig>) => {
    const { communityTools } = get();
    const updatedTools = {
      ...communityTools,
      [toolName]: {
        ...communityTools[toolName],
        ...updates
      }
    };
    
    set(() => ({ communityTools: updatedTools }));
  },
  
  saveCommunityTools: async () => {
    const { communityTools } = get();
    
    try {
      const response = await fetch('/api/mcp-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: communityTools })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(typeof errorData === 'object' && errorData && 'error' in errorData && typeof errorData.error === 'string' ? errorData.error : 'Failed to save community tools');
      }
      
      // Update MCP configuration with enabled tools
      await generateMCPConfigFromCommunityTools(communityTools);
      
    } catch (error) {
      console.error('Error saving community tools:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  },
}));

async function updateServerConfig(config: MCPConfig) {
  const response = await fetch('/api/mcp-update-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as MCPServerTools;

  return data;
}

// Helper function to generate MCP config from community tools
async function generateMCPConfigFromCommunityTools(tools: Record<string, CommunityToolConfig>) {
  const mcpServers: Record<string, any> = {};
  
  Object.entries(tools).forEach(([name, tool]) => {
    // Skip stdio tools when running from the browser/edge runtime
    if (tool.enabled && tool.type !== 'stdio') {
      mcpServers[name] = {
        type: tool.type || 'stdio',
        command: tool.command || '',
        args: tool.args || [],
        env: tool.envVars || {}
      };
    }
  });

  // Update the MCP service configuration
  try {
    const response = await fetch('/api/mcp-update-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcpServers })
    });

    if (!response.ok) {
      console.error('Failed to update MCP service configuration');
    }
  } catch (error) {
    console.error('Error updating MCP service configuration:', error);
  }
}
