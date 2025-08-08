import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface DockerHubUser {
  id: string;
  username: string;
  full_name?: string;
  location?: string;
  company?: string;
  profile_url: string;
  gravatar_url?: string;
  gravatar_email?: string;
  type: string;
  date_joined: string;
}

interface DockerHubRepository {
  user: string;
  name: string;
  namespace: string;
  repository_type: string;
  status: number;
  description?: string;
  is_private: boolean;
  is_automated: boolean;
  can_edit: boolean;
  star_count: number;
  pull_count: number;
  last_updated: string;
  date_registered: string;
  collaborator: boolean;
  affiliation?: string;
}

interface DockerHubStats {
  user: DockerHubUser | null;
  repositories: DockerHubRepository[];
  totalRepos: number;
  totalStars: number;
  totalPulls: number;
}

export default function DockerHubConnection() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<DockerHubStats | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  // Load saved connection from localStorage
  useEffect(() => {
    const savedConnection = localStorage.getItem('dockerhub_connection');
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection);
        setUsername(parsed.username);
        setToken(parsed.token);
        setIsConnected(parsed.isConnected);
        setStats(parsed.stats);
        
        // Verify connection is still valid
        if (parsed.isConnected && parsed.username) {
          verifyConnection(parsed.username, parsed.token);
        }
      } catch (error) {
        console.error('Error loading saved DockerHub connection:', error);
        localStorage.removeItem('dockerhub_connection');
      }
    }
  }, []);

  const verifyConnection = async (user: string, accessToken?: string) => {
    try {
      // Try to fetch user info to verify connection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`https://hub.docker.com/v2/users/${user}/`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('DockerHub connection verification failed:', error);
      setIsConnected(false);
      setStats(null);
      localStorage.removeItem('dockerhub_connection');
      return false;
    }
  };

  const fetchDockerHubStats = async (user: string, accessToken?: string) => {
    setFetchingStats(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch user info
      const userResponse = await fetch(`https://hub.docker.com/v2/users/${user}/`, {
        headers
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json() as DockerHubUser;

      // Fetch repositories
      const reposResponse = await fetch(`https://hub.docker.com/v2/repositories/${user}/?page_size=100`, {
        headers
      });

      if (!reposResponse.ok) {
        throw new Error(`Failed to fetch repositories: ${reposResponse.statusText}`);
      }

      const reposData = await reposResponse.json() as any;
      const repositories: DockerHubRepository[] = reposData.results || [];

      // Calculate stats
      const totalStars = repositories.reduce((sum, repo) => sum + repo.star_count, 0);
      const totalPulls = repositories.reduce((sum, repo) => sum + repo.pull_count, 0);

      const newStats: DockerHubStats = {
        user: userData,
        repositories: repositories.slice(0, 10), // Limit to first 10 repos for display
        totalRepos: reposData.count || repositories.length,
        totalStars,
        totalPulls
      };

      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem('dockerhub_connection', JSON.stringify({
        username: user,
        token: accessToken || '',
        isConnected: true,
        stats: newStats
      }));

      return newStats;
    } catch (error) {
      console.error('Error fetching DockerHub stats:', error);
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
      // Verify the username/token combination
      const isValid = await verifyConnection(username, token);
      if (!isValid) {
        throw new Error('Invalid username or access token');
      }

      // Fetch user data and repositories
      await fetchDockerHubStats(username, token);
      
      setIsConnected(true);
      toast.success('Successfully connected to DockerHub');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect to DockerHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
      setStats(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setUsername('');
    setToken('');
    setStats(null);
    localStorage.removeItem('dockerhub_connection');
    toast.success('Disconnected from DockerHub');
  };

  const refreshStats = async () => {
    if (username && isConnected) {
      try {
        await fetchDockerHubStats(username, token);
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
              src={`https://cdn.simpleicons.org/docker/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">DockerHub Connection</h3>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={connecting}
                placeholder="Enter your DockerHub username"
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
              <label className="block text-sm text-bolt-elements-textSecondary mb-2">Access Token (Optional)</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={connecting}
                placeholder="Enter your DockerHub access token (optional for public repos)"
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
                  href="https://hub.docker.com/settings/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bolt-elements-item-contentAccent hover:underline inline-flex items-center gap-1"
                >
                  Create Access Token
                  <div className="i-ph:arrow-square-out w-4 h-4" />
                </a>
                <span className="mx-2">•</span>
                <span>Token provides access to private repositories</span>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={!username || connecting}
              className={classNames(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                "bg-bolt-elements-item-contentAccent dark:bg-bolt-elements-item-contentAccent",
                "text-white dark:text-white",
                "hover:bg-bolt-elements-item-contentAccent/90 dark:hover:bg-bolt-elements-item-contentAccent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {connecting ? 'Connecting...' : 'Connect to DockerHub'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="i-ph:check-circle w-5 h-5" />
                <span className="text-sm font-medium">Connected to DockerHub</span>
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
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {stats.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {stats.user.full_name || stats.user.username}
                    </h4>
                    <p className="text-xs text-bolt-elements-textSecondary">@{stats.user.username}</p>
                    {stats.user.company && (
                      <p className="text-xs text-bolt-elements-textSecondary">{stats.user.company}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.totalRepos}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Repositories</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">{stats.totalStars}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">Stars</div>
                  </div>
                  <div className="text-center p-3 bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg">
                    <div className="text-lg font-bold text-bolt-elements-textPrimary">
                      {stats.totalPulls > 1000000 
                        ? `${(stats.totalPulls / 1000000).toFixed(1)}M`
                        : stats.totalPulls > 1000
                        ? `${(stats.totalPulls / 1000).toFixed(1)}K`
                        : stats.totalPulls
                      }
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">Pulls</div>
                  </div>
                </div>
                
                {stats.repositories.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">Recent Repositories</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stats.repositories.map((repo) => (
                        <div key={`${repo.namespace}/${repo.name}`} className="flex items-center justify-between p-2 bg-bolt-elements-background dark:bg-bolt-elements-background rounded">
                          <div>
                            <div className="text-sm font-medium text-bolt-elements-textPrimary">
                              {repo.namespace}/{repo.name}
                            </div>
                            {repo.description && (
                              <div className="text-xs text-bolt-elements-textSecondary line-clamp-1">
                                {repo.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-bolt-elements-textSecondary">
                            <span className="flex items-center gap-1">
                              <div className="i-ph:star w-3 h-3" />
                              {repo.star_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="i-ph:download w-3 h-3" />
                              {repo.pull_count > 1000000 
                                ? `${(repo.pull_count / 1000000).toFixed(1)}M`
                                : repo.pull_count > 1000
                                ? `${(repo.pull_count / 1000).toFixed(1)}K`
                                : repo.pull_count
                              }
                            </span>
                            {repo.is_private && (
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Private
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