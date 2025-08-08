import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

export default function CloudflareConnection() {
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnecting(true);

    try {
      // TODO: Implement Cloudflare API connection
      // For now, just simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      toast.success('Successfully connected to Cloudflare');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to Cloudflare');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setToken('');
    toast.success('Disconnected from Cloudflare');
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
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="i-ph:check-circle w-5 h-5" />
              <span className="text-sm font-medium">Connected to Cloudflare</span>
            </div>
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