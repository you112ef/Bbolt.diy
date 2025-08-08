import { create } from 'zustand';
import type { MCPConfig, MCPServerTools } from '~/lib/services/mcpService';

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

type Store = {
  isInitialized: boolean;
  settings: MCPSettings;
  serverTools: MCPServerTools;
  error: string | null;
  isUpdatingConfig: boolean;
};

type Actions = {
  initialize: () => Promise<void>;
  updateSettings: (settings: MCPSettings) => Promise<void>;
  checkServersAvailabilities: () => Promise<void>;
};

export const useMCPStore = create<Store & Actions>((set, get) => ({
  isInitialized: false,
  settings: defaultSettings,
  serverTools: {},
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
