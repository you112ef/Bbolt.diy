import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface StripeAccount {
  id: string;
  business_profile?: {
    name?: string;
    url?: string;
  };
  country: string;
  default_currency: string;
  email?: string;
  type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
  }>;
}

interface StripeStats {
  account: StripeAccount | null;
  balance: StripeBalance | null;
  testMode: boolean;
  lastConnected?: Date;
}

export default function StripeConnection() {
  const [secretKey, setSecretKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<StripeStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('stripe_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setSecretKey(parsed.secretKey || '');
        setIsConnected(parsed.isConnected || false);
        setStats(parsed.stats || null);
        
        // Verify connection is still valid
        if (parsed.isConnected && parsed.secretKey) {
          verifyConnection(parsed.secretKey);
        }
      } catch (error) {
        console.error('Error loading saved Stripe connection:', error);
        localStorage.removeItem('stripe_connection');
      }
    }
  }, []);

  const verifyConnection = async (key: string) => {
    try {
      // Validate key format
      if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
        throw new Error('Invalid Stripe secret key format');
      }

      const isTestMode = key.startsWith('sk_test_');
      
      // Test the key by fetching account information
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error?.message || 'Invalid API key');
      }

      return true;
    } catch (error) {
      console.error('Stripe connection verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('stripe_connection');
      return false;
    }
  };

  const fetchStripeStats = async (key: string) => {
    setFetchingStats(true);
    try {
      const isTestMode = key.startsWith('sk_test_');
      
      const headers = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // Fetch account info
      const accountResponse = await fetch('https://api.stripe.com/v1/account', {
        headers
      });

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json() as any;
        throw new Error(errorData.error?.message || 'Failed to fetch account data');
      }

      const accountData = await accountResponse.json() as StripeAccount;

      // Fetch balance
      const balanceResponse = await fetch('https://api.stripe.com/v1/balance', {
        headers
      });

      let balanceData: StripeBalance | null = null;
      if (balanceResponse.ok) {
        balanceData = await balanceResponse.json() as StripeBalance;
      }

      const newStats: StripeStats = {
        account: accountData,
        balance: balanceData,
        testMode: isTestMode,
        lastConnected: new Date()
      };

      setStats(newStats);
      
      // Save to localStorage (key is stored for validation purposes only)
      localStorage.setItem('stripe_connection', JSON.stringify({
        secretKey: key,
        isConnected: true,
        stats: newStats
      }));

      return newStats;
    } catch (error) {
      console.error('Error fetching Stripe stats:', error);
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
      const isValid = await verifyConnection(secretKey);
      if (!isValid) {
        throw new Error('Invalid API key');
      }

      // Fetch account data and balance
      await fetchStripeStats(secretKey);
      
      setIsConnected(true);
      toast.success('Successfully connected to Stripe');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSecretKey('');
    setStats(null);
    localStorage.removeItem('stripe_connection');
    toast.success('Disconnected from Stripe');
  };

  const refreshStats = async () => {
    if (secretKey && isConnected) {
      try {
        await fetchStripeStats(secretKey);
        toast.success('Stats refreshed successfully');
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/stripe/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Stripe Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Secret Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={connecting}
                placeholder="sk_test_... or sk_live_..."
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
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Get API Keys
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Use test keys (sk_test_...) for development</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="i-ph:info w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Free Stripe Account
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                • No monthly fees, pay per transaction
                • Test mode available for development
                • Accept all major payment methods
                • Built-in fraud protection
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!secretKey || connecting}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent",
                "text-white dark:text-white",
                "hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {connecting ? 'Connecting...' : 'Connect to Stripe'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to Stripe</span>
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
            
            {stats?.account && (
              <div className="bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={classNames(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                    stats.testMode ? "bg-orange-500" : "bg-purple-600"
                  )}>
                    <div className="i-ph:credit-card w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.account.business_profile?.name || stats.account.email || 'Stripe Account'}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">
                      {stats.account.id} • {stats.account.country}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={classNames(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        stats.testMode 
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}>
                        {stats.testMode ? 'Test Mode' : 'Live Mode'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-sm font-bold text-bolt-elements-textPrimary">
                      {stats.account.default_currency.toUpperCase()}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Currency</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className={classNames(
                      "text-sm font-bold",
                      stats.account.charges_enabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {stats.account.charges_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Charges</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className={classNames(
                      "text-sm font-bold",
                      stats.account.payouts_enabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {stats.account.payouts_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Payouts</div>
                  </div>
                </div>

                {stats.balance && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary">Account Balance</h5>
                    
                    {stats.balance.available.length > 0 && (
                      <div>
                        <h6 className="text-xs font-medium text-bolt-elements-textSecondary mb-2">Available</h6>
                        <div className="space-y-1">
                          {stats.balance.available.map((balance, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-bolt-elements-background dark:bg-bolt-elements-background rounded">
                              <span className="text-sm text-bolt-elements-textSecondary">
                                {balance.currency.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-bolt-elements-textPrimary">
                                {formatAmount(balance.amount, balance.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stats.balance.pending.length > 0 && (
                      <div>
                        <h6 className="text-xs font-medium text-bolt-elements-textSecondary mb-2">Pending</h6>
                        <div className="space-y-1">
                          {stats.balance.pending.map((balance, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-bolt-elements-background dark:bg-bolt-elements-background rounded">
                              <span className="text-sm text-bolt-elements-textSecondary">
                                {balance.currency.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-bolt-elements-textPrimary">
                                {formatAmount(balance.amount, balance.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stats.lastConnected && (
                  <div className="pt-3 mt-3 border-t border-bolt-elements-borderColor">
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