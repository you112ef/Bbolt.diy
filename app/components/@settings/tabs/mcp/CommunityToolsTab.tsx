import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  COMMUNITY_MCP_TOOLS, 
  MCP_CATEGORIES, 
  DEFAULT_ENABLED_TOOLS,
  AUTH_REQUIRED_TOOLS,
  type MCPTool
} from '~/lib/mcp/community-tools';
import { useMCPStore } from '~/lib/stores/mcp';
import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui/IconButton';

interface CommunityToolConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  type: "stdio" | "sse" | "http";
  command: string;
  args: string[];
  envVars?: Record<string, string>;
  requiredEnvVars?: string[];
  requiresAuth?: boolean;
}

interface CommunityToolsTabProps {
  className?: string;
}

export const CommunityToolsTab = memo(({ className }: CommunityToolsTabProps) => {
  const communityTools = useMCPStore((state) => state.communityTools);
  const loadCommunityTools = useMCPStore((state) => state.loadCommunityTools);
  const updateCommunityTool = useMCPStore((state) => state.updateCommunityTool);
  const saveCommunityTools = useMCPStore((state) => state.saveCommunityTools);
  const isInitialized = useMCPStore((state) => state.isInitialized);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tools configuration
  useEffect(() => {
    if (isInitialized) {
      loadCommunityTools().finally(() => setIsLoading(false));
    }
  }, [isInitialized, loadCommunityTools]);

  // Save tools configuration
  const saveToolsConfig = async () => {
    try {
      setIsSaving(true);
      await saveCommunityTools();
      toast.success('MCP tools configuration saved successfully');
    } catch (error) {
      console.error('Error saving MCP tools config:', error);
      toast.error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter tools based on category, search, and enabled status
  const filteredTools = Object.entries(communityTools).filter(([name, tool]) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (tool.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnabled = !showOnlyEnabled || tool.enabled;
    
    return matchesCategory && matchesSearch && matchesEnabled;
  });

  // Get unique categories
  const categories = ['all', ...Object.keys(MCP_CATEGORIES)];

  const toggleTool = (toolName: string) => {
    const tool = communityTools[toolName];
    updateCommunityTool(toolName, { enabled: !tool.enabled });
  };

  const updateToolEnvVar = (toolName: string, varName: string, value: string) => {
    const tool = communityTools[toolName];
    updateCommunityTool(toolName, {
      envVars: {
        ...tool.envVars,
        [varName]: value
      }
    });
  };

  const enabledCount = Object.values(communityTools).filter(tool => tool.enabled).length;
  const totalCount = Object.keys(communityTools).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-bolt-elements-textSecondary">
          <div className="i-svg-spinners:90-ring-with-bg w-5 h-5 animate-spin" />
          <span>Loading MCP tools...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('community-tools-tab max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
            Community MCP Tools
          </h2>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            {enabledCount} of {totalCount} tools enabled • Ready-to-use tools from the MCP community
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
            Enabled only
          </label>
          
          <button
            onClick={saveToolsConfig}
            disabled={isSaving}
            className={classNames(
              'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
              'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent',
              'hover:bg-bolt-elements-item-backgroundActive',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSaving ? (
              <>
                <div className="i-svg-spinners:90-ring-with-bg w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <div className="i-ph:floppy-disk w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="i-ph:magnifying-glass w-4 h-4 text-bolt-elements-textTertiary" />
            </div>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-bolt-elements-textPrimary text-sm"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:ring-2 focus:ring-blue-500 text-sm"
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
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTools.map(([name, tool]) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={classNames(
                'bg-bolt-elements-background-depth-1 border rounded-lg p-4 transition-all duration-200',
                tool.enabled 
                  ? 'border-blue-500/40 bg-blue-500/5' 
                  : 'border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {MCP_CATEGORIES[tool.category as keyof typeof MCP_CATEGORIES] || '🔧'}
                    </span>
                    <h3 className="text-base font-medium text-bolt-elements-textPrimary">
                      {name}
                    </h3>
                    {tool.requiresAuth && (
                      <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full border border-yellow-500/20">
                        🔑 Auth Required
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary rounded-full">
                      {tool.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-bolt-elements-textSecondary mb-3">
                    {tool.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <span className="font-mono bg-bolt-elements-background-depth-2 px-2 py-1 rounded">
                      {tool.command} {(tool.args || []).join(' ')}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{tool.type}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {tool.requiresAuth && (
                    <IconButton
                      icon={expandedTool === name ? "i-ph:caret-up" : "i-ph:caret-down"}
                      size="sm"
                      title="Configure environment variables"
                      onClick={() => setExpandedTool(expandedTool === name ? null : name)}
                    />
                  )}
                  
                  <button
                    onClick={() => toggleTool(name)}
                    className={classNames(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bolt-elements-background-depth-1',
                      tool.enabled 
                        ? 'bg-blue-600' 
                        : 'bg-bolt-elements-background-depth-3'
                    )}
                  >
                    <span
                      className={classNames(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg',
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
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                      <div className="i-ph:key w-4 h-4" />
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
      
      {/* Quick actions */}
      {filteredTools.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-bolt-elements-borderColor">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                Object.keys(communityTools).forEach(name => {
                  if (!communityTools[name].requiresAuth) {
                    updateCommunityTool(name, { enabled: true });
                  }
                });
              }}
              className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              Enable all basic tools
            </button>
            <button
              onClick={() => {
                Object.keys(communityTools).forEach(name => {
                  updateCommunityTool(name, { enabled: false });
                });
              }}
              className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              Disable all tools
            </button>
          </div>
          
          <div className="text-sm text-bolt-elements-textTertiary">
            {enabledCount} tools will be available in your AI conversations
          </div>
        </div>
      )}
    </div>
  );
});

CommunityToolsTab.displayName = 'CommunityToolsTab';