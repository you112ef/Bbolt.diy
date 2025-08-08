import { useEffect, useMemo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogRoot, DialogClose, DialogTitle, DialogButton } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { useMCPStore } from '~/lib/stores/mcp';
import McpServerList from '~/components/@settings/tabs/mcp/McpServerList';
import { useSettingsStore } from '~/lib/stores/settings';

// Timeout helper to avoid long-hanging operations
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms) as unknown as number;
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }) as Promise<T>;
}

export function McpTools() {
  const isInitialized = useMCPStore((state) => state.isInitialized);
  const serverTools = useMCPStore((state) => state.serverTools);
  const initialize = useMCPStore((state) => state.initialize);
  const checkServersAvailabilities = useMCPStore((state) => state.checkServersAvailabilities);
  const settings = useMCPStore((state) => state.settings);

  const openSettings = useSettingsStore((s) => s.openSettings);
  const setSelectedTab = useSettingsStore((s) => s.setSelectedTab);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingServers, setIsCheckingServers] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(false);

  useEffect(() => {
    // No eager initialization; initialize on open
  }, []);

  const checkServerAvailability = async () => {
    setIsCheckingServers(true);
    setError(null);
    console.debug('[MCP Tools] Checking servers availability...');

    try {
      await withTimeout(checkServersAvailabilities(), 10_000, 'checkServersAvailabilities');
      console.debug('[MCP Tools] Servers availability check completed');
    } catch (e) {
      console.error('[MCP Tools] Failed to check server availability:', e);
      setError(`Failed to check server availability: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCheckingServers(false);
    }
  };

  const toggleServerExpanded = (serverName: string) => {
    setExpandedServer(expandedServer === serverName ? null : serverName);
  };

  const handleDialogOpen = async (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      try {
        // Ensure store is initialized when opening
        if (!isInitialized) {
          console.debug('[MCP Tools] Initializing MCP store...');
          setIsBooting(true);
          await withTimeout(initialize(), 10_000, 'initialize');
          console.debug('[MCP Tools] MCP store initialized');
        }
        // If there are configured servers, auto-check availability
        const hasServers = Object.keys(settings?.mcpConfig?.mcpServers || {}).length > 0;
        if (hasServers) {
          await checkServerAvailability();
        } else {
          console.debug('[MCP Tools] No MCP servers configured; skipping availability check');
        }
      } catch (e) {
        console.error('[MCP Tools] Initialization failed:', e);
        setError(`Initialization failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setIsBooting(false);
      }
    } else {
      // Reset transient UI state when dialog closes
      setIsCheckingServers(false);
      setExpandedServer(null);
      setError(null);
    }
  };

  const openMcpSettings = () => {
    // Open settings panel directly on MCP tab
    setSelectedTab('mcp');
    openSettings();
    setIsDialogOpen(false);
  };

  const serverEntries = useMemo(() => Object.entries(serverTools), [serverTools]);

  return (
    <div className="relative">
      <div className="flex">
        <IconButton
          onClick={() => handleDialogOpen(!isDialogOpen)}
          title="MCP Tools"
          className="transition-all"
        >
          {isBooting ? (
            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
          ) : (
            <div className="i-bolt:mcp text-xl"></div>
          )}
        </IconButton>
      </div>

      <DialogRoot open={isDialogOpen} onOpenChange={handleDialogOpen}>
        {isDialogOpen && (
          <Dialog className="max-w-4xl w-full p-6">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <DialogTitle>
                <div className="i-bolt:mcp text-xl"></div>
                MCP tools
              </DialogTitle>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <button
                      onClick={checkServerAvailability}
                      disabled={isCheckingServers || serverEntries.length === 0}
                      className={classNames(
                        'px-3 py-1.5 rounded-lg text-sm',
                        'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4',
                        'text-bolt-elements-textPrimary',
                        'transition-all duration-200',
                        'flex items-center gap-2',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      {isCheckingServers ? (
                        <div className="i-svg-spinners:90-ring-with-bg w-3 h-3 text-bolt-elements-loader-progress animate-spin" />
                      ) : (
                        <div className="i-ph:arrow-counter-clockwise w-3 h-3" />
                      )}
                      Check availability
                    </button>

                    <button
                      onClick={openMcpSettings}
                      className={classNames(
                        'px-3 py-1.5 rounded-lg text-sm',
                        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent',
                        'hover:bg-bolt-elements-item-backgroundActive',
                        'transition-all duration-200',
                        'flex items-center gap-2',
                      )}
                    >
                      <div className="i-ph:sliders w-3 h-3" />
                      Open MCP Settings
                    </button>
                  </div>
                  {serverEntries.length > 0 ? (
                    <McpServerList
                      checkingServers={isCheckingServers}
                      expandedServer={expandedServer}
                      serverEntries={serverEntries}
                      onlyShowAvailableServers={true}
                      toggleServerExpanded={toggleServerExpanded}
                    />
                  ) : (
                    <div className="py-4 text-center text-bolt-elements-textSecondary">
                      <p>No MCP servers configured</p>
                      <p className="text-xs mt-1">Configure servers in Settings → MCP Servers</p>
                    </div>
                  )}
                </div>

                <div>{error && <p className="mt-2 text-sm text-bolt-elements-icon-error">{error}</p>}</div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <DialogButton type="secondary">Close</DialogButton>
                  </DialogClose>
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </DialogRoot>
    </div>
  );
}
