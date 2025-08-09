import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

interface RailwayConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  lastChecked?: Date;
  projectInfo?: {
    name: string;
    plan: string;
    usage: string;
  };
}

export default function RailwayConnection() {
  const [apiToken, setApiToken] = useState('');
  const [status, setStatus] = useState<RailwayConnectionStatus>({
    isConnected: false,
    isLoading: false
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('railway-token');
    const envToken = import.meta.env.VITE_RAILWAY_API_TOKEN;

    if (envToken) {
      setApiToken(envToken);
      testConnection(envToken);
    } else if (savedToken) {
      setApiToken(savedToken);
      testConnection(savedToken);
    }
  }, []);

  const testConnection = async (token: string) => {
    if (!token) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'API token is required'
      });
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const response = await fetch('https://backboard.railway.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query { me { id name } }`
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        if (data.data?.me) {
          setStatus({
            isConnected: true,
            isLoading: false,
            lastChecked: new Date(),
            projectInfo: {
              name: data.data.me.name || 'Railway User',
              plan: 'Hobby Plan ($5/month)',
              usage: 'Active'
            }
          });
        } else {
          throw new Error('Invalid token or unauthorized');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Invalid token`);
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date()
      });
    }
  };

  const handleConnect = async () => {
    await testConnection(apiToken);
    if (apiToken) {
      localStorage.setItem('railway-token', apiToken);
    }
  };

  const handleDisconnect = () => {
    setApiToken('');
    setStatus({ isConnected: false, isLoading: false });
    localStorage.removeItem('railway-token');
  };

  const isEnvConfigured = Boolean(import.meta.env.VITE_RAILWAY_API_TOKEN);

  return (
    <motion.div
      className="bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
              Railway
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
              Deploy from Git with zero configuration
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status.isConnected && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Connected
            </div>
          )}
          {status.error && (
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Error
            </div>
          )}
        </div>
      </div>

      {status.isConnected && status.projectInfo && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:check-circle w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Connected as {status.projectInfo.name}
            </span>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <p>Plan: {status.projectInfo.plan}</p>
            <p>Status: {status.projectInfo.usage}</p>
            {status.lastChecked && (
              <p>Last checked: {status.lastChecked.toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      )}

      {status.error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="i-ph:warning-circle w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Connection Failed
            </span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">{status.error}</p>
        </div>
      )}

      {isEnvConfigured && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="i-ph:info w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Using environment variables
            </span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Railway token is configured via environment variables
          </p>
        </div>
      )}

      {!isEnvConfigured && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
              API Token *
            </label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Railway API token"
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {status.isConnected ? (
          <>
            <Button
              onClick={() => testConnection(apiToken)}
              disabled={status.isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {status.isLoading ? (
                <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
              ) : (
                <div className="i-ph:arrow-clockwise w-4 h-4" />
              )}
              Test Connection
            </Button>
            {!isEnvConfigured && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <div className="i-ph:x w-4 h-4" />
                Disconnect
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={status.isLoading || !apiToken}
            className="flex items-center gap-2"
          >
            {status.isLoading ? (
              <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
            ) : (
              <div className="i-ph:plug w-4 h-4" />
            )}
            Connect to Railway
          </Button>
        )}
      </div>

      <div className="mt-6 p-4 bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 rounded-lg">
        <h4 className="text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
          Quick Setup Guide
        </h4>
        <ol className="text-xs text-bolt-elements-textSecondary space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://railway.app/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Railway Dashboard</a></li>
          <li>Create a new API token</li>
          <li>Copy the token and paste it above</li>
          <li>Click Connect to Railway</li>
        </ol>
        
        <div className="mt-3 p-2 bg-sky-50 dark:bg-sky-950/20 rounded border border-sky-200 dark:border-sky-800">
          <p className="text-xs text-sky-700 dark:text-sky-300">
            🚂 <strong>Hobby Plan:</strong> $5 monthly credit, Pay-as-you-go
          </p>
        </div>
      </div>
    </motion.div>
  );
}