import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { classNames } from '~/utils/classNames';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface FirebaseConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  lastChecked?: Date;
  projectInfo?: {
    name: string;
    displayName: string;
    plan: string;
    region: string;
  };
}

export default function FirebaseConnection() {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });
  const [status, setStatus] = useState<FirebaseConnectionStatus>({
    isConnected: false,
    isLoading: false,
  });
  const [configMethod, setConfigMethod] = useState<'manual' | 'json'>('manual');
  const [jsonConfig, setJsonConfig] = useState('');

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('firebase-config');

    // Check for environment variables first
    const envConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

    if (envConfig.apiKey && envConfig.projectId) {
      setConfig(envConfig);
      testConnection(envConfig);
    } else if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        testConnection(parsed);
      } catch (error) {
        console.error('Failed to parse saved Firebase config:', error);
      }
    }
  }, []);

  const testConnection = async (firebaseConfig: FirebaseConfig) => {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'API Key and Project ID are required',
      });
      return;
    }

    setStatus((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Test Firebase configuration by checking if the project exists
      const projectUrl = `https://firebase.googleapis.com/v1beta1/projects/${firebaseConfig.projectId}?key=${firebaseConfig.apiKey}`;

      const response = await fetch(projectUrl);

      if (response.ok) {
        const projectData = (await response.json()) as any;

        setStatus({
          isConnected: true,
          isLoading: false,
          lastChecked: new Date(),
          projectInfo: {
            name: projectData.projectId,
            displayName: projectData.displayName || projectData.projectId,
            plan: 'Spark Plan (Free)', // Default assumption
            region: projectData.defaultCloudLocation || 'us-central1',
          },
        });
      } else if (response.status === 403) {
        throw new Error('Invalid API key or insufficient permissions');
      } else if (response.status === 404) {
        throw new Error('Project not found. Check your Project ID');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date(),
      });
    }
  };

  const handleConnect = async () => {
    let configToTest = config;

    // If using JSON method, parse the JSON first
    if (configMethod === 'json' && jsonConfig) {
      try {
        configToTest = JSON.parse(jsonConfig);
        setConfig(configToTest);
      } catch (error) {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: 'Invalid JSON configuration',
        });
        return;
      }
    }

    await testConnection(configToTest);

    if (configToTest.apiKey && configToTest.projectId) {
      localStorage.setItem('firebase-config', JSON.stringify(configToTest));
    }
  };

  const handleDisconnect = () => {
    setConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
    });
    setJsonConfig('');
    setStatus({ isConnected: false, isLoading: false });
    localStorage.removeItem('firebase-config');
  };

  const handleInputChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJsonConfigChange = (value: string) => {
    setJsonConfig(value);

    try {
      const parsed = JSON.parse(value);

      if (parsed.apiKey && parsed.projectId) {
        setConfig(parsed);
      }
    } catch (error) {
      // Invalid JSON, ignore
    }
  };

  const isEnvConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);

  const sampleConfig = {
    apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:abcdef123456',
    measurementId: 'G-XXXXXXXXXX',
  };

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
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.016 3.984l3.984 6.984h-3.984v9.047h9.984v-3.984l3.984 3.984 1.031-1.031-13.968-13.968zM12 21.984c-5.484 0-9.984-4.5-9.984-9.984s4.5-9.984 9.984-9.984 9.984 4.5 9.984 9.984-4.5 9.984-9.984 9.984z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
              Firebase
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
              Google's app development platform
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
              Connected to {status.projectInfo.displayName}
            </span>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <p>Project ID: {status.projectInfo.name}</p>
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
            Firebase configuration is loaded from environment variables
          </p>
        </div>
      )}

      {/* Configuration Method Selector */}
      {!isEnvConfigured && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setConfigMethod('manual')}
              className={classNames(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                configMethod === 'manual'
                  ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-textPrimary'
                  : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
              )}
            >
              Manual Input
            </button>
            <button
              onClick={() => setConfigMethod('json')}
              className={classNames(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                configMethod === 'json'
                  ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-textPrimary'
                  : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
              )}
            >
              JSON Config
            </button>
          </div>

          {configMethod === 'manual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    API Key *
                  </label>
                  <Input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Project ID *
                  </label>
                  <Input
                    type="text"
                    value={config.projectId}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    placeholder="your-project-id"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Auth Domain
                  </label>
                  <Input
                    type="text"
                    value={config.authDomain}
                    onChange={(e) => handleInputChange('authDomain', e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Storage Bucket
                  </label>
                  <Input
                    type="text"
                    value={config.storageBucket}
                    onChange={(e) => handleInputChange('storageBucket', e.target.value)}
                    placeholder="your-project.appspot.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    Messaging Sender ID
                  </label>
                  <Input
                    type="text"
                    value={config.messagingSenderId}
                    onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
                    placeholder="123456789012"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                    App ID
                  </label>
                  <Input
                    type="text"
                    value={config.appId}
                    onChange={(e) => handleInputChange('appId', e.target.value)}
                    placeholder="1:123456789012:web:abcdef123456"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                  Measurement ID (Optional)
                </label>
                <Input
                  type="text"
                  value={config.measurementId || ''}
                  onChange={(e) => handleInputChange('measurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-2">
                Firebase Configuration JSON
              </label>
              <textarea
                value={jsonConfig}
                onChange={(e) => handleJsonConfigChange(e.target.value)}
                placeholder={JSON.stringify(sampleConfig, null, 2)}
                className="w-full h-48 p-3 text-xs font-mono bg-bolt-elements-background border border-bolt-elements-borderColor rounded-lg focus:ring-2 focus:ring-bolt-elements-focus focus:border-transparent resize-none"
              />
              <p className="text-xs text-bolt-elements-textSecondary mt-1">
                Paste the complete Firebase configuration object from your console
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {status.isConnected ? (
          <>
            <Button
              onClick={() => testConnection(config)}
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
            disabled={
              status.isLoading || ((!config.apiKey || !config.projectId) && (!jsonConfig || configMethod !== 'json'))
            }
            className="flex items-center gap-2"
          >
            {status.isLoading ? (
              <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
            ) : (
              <div className="i-ph:plug w-4 h-4" />
            )}
            Connect to Firebase
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
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Firebase Console
            </a>
          </li>
          <li>Create a new project or select existing one</li>
          <li>Go to Project Settings (gear icon)</li>
          <li>In "Your apps" section, create or select a web app</li>
          <li>Copy the configuration object</li>
          <li>Paste it above using JSON Config method</li>
        </ol>

        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            🔥 <strong>Spark Plan (Free):</strong> 1GB storage, 125K reads/day, 20K writes/day
          </p>
        </div>
      </div>
    </motion.div>
  );
}
