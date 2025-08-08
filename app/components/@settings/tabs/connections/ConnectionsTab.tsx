import { motion } from 'framer-motion';
import React, { Suspense, useState } from 'react';
import { classNames } from '~/utils/classNames';
import ConnectionDiagnostics from './ConnectionDiagnostics';
import { Button } from '~/components/ui/Button';
import VercelConnection from './VercelConnection';

// Use React.lazy for dynamic imports
const GitHubConnection = React.lazy(() => import('./GithubConnection'));
const NetlifyConnection = React.lazy(() => import('./NetlifyConnection'));
const SupabaseConnection = React.lazy(() => import('./SupabaseConnection'));
const FirebaseConnection = React.lazy(() => import('./FirebaseConnection'));
const RailwayConnection = React.lazy(() => import('./RailwayConnection'));
const PlanetScaleConnection = React.lazy(() => import('./PlanetScaleConnection'));
const CloudflareConnection = React.lazy(() => import('./CloudflareConnection'));
const HerokuConnection = React.lazy(() => import('./HerokuConnection'));
const DockerHubConnection = React.lazy(() => import('./DockerHubConnection'));
const MongoDBConnection = React.lazy(() => import('./MongoDBConnection'));
const RedisConnection = React.lazy(() => import('./RedisConnection'));
const StripeConnection = React.lazy(() => import('./StripeConnection'));
const SendGridConnection = React.lazy(() => import('./SendGridConnection'));
const TwilioConnection = React.lazy(() => import('./TwilioConnection'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4 bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor">
    <div className="flex items-center justify-center gap-2 text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
      <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
      <span>Loading connection...</span>
    </div>
  </div>
);

export default function ConnectionsTab() {
  const [isEnvVarsExpanded, setIsEnvVarsExpanded] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const connectionCategories = [
    { id: 'all', name: 'All Services', icon: 'i-ph:stack' },
    { id: 'deployment', name: 'Deployment', icon: 'i-ph:rocket' },
    { id: 'database', name: 'Database', icon: 'i-ph:database' },
    { id: 'storage', name: 'Storage', icon: 'i-ph:folder' },
    { id: 'analytics', name: 'Analytics', icon: 'i-ph:chart-bar' },
    { id: 'auth', name: 'Authentication', icon: 'i-ph:shield-check' },
    { id: 'monitoring', name: 'Monitoring', icon: 'i-ph:eye' },
    { id: 'payment', name: 'Payment', icon: 'i-ph:credit-card' },
    { id: 'communication', name: 'Communication', icon: 'i-ph:chat-text' },
  ];

  const connections = [
    { component: GitHubConnection, category: 'deployment', priority: 1 },
    { component: NetlifyConnection, category: 'deployment', priority: 2 },
    { component: VercelConnection, category: 'deployment', priority: 3 },
    { component: RailwayConnection, category: 'deployment', priority: 4 },
    { component: HerokuConnection, category: 'deployment', priority: 5 },
    { component: DockerHubConnection, category: 'deployment', priority: 6 },
    { component: SupabaseConnection, category: 'database', priority: 1 },
    { component: PlanetScaleConnection, category: 'database', priority: 2 },
    { component: MongoDBConnection, category: 'database', priority: 3 },
    { component: RedisConnection, category: 'database', priority: 4 },
    { component: FirebaseConnection, category: 'auth', priority: 1 },
    { component: CloudflareConnection, category: 'analytics', priority: 1 },
    { component: StripeConnection, category: 'payment', priority: 1 },
    { component: SendGridConnection, category: 'communication', priority: 1 },
    { component: TwilioConnection, category: 'communication', priority: 2 },
  ];

  const filteredConnections =
    activeCategory === 'all'
      ? connections.sort((a, b) => a.priority - b.priority)
      : connections.filter((conn) => conn.category === activeCategory).sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="i-ph:plugs-connected w-5 h-5 text-bolt-elements-item-contentAccent dark:text-bolt-elements-item-contentAccent" />
          <h2 className="text-lg font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
            Connection Settings
          </h2>
        </div>
        <Button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          variant="outline"
          className="flex items-center gap-2 hover:bg-bolt-elements-item-backgroundActive/10 hover:text-bolt-elements-textPrimary dark:hover:bg-bolt-elements-item-backgroundActive/10 dark:hover:text-bolt-elements-textPrimary transition-colors"
        >
          {showDiagnostics ? (
            <>
              <div className="i-ph:eye-slash w-4 h-4" />
              Hide Diagnostics
            </>
          ) : (
            <>
              <div className="i-ph:wrench w-4 h-4" />
              Troubleshoot Connections
            </>
          )}
        </Button>
      </motion.div>
      <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
        Manage your external service connections and integrations
      </p>

      {/* Diagnostics Tool - Conditionally rendered */}
      {showDiagnostics && <ConnectionDiagnostics />}

      {/* Environment Variables Info - Collapsible */}
      <motion.div
        className="bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6">
          <button
            onClick={() => setIsEnvVarsExpanded(!isEnvVarsExpanded)}
            className={classNames(
              'w-full bg-transparent flex items-center justify-between',
              'hover:bg-bolt-elements-item-backgroundActive/10 hover:text-bolt-elements-textPrimary',
              'dark:hover:bg-bolt-elements-item-backgroundActive/10 dark:hover:text-bolt-elements-textPrimary',
              'rounded-md p-2 -m-2 transition-colors',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="i-ph:info w-5 h-5 text-bolt-elements-item-contentAccent dark:text-bolt-elements-item-contentAccent" />
              <h3 className="text-base font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                Environment Variables
              </h3>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary transition-transform',
                isEnvVarsExpanded ? 'rotate-180' : '',
              )}
            />
          </button>

          {isEnvVarsExpanded && (
            <div className="mt-4">
              <p className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mb-2">
                You can configure connections using environment variables in your{' '}
                <code className="px-1 py-0.5 bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 rounded">
                  .env.local
                </code>{' '}
                file:
              </p>
              <div className="bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 p-3 rounded-md text-xs font-mono overflow-x-auto">
                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary">
                  # Deployment Services
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_GITHUB_ACCESS_TOKEN=your_github_token
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_NETLIFY_ACCESS_TOKEN=your_netlify_token
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_VERCEL_ACCESS_TOKEN=your_vercel_token
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_RAILWAY_API_TOKEN=your_railway_token
                </div>

                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-2">
                  # Database Services
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_SUPABASE_URL=your_supabase_url
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_PLANETSCALE_DATABASE_URL=your_planetscale_url
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_MONGODB_CONNECTION_STRING=your_mongodb_string
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_REDIS_URL=your_redis_url
                </div>

                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-2">
                  # Firebase Configuration
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_FIREBASE_API_KEY=your_firebase_api_key
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_FIREBASE_PROJECT_ID=your_project_id
                </div>

                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-2">
                  # Cloudflare Services
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_CLOUDFLARE_API_TOKEN=your_cloudflare_token
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_CLOUDFLARE_ZONE_ID=your_zone_id
                </div>

                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-2">
                  # Payment Services
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_STRIPE_SECRET_KEY=your_stripe_secret_key
                </div>

                <div className="text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary mt-2">
                  # Communication Services
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_SENDGRID_API_KEY=your_sendgrid_api_key
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
                </div>
                <div className="text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary">
                  VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
                </div>
              </div>
              <div className="mt-3 text-xs text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary space-y-1">
                <p>
                  <span className="font-medium">Token types:</span>
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>
                    <span className="font-medium">classic</span> - Personal Access Token with{' '}
                    <code className="px-1 py-0.5 bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 rounded">
                      repo, read:org, read:user
                    </code>{' '}
                    scopes
                  </li>
                  <li>
                    <span className="font-medium">fine-grained</span> - Fine-grained token with Repository and
                    Organization access
                  </li>
                </ul>
                <p className="mt-2">
                  When set, these variables will be used automatically without requiring manual connection.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Service Categories Filter */}
      <motion.div
        className="bg-bolt-elements-background dark:bg-bolt-elements-background rounded-lg border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary mb-3">
          Filter by Service Type
        </h3>
        <div className="flex flex-wrap gap-2">
          {connectionCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeCategory === category.id
                  ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-textPrimary'
                  : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive/50 hover:text-bolt-elements-textPrimary',
              )}
            >
              <div className={`${category.icon} w-4 h-4`} />
              {category.name}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredConnections.map((connection, index) => {
          const Component = connection.component;
          return (
            <motion.div
              key={`${connection.category}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Component />
              </Suspense>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced help section with free tier information */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-sm text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-2 p-4 rounded-lg">
          <p className="flex items-center gap-1 mb-2">
            <span className="i-ph:lightbulb w-4 h-4 text-bolt-elements-icon-success dark:text-bolt-elements-icon-success" />
            <span className="font-medium">Troubleshooting Tip:</span>
          </p>
          <p className="mb-2">
            If you're having trouble with connections, try using the troubleshooting tool at the top of this page. It
            can help diagnose and fix common connection issues.
          </p>
          <p>For persistent issues:</p>
          <ol className="list-decimal list-inside pl-4 mt-1">
            <li>Check your browser console for errors</li>
            <li>Verify that your tokens have the correct permissions</li>
            <li>Try clearing your browser cache and cookies</li>
            <li>Ensure your browser allows third-party cookies if using integrations</li>
          </ol>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <h4 className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            <span className="i-ph:gift w-4 h-4" />
            Free Tier Services Available
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-green-700 dark:text-green-300">
            <div>
              <p className="font-medium mb-1">Deployment & Hosting:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Netlify: 100GB bandwidth/month</li>
                <li>Vercel: 100GB bandwidth, 6000 build minutes</li>
                <li>Railway: $5 free credit monthly</li>
                <li>Heroku: 550 dyno hours/month</li>
                <li>GitHub Pages: Unlimited public sites</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Database & Storage:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Supabase: 500MB database, 1GB storage</li>
                <li>PlanetScale: 5GB storage, 1 billion reads</li>
                <li>MongoDB Atlas: 512MB storage</li>
                <li>Redis Cloud: 30MB storage</li>
                <li>Firebase: 1GB storage, 125K reads/day</li>
                <li>Cloudflare: 100K requests/day</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Payment & Communication:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Stripe: No monthly fees, pay per transaction</li>
                <li>SendGrid: 100 emails/day free forever</li>
                <li>Twilio: $15.50 free trial credit</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
