import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useMCPStore } from '~/lib/stores/mcp';
import { classNames } from '~/utils/classNames';
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Test result interface
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'running';
  message: string;
  duration?: number;
  error?: string;
}

// Test statistics interface
interface TestStats {
  total: number;
  passed: number;
  failed: number;
  running: number;
}

// Test console component
export const MCPTestConsole = memo(() => {
  const { mcpServers, serverConnections } = useMCPStore();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  // Run comprehensive tests
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests: TestResult[] = [];
    
    try {
      // Test 1: MCP Store Configuration
      tests.push({
        name: 'MCP Store Configuration',
        status: 'running',
        message: 'Checking MCP store state...'
      });
      setTestResults([...tests]);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mcpServers && Object.keys(mcpServers).length > 0) {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'passed',
          message: `Found ${Object.keys(mcpServers).length} configured servers`,
          duration: 500
        };
      } else {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'failed',
          message: 'No MCP servers configured',
          duration: 500,
          error: 'MCP servers object is empty or undefined'
        };
      }
      setTestResults([...tests]);

      // Test 2: Server Connections
      tests.push({
        name: 'Server Connections',
        status: 'running',
        message: 'Testing server connections...'
      });
      setTestResults([...tests]);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const connectedCount = Object.values(serverConnections || {}).filter(conn => conn === 'connected').length;
      if (connectedCount > 0) {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'passed',
          message: `${connectedCount} servers connected successfully`,
          duration: 800
        };
      } else {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'failed',
          message: 'No servers connected',
          duration: 800,
          error: 'All server connections are disconnected or undefined'
        };
      }
      setTestResults([...tests]);

      // Test 3: API Endpoints
      tests.push({
        name: 'API Endpoints',
        status: 'running',
        message: 'Testing API endpoints...'
      });
      setTestResults([...tests]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const response = await fetch('/api/mcp-check');
        if (response.ok) {
          tests[tests.length - 1] = {
            ...tests[tests.length - 1],
            status: 'passed',
            message: 'MCP API endpoints responding',
            duration: 1000
          };
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (error) {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'failed',
          message: 'MCP API endpoints not responding',
          duration: 1000,
          error: error instanceof Error ? error.message : 'Unknown API error'
        };
      }
      setTestResults([...tests]);

      // Test 4: Community Tools Configuration
      tests.push({
        name: 'Community Tools Configuration',
        status: 'running',
        message: 'Validating community tools...'
      });
      setTestResults([...tests]);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      try {
        const response = await fetch('/api/mcp-tools');
        if (response.ok) {
          const data = await response.json() as { success?: boolean; tools?: Record<string, any> };
          if (data.success && data.tools) {
            tests[tests.length - 1] = {
              ...tests[tests.length - 1],
              status: 'passed',
              message: `${Object.keys(data.tools).length} community tools available`,
              duration: 600
            };
          } else {
            throw new Error('Invalid tools response');
          }
        } else {
          throw new Error(`Tools API returned ${response.status}`);
        }
      } catch (error) {
        tests[tests.length - 1] = {
          ...tests[tests.length - 1],
          status: 'failed',
          message: 'Community tools configuration error',
          duration: 600,
          error: error instanceof Error ? error.message : 'Unknown tools error'
        };
      }
      setTestResults([...tests]);

      toast.success('MCP tests completed successfully');
    } catch (error) {
      toast.error('Test execution failed');
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Calculate test statistics
  const getTestStats = (): TestStats => {
    return {
      total: testResults.length,
      passed: testResults.filter(t => t.status === 'passed').length,
      failed: testResults.filter(t => t.status === 'failed').length,
      running: testResults.filter(t => t.status === 'running').length
    };
  };

  // Filter test results
  const filteredResults = testResults.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const stats = getTestStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">MCP Test Console</h2>
          <p className="text-sm text-gray-400">
            Run comprehensive tests to validate MCP integration
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={classNames(
            'px-4 py-2 rounded-lg font-medium transition-all duration-200',
            isRunning
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {/* Test Statistics */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Tests</div>
          </div>
          <div className="bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.passed}</div>
            <div className="text-sm text-gray-400">Passed</div>
          </div>
          <div className="bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.running}</div>
            <div className="text-sm text-gray-400">Running</div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {testResults.length > 0 && (
        <div className="flex space-x-2">
          {(['all', 'passed', 'failed'] as const).map((filterOption) => (
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

      {/* Test Results */}
      <div className="space-y-3">
        {filteredResults.map((result, index) => (
          <motion.div
            key={`${result.name}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={classNames(
              'p-4 rounded-lg border',
              result.status === 'passed' ? 'bg-green-900/10 border-green-700' : '',
              result.status === 'failed' ? 'bg-red-900/10 border-red-700' : '',
              result.status === 'running' ? 'bg-blue-900/10 border-blue-700' : ''
            )}
          >
            <div className="flex items-start space-x-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {result.status === 'passed' && (
                  <CheckIcon className="w-5 h-5 text-green-400" />
                )}
                {result.status === 'failed' && (
                  <XMarkIcon className="w-5 h-5 text-red-400" />
                )}
                {result.status === 'running' && (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Test Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">{result.name}</h3>
                  {result.duration && (
                    <span className="text-xs text-gray-400">{result.duration}ms</span>
                  )}
                </div>
                <p className="text-sm text-gray-300 mt-1">{result.message}</p>
                {result.error && (
                  <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-700">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-300">{result.error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">
            Click "Run Tests" to start MCP integration testing
          </div>
        </div>
      )}
    </div>
  );
});

MCPTestConsole.displayName = 'MCPTestConsole';