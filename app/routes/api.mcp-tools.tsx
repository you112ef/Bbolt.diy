import { json, type ActionFunction, type LoaderFunction } from '@remix-run/cloudflare';
import { COMMUNITY_MCP_TOOLS, DEFAULT_ENABLED_TOOLS, type MCPTool } from '~/lib/mcp/community-tools';

interface MCPToolConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
  enabled: boolean;
  type?: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  envVars?: Record<string, string>;
  requiredEnvVars?: string[];
  requiresAuth?: boolean;
}

interface MCPToolsSettings {
  tools: Record<string, MCPToolConfig>;
  lastUpdated: string;
}

const MCP_TOOLS_SETTINGS_KEY = 'mcp_tools_settings';

// Get MCP tools configuration
export const loader: LoaderFunction = async ({ context }) => {
  try {
    /*
     * In a real implementation, this would be loaded from a database or KV store
     * For now, we'll return the default configuration
     */
    const defaultConfig: MCPToolsSettings = {
      tools: {},
      lastUpdated: new Date().toISOString(),
    };

    // Initialize default tools configuration
    Object.entries(COMMUNITY_MCP_TOOLS).forEach(([name, tool]) => {
      defaultConfig.tools[name] = {
        ...tool,
        id: name,
        name,
        enabled: DEFAULT_ENABLED_TOOLS.includes(name),
        envVars:
          tool.envVars?.reduce(
            (acc, varName) => {
              acc[varName] = '';
              return acc;
            },
            {} as Record<string, string>,
          ) || {},
        requiresAuth: tool.requiresAuth,
      };
    });

    return json(defaultConfig);
  } catch (error) {
    console.error('Error loading MCP tools settings:', error);
    return json({ error: 'Failed to load MCP tools settings' }, { status: 500 });
  }
};

// Update MCP tools configuration
export const action: ActionFunction = async ({ request, context }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { tools } = body as { tools: Record<string, MCPToolConfig> };

    if (!tools || typeof tools !== 'object') {
      return json({ error: 'Invalid tools configuration' }, { status: 400 });
    }

    // Validate tools configuration
    const validatedTools: Record<string, MCPToolConfig> = {};

    for (const [name, toolConfig] of Object.entries(tools)) {
      // Check if tool exists in community tools
      const communityTool = COMMUNITY_MCP_TOOLS[name];

      if (!communityTool) {
        continue; // Skip unknown tools
      }

      // Validate and sanitize configuration
      validatedTools[name] = {
        ...communityTool,
        id: name,
        name,
        enabled: Boolean(toolConfig.enabled),
        envVars: toolConfig.envVars
          ? Object.fromEntries(
              Object.entries(toolConfig.envVars).filter(
                ([key, value]) => communityTool.envVars?.includes(key) && typeof value === 'string',
              ),
            )
          : {},
        requiresAuth: communityTool.requiresAuth,
      };
    }

    const updatedSettings: MCPToolsSettings = {
      tools: validatedTools,
      lastUpdated: new Date().toISOString(),
    };

    /*
     * In a real implementation, this would be saved to a database or KV store
     * For now, we'll just return the validated configuration
     */

    // Update the MCP service with enabled tools
    await updateMCPServiceConfig(validatedTools);

    return json({
      success: true,
      settings: updatedSettings,
      message: 'MCP tools configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating MCP tools settings:', error);
    return json(
      {
        error: 'Failed to update MCP tools settings',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};

// Helper function to update MCP service configuration
async function updateMCPServiceConfig(tools: Record<string, MCPToolConfig>) {
  try {
    // Convert enabled tools to MCP server configuration format
    const mcpServers: Record<string, any> = {};

    Object.entries(tools).forEach(([name, tool]) => {
      if (tool.enabled) {
        mcpServers[name] = {
          type: tool.type || 'stdio',
          command: tool.command,
          args: tool.args || [],
          env: tool.envVars || {},
        };
      }
    });

    /*
     * Update the MCP service configuration
     * This would typically call the MCP service to reload configuration
     */
    const updateResponse = await fetch('/api/mcp-update-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcpServers }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update MCP service configuration');
    }
  } catch (error) {
    console.error('Error updating MCP service configuration:', error);
  }
}
