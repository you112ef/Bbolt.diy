import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface MongoDBStats {
  isConnected: boolean;
  host?: string;
  port?: string;
  database?: string;
  authSource?: string;
  ssl?: boolean;
  connectionType: 'atlas' | 'local' | 'hosted';
  lastConnected?: Date;
  connectionInfo?: {
    serverVersion?: string;
    platform?: string;
    maxWireVersion?: number;
  };
}

export default function MongoDBConnection() {
  const [connectionString, setConnectionString] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<MongoDBStats | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('mongodb_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setConnectionString(parsed.connectionString || '');
        setIsConnected(parsed.isConnected || false);
        setStats(parsed.stats || null);
        
        // Note: We don't auto-verify MongoDB connections as they require server-side validation
      } catch (error) {
        console.error('Error loading saved MongoDB connection:', error);
        localStorage.removeItem('mongodb_connection');
      }
    }
  }, []);

  const parseConnectionString = (connStr: string): Partial<MongoDBStats> => {
    try {
      const url = new URL(connStr);
      const isAtlas = url.hostname.includes('mongodb.net');
      const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      
      return {
        host: url.hostname,
        port: url.port || (url.protocol === 'mongodb+srv:' ? '27017' : '27017'),
        database: url.pathname.substring(1) || undefined,
        authSource: url.searchParams.get('authSource') || undefined,
        ssl: url.searchParams.get('ssl') === 'true' || url.protocol === 'mongodb+srv:',
        connectionType: isAtlas ? 'atlas' : isLocal ? 'local' : 'hosted'
      };
    } catch (error) {
      console.error('Error parsing connection string:', error);
      return {
        connectionType: 'local'
      };
    }
  };

  const testConnection = async (connStr: string): Promise<boolean> => {
    setTestingConnection(true);
    try {
      if (!connStr.startsWith('mongodb://') && !connStr.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MongoDB connection string format');
      }

      // Parse the connection string to validate it
      const parsedInfo = parseConnectionString(connStr);
      
      if (!parsedInfo.host) {
        throw new Error('Invalid hostname in connection string');
      }

      // Call server-side API to validate connection
      const res = await fetch('/api/connections/mongodb/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connStr }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Server responded ${res.status}`);
      }

      const serverStats = (await res.json()) as MongoDBStats;
      const { isConnected: _ignoreIsConnected, ...rest } = serverStats;

      const newStats: MongoDBStats = {
        isConnected: true,
        ...parsedInfo,
        ...rest,
        connectionType: parsedInfo.connectionType || 'hosted',
        lastConnected: new Date(),
      };

      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem('mongodb_connection', JSON.stringify({
        connectionString: connStr,
        isConnected: true,
        stats: newStats
      }));

      return true;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      throw error;
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnecting(true);

    try {
      // Test the connection
      const success = await testConnection(connectionString);
      if (!success) {
        throw new Error('Connection test failed');
      }
      
      setIsConnected(true);
      toast.success('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionString('');
    setStats(null);
    localStorage.removeItem('mongodb_connection');
    toast.success('Disconnected from MongoDB');
  };

  const retestConnection = async () => {
    if (connectionString && isConnected) {
      try {
        await testConnection(connectionString);
        toast.success('Connection test successful');
      } catch (error) {
        console.error('Error retesting connection:', error);
        toast.error('Connection test failed');
      }
    }
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/mongodb/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">MongoDB Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Connection String</label>
              <textarea
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                disabled={connecting}
                placeholder="mongodb://username:password@host:port/database&#10;or&#10;mongodb+srv://username:password@cluster.mongodb.net/database"
                rows={3}
                className={classNames(
                  "w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md",
                  "bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1",
                  "text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary",
                  "placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary",
                  "focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent",
                  "disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                )}
              />
              <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://cloud.mongodb.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                  >
                    MongoDB Atlas
                    <div className="i-ph:arrow-square-out w-4 h-4" />
                  </a>
                  <a
                    href="https://www.mongodb.com/docs/manual/reference/connection-string/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                  >
                    Connection String Guide
                    <div className="i-ph:arrow-square-out w-4 h-4" />
                  </a>
                </div>
                <div className="mt-2 text-xs text-bolt-elements-textSecondary">
                  <p><strong>Note:</strong> Connection testing is simulated in browser environment.</p>
                  <p>For production use, implement server-side MongoDB connection validation.</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={!connectionString || connecting}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent",
                "text-white dark:text-white",
                "hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {connecting ? 'Testing Connection...' : 'Test & Save Connection'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to MongoDB</span>
              </div>
              <button
                onClick={retestConnection}
                disabled={testingConnection}
                className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary flex items-center gap-1"
              >
                {testingConnection ? (
                  <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                ) : (
                  <div className="i-ph:arrows-clockwise w-4 h-4" />
                )}
                Test Connection
              </button>
            </div>
            
            {stats && (
              <div className="bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                    <div className="i-ph:database w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.connectionType === 'atlas' ? 'MongoDB Atlas' : 
                       stats.connectionType === 'local' ? 'Local MongoDB' : 'Hosted MongoDB'}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">{stats.host}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.port}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Port</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">
                      {stats.database || 'N/A'}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Database</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">SSL Enabled</span>
                    <span className={classNames(
                      "font-medium",
                      stats.ssl ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
                    )}>
                      {stats.ssl ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {stats.authSource && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Auth Source</span>
                      <span className="text-bolt-elements-textPrimary font-medium">{stats.authSource}</span>
                    </div>
                  )}
                  
                  {stats.connectionInfo?.serverVersion && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Server Version</span>
                      <span className="text-bolt-elements-textPrimary font-medium">{stats.connectionInfo.serverVersion}</span>
                    </div>
                  )}
                  
                  {stats.lastConnected && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Last Connected</span>
                      <span className="text-bolt-elements-textPrimary font-medium">
                        {stats.lastConnected.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className={classNames(
                  "mt-3 p-2 rounded border text-xs",
                  stats.connectionType === 'atlas'
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                )}>
                  <div className="flex items-center gap-2">
                    <div className={classNames(
                      "w-3 h-3",
                      stats.connectionType === 'atlas' ? "i-ph:shield-check" : "i-ph:info"
                    )} />
                    <span className="font-medium">
                      {stats.connectionType === 'atlas' 
                        ? 'Secure Atlas Connection' 
                        : stats.connectionType === 'local'
                        ? 'Local Development Environment'
                        : 'External MongoDB Instance'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleDisconnect}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-red-600 dark:bg-red-600",
                "text-white dark:text-white",
                "hover:bg-red-700 dark:hover:bg-red-700"
              )}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}