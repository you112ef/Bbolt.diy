import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface RedisStats {
  isConnected: boolean;
  host?: string;
  port?: string;
  database?: number;
  ssl?: boolean;
  lastConnected?: Date;
  serverInfo?: {
    version?: string;
    mode?: string;
    memory?: string;
    clients?: number;
  };
}

export default function RedisConnection() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('6379');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('0');
  const [ssl, setSsl] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('redis_connection');

    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setHost(parsed.host || '');
        setPort(parsed.port || '6379');
        setPassword(parsed.password || '');
        setDatabase(parsed.database || '0');
        setSsl(parsed.ssl || false);
        setIsConnected(parsed.isConnected || false);
        setStats(parsed.stats || null);
      } catch (error) {
        console.error('Error loading saved Redis connection:', error);
        localStorage.removeItem('redis_connection');
      }
    }
  }, []);

  const testConnection = async (): Promise<boolean> => {
    setTestingConnection(true);

    try {
      if (!host) {
        throw new Error('Host is required');
      }

      const res = await fetch('/api/connections/redis/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port), password, database: Number(database), ssl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || 'Failed to test Redis connection');
      }

      const payload = await res.json();

      const newStats: RedisStats = {
        isConnected: true,
        host,
        port,
        database: parseInt(database),
        ssl,
        lastConnected: new Date(),
        serverInfo: {
          version: payload?.server?.version,
          mode: payload?.server?.mode,
          memory: payload?.server?.memory,
          clients: payload?.server?.clients,
        },
      };

      setStats(newStats);

      // Save to localStorage (without password for security)
      localStorage.setItem(
        'redis_connection',
        JSON.stringify({
          host,
          port,
          database,
          ssl,
          isConnected: true,
          stats: newStats,
        }),
      );

      return true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      throw error;
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnecting(true);

    try {
      const success = await testConnection();

      if (!success) {
        throw new Error('Connection test failed');
      }

      setIsConnected(true);
      toast.success('Successfully connected to Redis');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setHost('');
    setPort('6379');
    setPassword('');
    setDatabase('0');
    setSsl(false);
    setStats(null);
    localStorage.removeItem('redis_connection');
    toast.success('Disconnected from Redis');
  };

  const retestConnection = async () => {
    if (host && isConnected) {
      try {
        await testConnection();
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
      transition={{ delay: 0.4 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/redis/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Redis Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={connecting}
                  placeholder="localhost or redis.example.com"
                  className={classNames(
                    'w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md',
                    'bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1',
                    'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                    'placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              </div>
              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  disabled={connecting}
                  placeholder="6379"
                  className={classNames(
                    'w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md',
                    'bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1',
                    'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                    'placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">Password (Optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={connecting}
                  placeholder="Leave empty if no auth required"
                  className={classNames(
                    'w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md',
                    'bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1',
                    'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                    'placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              </div>
              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">Database</label>
                <input
                  type="number"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  disabled={connecting}
                  placeholder="0"
                  min="0"
                  max="15"
                  className={classNames(
                    'w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md',
                    'bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1',
                    'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                    'placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="redis-ssl"
                checked={ssl}
                onChange={(e) => setSsl(e.target.checked)}
                disabled={connecting}
                className="w-4 h-4 text-bolt-elements-item-contentAccent"
              />
              <label htmlFor="redis-ssl" className="text-sm text-bolt-elements-textSecondary">
                Use SSL/TLS connection
              </label>
            </div>

            <div className="text-sm text-bolt-elements-textSecondary">
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://redis.io/try-free/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Redis Cloud (Free)
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <a
                  href="https://upstash.com/redis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Upstash Redis (Free)
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
              </div>
              <div className="mt-2 text-xs text-bolt-elements-textSecondary">
                <p>Connection is validated server-side for accuracy and security.</p>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={!host || connecting}
              className={classNames(
                'w-full px-4 py-2 rounded-md font-medium transition-colors',
                'bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent',
                'text-white dark:text-white',
                'hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
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
                <span className="text-sm font-medium">Connected to Redis</span>
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
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-medium">
                    <div className="i-ph:database w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">Redis Server</h4>
                    <p className="text-xs text-bolt-elements-textSecondary">
                      {stats.host}:{stats.port}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.database}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Database</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">
                      {stats.serverInfo?.clients || 0}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Clients</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">SSL Enabled</span>
                    <span
                      className={classNames(
                        'font-medium',
                        stats.ssl ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400',
                      )}
                    >
                      {stats.ssl ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {stats.serverInfo?.version && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Server Version</span>
                      <span className="text-bolt-elements-textPrimary font-medium">{stats.serverInfo.version}</span>
                    </div>
                  )}

                  {stats.serverInfo?.mode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Mode</span>
                      <span className="text-bolt-elements-textPrimary font-medium">{stats.serverInfo.mode}</span>
                    </div>
                  )}

                  {stats.serverInfo?.memory && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Memory Usage</span>
                      <span className="text-bolt-elements-textPrimary font-medium">{stats.serverInfo.memory}</span>
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
              </div>
            )}

            <button
              onClick={handleDisconnect}
              className={classNames(
                'w-full px-4 py-2 rounded-md font-medium transition-colors',
                'bg-red-600 dark:bg-red-600',
                'text-white dark:text-white',
                'hover:bg-red-700 dark:hover:bg-red-700',
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
