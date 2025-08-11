import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface SendGridUser {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface SendGridStats {
  user: SendGridUser | null;
  reputation?: number;
  credits?: {
    remain: number;
    total: number;
    overage: number;
    used: number;
  };
  lastConnected?: Date;
}

export default function SendGridConnection() {
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<SendGridStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('sendgrid_connection');

    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setApiKey(parsed.apiKey || '');
        setIsConnected(parsed.isConnected || false);
        setStats(parsed.stats || null);

        // Verify connection is still valid
        if (parsed.isConnected && parsed.apiKey) {
          verifyConnection(parsed.apiKey);
        }
      } catch (error) {
        console.error('Error loading saved SendGrid connection:', error);
        localStorage.removeItem('sendgrid_connection');
      }
    }
  }, []);

  const verifyConnection = async (key: string) => {
    try {
      // Validate key format
      if (!key.startsWith('SG.')) {
        throw new Error('Invalid SendGrid API key format');
      }

      // Test the key by fetching user information
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.errors?.[0]?.message || 'Invalid API key');
      }

      return true;
    } catch (error) {
      console.error('SendGrid connection verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('sendgrid_connection');

      return false;
    }
  };

  const fetchSendGridStats = async (key: string) => {
    setFetchingStats(true);

    try {
      const headers = {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      };

      // Fetch user profile
      const userResponse = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers,
      });

      if (!userResponse.ok) {
        const errorData = (await userResponse.json()) as any;
        throw new Error(errorData.errors?.[0]?.message || 'Failed to fetch user data');
      }

      const userData = (await userResponse.json()) as SendGridUser;

      // Fetch reputation (if available)
      let reputation;

      try {
        const reputationResponse = await fetch('https://api.sendgrid.com/v3/user/reputation', {
          headers,
        });

        if (reputationResponse.ok) {
          const reputationData = (await reputationResponse.json()) as any;
          reputation = reputationData.reputation;
        }
      } catch (error) {
        // Reputation endpoint might not be available for all accounts
        console.log('Reputation data not available');
      }

      // Fetch credits (if available)
      let credits;

      try {
        const creditsResponse = await fetch('https://api.sendgrid.com/v3/user/credits', {
          headers,
        });

        if (creditsResponse.ok) {
          credits = await creditsResponse.json();
        }
      } catch (error) {
        // Credits endpoint might not be available for all plans
        console.log('Credits data not available');
      }

      const newStats: SendGridStats = {
        user: userData,
        reputation,
        credits: credits as any,
        lastConnected: new Date(),
      };

      setStats(newStats);

      // Save to localStorage (key is stored for validation purposes only)
      localStorage.setItem(
        'sendgrid_connection',
        JSON.stringify({
          apiKey: key,
          isConnected: true,
          stats: newStats,
        }),
      );

      return newStats;
    } catch (error) {
      console.error('Error fetching SendGrid stats:', error);
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
      // Verify the key first
      const isValid = await verifyConnection(apiKey);

      if (!isValid) {
        throw new Error('Invalid API key');
      }

      // Fetch user data and stats
      await fetchSendGridStats(apiKey);

      setIsConnected(true);
      toast.success('Successfully connected to SendGrid');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to SendGrid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey('');
    setStats(null);
    localStorage.removeItem('sendgrid_connection');
    toast.success('Disconnected from SendGrid');
  };

  const refreshStats = async () => {
    if (apiKey && isConnected) {
      try {
        await fetchSendGridStats(apiKey);
        toast.success('Stats refreshed successfully');
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  };

  const getReputationColor = (reputation?: number) => {
    if (!reputation) {
      return 'text-bolt-elements-textSecondary';
    }

    if (reputation >= 80) {
      return 'text-green-600 dark:text-green-400';
    }

    if (reputation >= 60) {
      return 'text-yellow-600 dark:text-yellow-400';
    }

    return 'text-red-600 dark:text-red-400';
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/sendgrid/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">SendGrid Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={connecting}
                placeholder="SG...."
                className={classNames(
                  'w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md',
                  'bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1',
                  'text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              />
              <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Create API Key
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Required permissions: Mail Send, User Profile</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="i-ph:info w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Free SendGrid Account</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                • Send 100 emails/day forever free • No credit card required for signup • Full email delivery and
                analytics • SMTP and Web API support
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!apiKey || connecting}
              className={classNames(
                'w-full px-4 py-2 rounded-md font-medium transition-colors',
                'bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent',
                'text-white dark:text-white',
                'hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {connecting ? 'Connecting...' : 'Connect to SendGrid'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to SendGrid</span>
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
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {stats.user.first_name?.[0] || stats.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.user.first_name && stats.user.last_name
                        ? `${stats.user.first_name} ${stats.user.last_name}`
                        : stats.user.username}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">{stats.user.email}</p>
                    {stats.user.company && (
                      <p className="text-xs text-bolt-elements-textSecondary">{stats.user.company}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {stats.reputation !== undefined && (
                    <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                      <div className={classNames('text-lg font-bold', getReputationColor(stats.reputation))}>
                        {stats.reputation}%
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">Reputation</div>
                    </div>
                  )}

                  {stats.credits && (
                    <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                      <div className="text-lg font-bold text-bolt-elements-textPrimary">
                        {stats.credits.remain.toLocaleString()}
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">Credits Left</div>
                    </div>
                  )}
                </div>

                {stats.credits && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary">Credit Usage</h5>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-bolt-elements-textSecondary">Total Credits</span>
                        <span className="text-bolt-elements-textPrimary font-medium">
                          {stats.credits.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-bolt-elements-textSecondary">Used Credits</span>
                        <span className="text-bolt-elements-textPrimary font-medium">
                          {stats.credits.used.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-bolt-elements-textSecondary">Remaining</span>
                        <span className="text-bolt-elements-textPrimary font-medium">
                          {stats.credits.remain.toLocaleString()}
                        </span>
                      </div>

                      {stats.credits.overage > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-bolt-elements-textSecondary">Overage</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {stats.credits.overage.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-bolt-elements-background dark:bg-bolt-elements-background rounded-full h-2">
                        <div
                          className="bg-bolt-elements-item-contentAccent h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((stats.credits.used / stats.credits.total) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-bolt-elements-textSecondary mt-1">
                        <span>0</span>
                        <span>{stats.credits.total.toLocaleString()} credits</span>
                      </div>
                    </div>
                  </div>
                )}

                {stats.user.country && (
                  <div className="pt-3 mt-3 border-t border-bolt-elements-borderColor">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bolt-elements-textSecondary">Location</span>
                      <span className="text-bolt-elements-textPrimary font-medium">
                        {stats.user.city && stats.user.state
                          ? `${stats.user.city}, ${stats.user.state}, ${stats.user.country}`
                          : stats.user.country}
                      </span>
                    </div>
                  </div>
                )}

                {stats.lastConnected && (
                  <div className="pt-2">
                    <span className="text-xs text-bolt-elements-textSecondary">
                      Last connected: {stats.lastConnected.toLocaleString()}
                    </span>
                  </div>
                )}
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
