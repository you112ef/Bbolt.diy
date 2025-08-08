import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { classNames } from '~/utils/classNames';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface SupabaseConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  lastChecked?: Date;
  projectInfo?: {
    name: string;
    region: string;
    plan: string;
  };
}

export default function SupabaseConnection() {
  const [credentials, setCredentials] = useState<SupabaseCredentials>({
    url: '',
    anonKey: '',
    serviceRoleKey: '',
  });
  const [status, setStatus] = useState<SupabaseConnectionStatus>({
    isConnected: false,
    isLoading: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedCredentials = localStorage.getItem('supabase-credentials');
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envAnonKey) {
      const envCredentials = {
        url: envUrl,
        anonKey: envAnonKey,
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
      };
      setCredentials(envCredentials);
      testConnection(envCredentials);
    } else if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(parsed);
        testConnection(parsed);
      } catch (error) {
        console.error('Failed to parse saved Supabase credentials:', error);
      }
    }
  }, []);

  const testConnection = async (creds: SupabaseCredentials) => {
    if (!creds.url || !creds.anonKey) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'URL and Anonymous Key are required',
      });
      return;
    }

    setStatus((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Test connection by trying to access the Supabase REST API
      const response = await fetch(`${creds.url.replace(/\/$/, '')}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: creds.anonKey,
          Authorization: `Bearer ${creds.anonKey}`,
        },
      });

      if (response.ok) {
        // Try to get project info if service role key is available
        let projectInfo;

        if (creds.serviceRoleKey) {
          try {
            const projectResponse = await fetch(`${creds.url.replace(/\/$/, '')}/rest/v1/rpc/version`, {
              headers: {
                apikey: creds.serviceRoleKey,
                Authorization: `Bearer ${creds.serviceRoleKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (projectResponse.ok) {
              // Extract project info from URL (basic info)
              const urlParts = creds.url.match(/https:\/\/([^.]+)\.supabase\.co/);
              const projectId = urlParts?.[1];

              projectInfo = {
                name: projectId || 'Unknown Project',
                region: 'Auto-detected',
                plan: 'Free Tier', // Default assumption
              };
            }
          } catch (error) {
            // Non-critical error for project info
          }
        }

        setStatus({
          isConnected: true,
          isLoading: false,
          lastChecked: new Date(),
          projectInfo,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date(),
      });
    }
  };

  const handleConnect = async () => {
    await testConnection(credentials);

    if (credentials.url && credentials.anonKey) {
      // Save credentials (without service role key for security)
      const credentialsToSave = {
        url: credentials.url,
        anonKey: credentials.anonKey,
      };
      localStorage.setItem('supabase-credentials', JSON.stringify(credentialsToSave));
    }
  };

  const handleDisconnect = () => {
    setCredentials({ url: '', anonKey: '', serviceRoleKey: '' });
    setStatus({ isConnected: false, isLoading: false });
    localStorage.removeItem('supabase-credentials');
  };

  const handleInputChange = (field: keyof SupabaseCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isEnvConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <motion.div
      className="bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.362 9.354l-7.362-7.362c-0.683-0.683-1.792-0.683-2.475 0l-7.362 7.362c-0.683 0.683-0.683 1.792 0 2.475l7.362 7.362c0.683 0.683 1.792 0.683 2.475 0l7.362-7.362c0.683-0.683 0.683-1.792 0-2.475zM12 18.654l-6.654-6.654 6.654-6.654 6.654 6.654-6.654 6.654z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
              Supabase
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
              Open source Firebase alternative
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

      {/* Status Info */}
      {status.isConnected && status.projectInfo && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:check-circle w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Connected to {status.projectInfo.name}
            </span>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <p>Region: {status.projectInfo.region}</p>
            <p>Plan: {status.projectInfo.plan}</p>
            {status.lastChecked && <p>Last checked: {status.lastChecked.toLocaleTimeString()}</p>}
          </div>
        </div>
      )}

      {/* Error Display */}
      {status.error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="i-ph:warning-circle w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">Connection Failed</span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">{status.error}</p>
        </div>
      )}

      {/* Environment Variables Notice */}
      {isEnvConfigured && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="i-ph:info w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Using environment variables</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Supabase credentials are configured via environment variables
          </p>
        </div>
      )}

      {/* Connection Form */}
      {!isEnvConfigured && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
              Project URL *
            </label>
            <Input
              type="url"
              value={credentials.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
              Anonymous Key *
            </label>
            <Input
              type="password"
              value={credentials.anonKey}
              onChange={(e) => handleInputChange('anonKey', e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full"
            />
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              <div
                className={classNames('i-ph:caret-right w-3 h-3 transition-transform', showAdvanced ? 'rotate-90' : '')}
              />
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="mt-3 pl-4 border-l-2 border-bolt-elements-borderColor space-y-3">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Service Role Key (Optional)
                  </label>
                  <Input
                    type="password"
                    value={credentials.serviceRoleKey}
                    onChange={(e) => handleInputChange('serviceRoleKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full"
                  />
                  <p className="text-xs text-bolt-elements-textSecondary mt-1">
                    Used for advanced operations and project information
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {status.isConnected ? (
          <>
            <Button
              onClick={() => testConnection(credentials)}
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
            disabled={status.isLoading || !credentials.url || !credentials.anonKey}
            className="flex items-center gap-2"
          >
            {status.isLoading ? (
              <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
            ) : (
              <div className="i-ph:plug w-4 h-4" />
            )}
            Connect to Supabase
          </Button>
        )}
      </div>

      {/* Quick Setup Guide */}
      <div className="mt-6 p-4 bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 rounded-lg">
        <h4 className="text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
          Quick Setup Guide
        </h4>
        <ol className="text-xs text-bolt-elements-textSecondary space-y-1 list-decimal list-inside">
          <li>
            Go to{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              supabase.com/dashboard
            </a>
          </li>
          <li>Create a new project or select existing one</li>
          <li>Go to Settings → API</li>
          <li>Copy your Project URL and anon key</li>
          <li>Paste them above and click Connect</li>
        </ol>

        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300">
            💡 <strong>Free Tier:</strong> 500MB database, 1GB storage, 50MB file uploads
          </p>
        </div>
      </div>
    </motion.div>
  );
}
