import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface CloudflareUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  created_on: string;
}

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  plan: {
    id: string;
    name: string;
  };
  name_servers: string[];
}

interface CloudflareStats {
  user: CloudflareUser | null;
  zones: CloudflareZone[];
  totalZones: number;
}

export default function CloudflareConnection() {
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<CloudflareStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('cloudflare_connection');
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
        console.error('Error loading saved Cloudflare connection:', error);
        localStorage.removeItem('cloudflare_connection');
      }
    }
  }, []);

  const verifyConnection = async (apiToken: string) => {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json() as any;
      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Token verification failed');
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('cloudflare_connection');
      return false;
    }
  };

  const fetchCloudflareStats = async (apiToken: string) => {
    setFetchingStats(true);
    try {
      // Fetch user info
      const userResponse = await fetch('https://api.cloudflare.com/client/v4/user', {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = await userResponse.json() as any;
      if (!userData.success) {
        throw new Error(userData.errors?.[0]?.message || 'Failed to fetch user data');
      }

      // Fetch zones
      const zonesResponse = await fetch('https://api.cloudflare.com/client/v4/zones?per_page=50', {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const zonesData = await zonesResponse.json() as any;
      if (!zonesData.success) {
        throw new Error(zonesData.errors?.[0]?.message || 'Failed to fetch zones');
      }

      const newStats: CloudflareStats = {
        user: userData.result,
        zones: zonesData.result || [],
        totalZones: zonesData.result_info?.total_count || zonesData.result?.length || 0
      };

      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem('cloudflare_connection', JSON.stringify({
        token: apiToken,
        isConnected: true,
        stats: newStats
      }));

      return newStats;
    } catch (error) {
      console.error('Error fetching Cloudflare stats:', error);
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
        throw new Error('Invalid API token');
      }

      // Fetch user data and zones
      await fetchCloudflareStats(token);
      
      setIsConnected(true);
      toast.success('Successfully connected to Cloudflare');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to Cloudflare: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    localStorage.removeItem('cloudflare_connection');
    toast.success('Disconnected from Cloudflare');
  };

  const refreshStats = async () => {
    if (token && isConnected) {
      try {
        await fetchCloudflareStats(token);
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
              src={`https://cdn.simpleicons.org/cloudflare/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Cloudflare Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">API Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={connecting}
                placeholder="Enter your Cloudflare API token"
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
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Create API Token
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Required permissions: Zone:Read, User:Read</span>
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
              {connecting ? 'Connecting...' : 'Connect to Cloudflare'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to Cloudflare</span>
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
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                    {stats.user.first_name?.[0] || stats.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.user.first_name && stats.user.last_name 
                        ? `${stats.user.first_name} ${stats.user.last_name}`
                        : stats.user.username || stats.user.email
                      }
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">{stats.user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.totalZones}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Total Zones</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">
                      {stats.zones.filter(z => z.status === 'active').length}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Active Zones</div>
                  </div>
                </div>
                
                {stats.zones.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Recent Zones</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stats.zones.slice(0, 5).map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-2 bg-bolt-elements-background dark:bg-bolt-elements-background rounded">
                          <div>
                            <div className="text-sm font-medium text-bolt-elements-textPrimary">{zone.name}</div>
                            <div className="text-xs text-bolt-elements-textSecondary">{zone.plan.name}</div>
                          </div>
                          <div className={classNames(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            zone.status === 'active' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {zone.status}
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