import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  COMMUNITY_MCP_TOOLS, 
  MCP_CATEGORIES, 
  DEFAULT_ENABLED_TOOLS,
  AUTH_REQUIRED_TOOLS,
  getToolsByCategory,
  getRequiredEnvVars,
  toolRequiresAuth,
  type MCPToolConfig,
  type MCPTool
} from '~/lib/mcp/community-tools';
import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui/IconButton';

interface MCPToolsManagerProps {
  className?: string;
}

interface ToolConfigState {
  name: string;
  type: "stdio" | "sse" | "http";
  command: string;
  args: string[];
  description: string;
  category: string;
  enabled: boolean;
  envVars?: Record<string, string>;
  requiresAuth?: boolean;
}

export const MCPToolsManager = memo(({ className }: MCPToolsManagerProps) => {
  const [tools, setTools] = useState<Record<string, ToolConfigState>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // Initialize tools state
  useEffect(() => {
    const initialTools: Record<string, ToolConfigState> = {};
    
    Object.entries(COMMUNITY_MCP_TOOLS).forEach(([name, tool]) => {
      initialTools[name] = {
        ...tool,
        name,
        enabled: DEFAULT_ENABLED_TOOLS.includes(name),
        envVars: tool.envVars?.reduce((acc, varName) => {
          acc[varName] = '';
          return acc;
        }, {} as Record<string, string>) || {}
      };
    });
    
    setTools(initialTools);
  }, []);

  // Filter tools based on category, search, and enabled status
  const filteredTools = Object.entries(tools).filter(([name, tool]) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnabled = !showOnlyEnabled || tool.enabled;
    
    return matchesCategory && matchesSearch && matchesEnabled;
  });

  // Get unique categories
  const categories = ['all', ...Object.keys(MCP_CATEGORIES)];

  const toggleTool = (toolName: string) => {
    setTools(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        enabled: !prev[toolName].enabled
      }
    }));
  };

  const updateToolEnvVar = (toolName: string, varName: string, value: string) => {
    setTools(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        envVars: {
          ...prev[toolName].envVars,
          [varName]: value
        }
      }
    }));
  };

  const enabledCount = Object.values(tools).filter(tool => tool.enabled).length;
  const totalCount = Object.keys(tools).length;

  return (
    <div className={classNames('mcp-tools-manager', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">
            MCP Community Tools
          </h2>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            {enabledCount} of {totalCount} tools enabled
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
            <input
              type="checkbox"
              checked={showOnlyEnabled}
              onChange={(e) => setShowOnlyEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor rounded focus:ring-blue-500"
            />
            Show enabled only
          </label>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-bolt-elements-textPrimary"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {Object.entries(MCP_CATEGORIES).map(([category, emoji]) => (
            <option key={category} value={category}>
              {emoji} {category}
            </option>
          ))}
        </select>
      </div>

      {/* Tools grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredTools.map(([name, tool]) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={classNames(
                'bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 transition-all duration-200',
                tool.enabled 
                  ? 'ring-2 ring-blue-500/20 border-blue-500/30' 
                  : 'hover:border-bolt-elements-borderColorActive'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {MCP_CATEGORIES[tool.category as keyof typeof MCP_CATEGORIES] || '🔧'}
                    </span>
                    <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                      {name}
                    </h3>
                    {tool.requiresAuth && (
                      <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                        API Key Required
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                      {tool.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-bolt-elements-textSecondary mb-3">
                    {tool.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <span>Command: {tool.command}</span>
                    <span>•</span>
                    <span>Type: {tool.type}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {tool.requiresAuth && (
                    <IconButton
                      icon="i-ph-gear-duotone"
                      size="sm"
                      title="Configure environment variables"
                      onClick={() => setExpandedTool(expandedTool === name ? null : name)}
                    />
                  )}
                  
                  <button
                    onClick={() => toggleTool(name)}
                    className={classNames(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      tool.enabled 
                        ? 'bg-blue-600' 
                        : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={classNames(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        tool.enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
              
              {/* Environment variables configuration */}
              <AnimatePresence>
                {expandedTool === name && tool.envVars && Object.keys(tool.envVars).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-bolt-elements-borderColor"
                  >
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3">
                      Environment Variables
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(tool.envVars).map(([varName, value]) => (
                        <div key={varName}>
                          <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                            {varName}
                          </label>
                          <input
                            type="password"
                            value={value}
                            onChange={(e) => updateToolEnvVar(name, varName, e.target.value)}
                            placeholder={`Enter ${varName}...`}
                            className="w-full px-3 py-2 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-bolt-elements-textPrimary"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
            No tools found
          </h3>
          <p className="text-bolt-elements-textSecondary">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
});

MCPToolsManager.displayName = 'MCPToolsManager';