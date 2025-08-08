import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useMCPStore } from '~/lib/stores/mcp';
import { classNames } from '~/utils/classNames';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Health status type
type HealthStatus = 'healthy' | 'unhealthy' | 'unknown' | 'checking';

// Tool health interface
interface ToolHealth {
  id: string;
  name: string;
  status: HealthStatus;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  enabled: boolean;
}

// Health statistics interface
interface HealthStats {
  total: number;
  healthy: number;
  unhealthy: number;
  unknown: number;
  checking: number;
}

// Tools health monitor component
export const ToolsHealthMonitor = memo(() => {
  const { communityTools, serverConnections } = useMCPStore();
  const [toolsHealth, setToolsHealth] = useState<ToolHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [filter, setFilter] = useState<HealthStatus | 'all'>('all');

  // Initialize tools health data
  useEffect(() => {
    if (communityTools) {
      const initialHealth: ToolHealth[] = Object.entries(communityTools).map(([id, tool]) => ({
        id,
        name: tool.name || id,
        status: 'unknown' as HealthStatus,
        lastChecked: new Date(),
        enabled: tool.enabled || false
      }));
      setToolsHealth(initialHealth);
    }
  }, [communityTools]);

  // Auto-refresh health checks
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      checkAllToolsHealth();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Check health of all tools
  const checkAllToolsHealth = async () => {
    if (!communityTools) return;
    
    setIsChecking(true);
    
    const healthPromises = Object.entries(communityTools).map(async ([id, tool]) => {
      const startTime = Date.now();
      
      try {
        // Update status to checking
        setToolsHealth(prev => prev.map(t => 
          t.id === id ? { ...t, status: 'checking' } : t
        ));

        // Simulate health check (in real app, this would be actual API calls)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        
        const responseTime = Date.now() - startTime;
        const isHealthy = Math.random() > 0.2; // 80% success rate for demo
        
        const healthStatus: ToolHealth = {
          id,
          name: tool.name || id,
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastChecked: new Date(),
          responseTime,
          enabled: tool.enabled || false,
          error: isHealthy ? undefined : 'Connection timeout or service unavailable'
        };

        return healthStatus;
      } catch (error) {
        return {
          id,
          name: tool.name || id,
          status: 'unhealthy' as HealthStatus,
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          enabled: tool.enabled || false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    try {
      const results = await Promise.all(healthPromises);
      setToolsHealth(results);
      toast.success('Health check completed');
    } catch (error) {
      toast.error('Health check failed');
      console.error('Health check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Check health of a single tool
  const checkSingleToolHealth = async (toolId: string) => {
    const tool = communityTools?.[toolId];
    if (!tool) return;

    const startTime = Date.now();
    
    // Update status to checking
    setToolsHealth(prev => prev.map(t => 
      t.id === toolId ? { ...t, status: 'checking' } : t
    ));

    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.2;
      
      setToolsHealth(prev => prev.map(t => 
        t.id === toolId ? {
          ...t,
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastChecked: new Date(),
          responseTime,
          error: isHealthy ? undefined : 'Connection timeout or service unavailable'
        } : t
      ));

      toast.success(`Health check completed for ${tool.name}`);
    } catch (error) {
      setToolsHealth(prev => prev.map(t => 
        t.id === toolId ? {
          ...t,
          status: 'unhealthy',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : t
      ));
      toast.error(`Health check failed for ${tool.name}`);
    }
  };

  // Calculate health statistics
  const getHealthStats = (): HealthStats => {
    return {
      total: toolsHealth.length,
      healthy: toolsHealth.filter(t => t.status === 'healthy').length,
      unhealthy: toolsHealth.filter(t => t.status === 'unhealthy').length,
      unknown: toolsHealth.filter(t => t.status === 'unknown').length,
      checking: toolsHealth.filter(t => t.status === 'checking').length
    };
  };

  // Filter tools based on status
  const filteredTools = toolsHealth.filter(tool => {
    if (filter === 'all') return true;
    return tool.status === filter;
  });

  // Get status icon
  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'unhealthy':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'unknown':
        return <ExclamationCircleIcon className="w-5 h-5 text-gray-400" />;
      case 'checking':
        return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'unhealthy':
        return 'text-red-400';
      case 'unknown':
        return 'text-gray-400';
      case 'checking':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const stats = getHealthStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Tools Health Monitor</h2>
          <p className="text-sm text-gray-400">
            Monitor the health and availability of MCP community tools
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={checkAllToolsHealth}
            disabled={isChecking}
            className={classNames(
              'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
              isChecking
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            <ArrowPathIcon className={classNames('w-4 h-4', isChecking ? 'animate-spin' : '')} />
            <span>{isChecking ? 'Checking...' : 'Check All'}</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh Controls */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Auto-refresh</span>
          </label>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-1"
            >
              <option value={15}>Every 15s</option>
              <option value={30}>Every 30s</option>
              <option value={60}>Every 1m</option>
              <option value={300}>Every 5m</option>
            </select>
          )}
        </div>
        
        <div className="text-sm text-gray-400">
          Last checked: {toolsHealth.length > 0 ? new Date().toLocaleTimeString() : 'Never'}
        </div>
      </div>

      {/* Health Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Tools</div>
        </div>
        <div className="bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.healthy}</div>
          <div className="text-sm text-gray-400">Healthy</div>
        </div>
        <div className="bg-red-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{stats.unhealthy}</div>
          <div className="text-sm text-gray-400">Unhealthy</div>
        </div>
        <div className="bg-gray-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">{stats.unknown}</div>
          <div className="text-sm text-gray-400">Unknown</div>
        </div>
        <div className="bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.checking}</div>
          <div className="text-sm text-gray-400">Checking</div>
        </div>
      </div>

      {/* Filter Controls */}
      {toolsHealth.length > 0 && (
        <div className="flex space-x-2">
          {(['all', 'healthy', 'unhealthy', 'unknown', 'checking'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={classNames(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Tools List */}
      <div className="space-y-3">
        {filteredTools.map((tool) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={classNames(
              'p-4 rounded-lg border transition-all duration-200',
              tool.enabled ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-60'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(tool.status)}
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {tool.name}
                    {!tool.enabled && <span className="text-gray-500 ml-2">(Disabled)</span>}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={classNames('text-xs', getStatusColor(tool.status))}>
                      {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                    </span>
                    {tool.responseTime && (
                      <span className="text-xs text-gray-400">
                        {tool.responseTime}ms
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Last checked: {tool.lastChecked.toLocaleTimeString()}
                    </span>
                  </div>
                  {tool.error && (
                    <div className="mt-2 text-xs text-red-300 bg-red-900/20 rounded px-2 py-1">
                      {tool.error}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => checkSingleToolHealth(tool.id)}
                disabled={tool.status === 'checking'}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {toolsHealth.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">
            No community tools configured yet
          </div>
        </div>
      )}
    </div>
  );
});

ToolsHealthMonitor.displayName = 'ToolsHealthMonitor';