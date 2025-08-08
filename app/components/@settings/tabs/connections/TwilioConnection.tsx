import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface TwilioAccount {
  sid: string;
  friendly_name: string;
  status: string;
  type: string;
  auth_token: string;
  owner_account_sid: string;
  date_created: string;
  date_updated: string;
}

interface TwilioBalance {
  account_sid: string;
  balance: string;
  currency: string;
}

interface TwilioStats {
  account: TwilioAccount | null;
  balance: TwilioBalance | null;
  lastConnected?: Date;
}

export default function TwilioConnection() {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<TwilioStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('twilio_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setAccountSid(parsed.accountSid || '');
        setAuthToken(parsed.authToken || '');
        setIsConnected(parsed.isConnected || false);
        setStats(parsed.stats || null);
        
        // Verify connection is still valid
        if (parsed.isConnected && parsed.accountSid && parsed.authToken) {
          verifyConnection(parsed.accountSid, parsed.authToken);
        }
      } catch (error) {
        console.error('Error loading saved Twilio connection:', error);
        localStorage.removeItem('twilio_connection');
      }
    }
  }, []);

  const verifyConnection = async (sid: string, token: string) => {
    try {
      // Validate SID format
      if (!sid.startsWith('AC')) {
        throw new Error('Invalid Twilio Account SID format');
      }

      // Test the credentials by fetching account information
      const credentials = btoa(`${sid}:${token}`);
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Account SID or Auth Token');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Twilio connection verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('twilio_connection');
      return false;
    }
  };

  const fetchTwilioStats = async (sid: string, token: string) => {
    setFetchingStats(true);
    try {
      const credentials = btoa(`${sid}:${token}`);
      const headers = {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // Fetch account info
      const accountResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers
      });

      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account data: ${accountResponse.statusText}`);
      }

      const accountData = await accountResponse.json() as TwilioAccount;

      // Fetch balance
      let balanceData: TwilioBalance | null = null;
      try {
        const balanceResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
          headers
        });

        if (balanceResponse.ok) {
          balanceData = await balanceResponse.json() as TwilioBalance;
        }
      } catch (error) {
        // Balance endpoint might fail for some account types
        console.log('Balance data not available');
      }

      const newStats: TwilioStats = {
        account: accountData,
        balance: balanceData,
        lastConnected: new Date()
      };

      setStats(newStats);
      
      // Save to localStorage (credentials are stored for validation purposes only)
      localStorage.setItem('twilio_connection', JSON.stringify({
        accountSid: sid,
        authToken: token,
        isConnected: true,
        stats: newStats
      }));

      return newStats;
    } catch (error) {
      console.error('Error fetching Twilio stats:', error);
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
      // Verify the credentials first
      const isValid = await verifyConnection(accountSid, authToken);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Fetch account data and balance
      await fetchTwilioStats(accountSid, authToken);
      
      setIsConnected(true);
      toast.success('Successfully connected to Twilio');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to Twilio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccountSid('');
    setAuthToken('');
    setStats(null);
    localStorage.removeItem('twilio_connection');
    toast.success('Disconnected from Twilio');
  };

  const refreshStats = async () => {
    if (accountSid && authToken && isConnected) {
      try {
        await fetchTwilioStats(accountSid, authToken);
        toast.success('Stats refreshed successfully');
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'suspended':
        return 'text-red-600 dark:text-red-400';
      case 'closed':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const formatBalance = (balance: string, currency: string) => {
    const amount = parseFloat(balance);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/twilio/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Twilio Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Account SID</label>
              <input
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                disabled={connecting}
                placeholder="AC..."
                className={classNames(
                  "w-full px-3 py-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-md",
                  "bg-bolt-elements-backgroundDepth-1 dark:bg-bolt-elements-backgroundDepth-1",
                  "text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary",
                  "placeholder-bolt-elements-textSecondary dark:placeholder-bolt-elements-textSecondary",
                  "focus:outline-none focus:ring-2 focus:ring-bolt-elements-item-contentAccent dark:focus:ring-bolt-elements-item-contentAccent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
            </div>
            
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Auth Token</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                disabled={connecting}
                placeholder="Your Twilio Auth Token"
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
                  href="https://console.twilio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Get Credentials
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Find your Account SID and Auth Token in the Console</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="i-ph:info w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Free Twilio Trial
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                • $15.50 free trial credit when you sign up
                • Send SMS, make voice calls worldwide
                • No monthly fees, pay-as-you-go pricing
                • WhatsApp Business API available
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!accountSid || !authToken || connecting}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent",
                "text-white dark:text-white",
                "hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {connecting ? 'Connecting...' : 'Connect to Twilio'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to Twilio</span>
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
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-medium">
                    <div className="i-ph:phone w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.account.friendly_name || 'Twilio Account'}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">{stats.account.sid}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={classNames(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        stats.account.status === 'active'
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : stats.account.status === 'suspended'
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      )}>
                        {stats.account.status}
                      </span>
                      <span className="text-xs text-bolt-elements-textSecondary">
                        {stats.account.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                {stats.balance && (
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                      <div className="text-lg font-bold text-bolt-elements-textPrimary">
                        {formatBalance(stats.balance.balance, stats.balance.currency)}
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">Account Balance</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">Account Type</span>
                    <span className="text-bolt-elements-textPrimary font-medium">
                      {stats.account.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">Status</span>
                    <span className={classNames("font-medium", getStatusColor(stats.account.status))}>
                      {stats.account.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">Created</span>
                    <span className="text-bolt-elements-textPrimary font-medium">
                      {new Date(stats.account.date_created).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bolt-elements-textSecondary">Last Updated</span>
                    <span className="text-bolt-elements-textPrimary font-medium">
                      {new Date(stats.account.date_updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Services Available */}
                <div className="mt-4 pt-3 border-t border-bolt-elements-borderColor">
                  <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Available Services</h5>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'SMS', icon: 'i-ph:chat-text' },
                      { name: 'Voice', icon: 'i-ph:phone' },
                      { name: 'Video', icon: 'i-ph:video-camera' },
                      { name: 'WhatsApp', icon: 'i-ph:whatsapp-logo' },
                      { name: 'Email', icon: 'i-ph:envelope' },
                      { name: 'Verify', icon: 'i-ph:shield-check' }
                    ].map((service) => (
                      <span
                        key={service.name}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-bolt-elements-background border border-bolt-elements-borderColor text-bolt-elements-textSecondary"
                      >
                        <div className={`${service.icon} w-3 h-3`} />
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>

                {stats.lastConnected && (
                  <div className="pt-3">
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