import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface HerokuUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
  verified: boolean;
  default_organization?: {
    id: string;
    name: string;
  };
}

interface HerokuApp {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  web_url: string;
  git_url: string;
  region: {
    id: string;
    name: string;
  };
  stack: {
    id: string;
    name: string;
  };
  buildpack_provided_description?: string;
  space?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface HerokuStats {
  user: HerokuUser | null;
  apps: HerokuApp[];
  totalApps: number;
}

export default function HerokuConnection() {
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<HerokuStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('heroku_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setToken(parsed.token);
        setIsConnected(parsed.isConnected);
        setStats(parsed.stats);
        
        // Verify connection is still valid
        if (parsed.isConnected && parsed.token) {
          verifyConnection(parsed.token);
        }
      } catch (error) {
        console.error('Error loading saved Heroku connection:', error);
        localStorage.removeItem('heroku_connection');
      }
    }
  }, []);

  const verifyConnection = async (apiKey: string) => {
    try {
      const response = await fetch('https://api.heroku.com/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.heroku+json; version=3',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Heroku token verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('heroku_connection');
      return false;
    }
  };

  const fetchHerokuStats = async (apiKey: string) => {
    setFetchingStats(true);
    try {
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.heroku+json; version=3',
        'Content-Type': 'application/json'
      };

      // Fetch user info
      const userResponse = await fetch('https://api.heroku.com/account', {
        headers
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json() as HerokuUser;

      // Fetch apps
      const appsResponse = await fetch('https://api.heroku.com/apps', {
        headers
      });

      if (!appsResponse.ok) {
        throw new Error(`Failed to fetch apps: ${appsResponse.statusText}`);
      }

      const appsData = await appsResponse.json() as HerokuApp[];

      const newStats: HerokuStats = {
        user: userData,
        apps: appsData.slice(0, 10), // Limit to first 10 apps for display
        totalApps: appsData.length
      };

      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem('heroku_connection', JSON.stringify({
        token: apiKey,
        isConnected: true,
        stats: newStats
      }));

      return newStats;
    } catch (error) {
      console.error('Error fetching Heroku stats:', error);
      toast.error(`Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setFetchingStats(false);
    }
  };

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnecting(true);

    try {
      // Verify the token first
      const isValid = await verifyConnection(token);
      if (!isValid) {
        throw new Error('Invalid API key');
      }

      // Fetch user data and apps
      await fetchHerokuStats(token);
      
      setIsConnected(true);
      toast.success('Successfully connected to Heroku');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to Heroku: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setToken('');
    setStats(null);
    localStorage.removeItem('heroku_connection');
    toast.success('Disconnected from Heroku');
  };

  const refreshStats = async () => {
    if (token && isConnected) {
      try {
        await fetchHerokuStats(token);
        toast.success('Stats refreshed successfully');
      } catch (error) {
        console.error('Error refreshing stats:', error);
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
              src={`https://cdn.simpleicons.org/heroku/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Heroku Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">API Key</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={connecting}
                placeholder="Enter your Heroku API key"
                className={classNames(
                  "w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md",
                  "bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1",
                  "text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary",
                  "placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary",
                  "focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                <a
                  href="https://dashboard.heroku.com/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Get API Key
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Or use: heroku auth:token</span>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={!token || connecting}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent",
                "text-white dark:text-white",
                "hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {connecting ? 'Connecting...' : 'Connect to Heroku'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to Heroku</span>
              </div>
              <button
                onClick={refreshStats}
                disabled={fetchingStats}
                className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary flex items-center gap-1"
              >
                {fetchingStats ? (
                  <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                ) : (
                  <div className="i-ph:arrows-clockwise w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
            
            {stats?.user && (
              <div className="bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {stats.user.name?.[0] || stats.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.user.name || stats.user.email}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">{stats.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {stats.user.verified ? (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <div className="i-ph:shield-check w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <div className="i-ph:shield-warning w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.totalApps}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Total Apps</div>
                  </div>
                </div>
                
                {stats.apps.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Recent Apps</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stats.apps.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-2 bg-bolt-elements-background dark:bg-bolt-elements-background rounded">
                          <div>
                            <div className="text-sm font-medium text-bolt-elements-textPrimary">{app.name}</div>
                            <div className="text-xs text-bolt-elements-textSecondary">
                              {app.region.name} • {app.stack.name}
                            </div>
                            {app.buildpack_provided_description && (
                              <div className="text-xs text-bolt-elements-textSecondary">
                                {app.buildpack_provided_description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={app.web_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-bolt-elements-item-contentAccent hover:underline flex items-center gap-1"
                            >
                              <div className="i-ph:globe w-3 h-3" />
                              View
                            </a>
                            {app.team && (
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Team
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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