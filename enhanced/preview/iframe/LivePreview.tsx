import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { FilesStore } from '~/lib/stores/files';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Badge } from '~/components/ui/Badge';
import { Tooltip } from '~/components/ui/Tooltip';
import { Dropdown } from '~/components/ui/Dropdown';
import type { FileMap } from '~/lib/stores/files';

interface LivePreviewProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialUrl?: string;
  showDevTools?: boolean;
  enableConsole?: boolean;
  onError?: (error: string) => void;
  onLoad?: (url: string) => void;
  onUrlChange?: (url: string) => void;
}

interface PreviewFrame {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  error?: string;
  timestamp: number;
}

interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  source?: string;
}

// Device presets for responsive testing
const devicePresets = [
  { name: 'Desktop', width: '100%', height: '100%', icon: 'i-ph:desktop' },
  { name: 'Laptop', width: 1366, height: 768, icon: 'i-ph:laptop' },
  { name: 'Tablet', width: 768, height: 1024, icon: 'i-ph:device-tablet' },
  { name: 'Mobile', width: 375, height: 667, icon: 'i-ph:device-mobile' },
  { name: 'iPhone', width: 390, height: 844, icon: 'i-ph:device-mobile' },
  { name: 'iPad', width: 820, height: 1180, icon: 'i-ph:device-tablet' },
];

// HTML template for preview
const createPreviewHTML = (files: FileMap): string => {
  const htmlFiles = Object.entries(files).filter(([path]) => 
    path.endsWith('.html') || path.endsWith('.htm')
  );
  
  const cssFiles = Object.entries(files).filter(([path]) => 
    path.endsWith('.css')
  );
  
  const jsFiles = Object.entries(files).filter(([path]) => 
    path.endsWith('.js') && !path.includes('node_modules')
  );

  // Find main HTML file (index.html or first HTML file)
  let mainHtml = htmlFiles.find(([path]) => 
    path.includes('index.html') || path.endsWith('index.html')
  )?.[1]?.content || htmlFiles[0]?.[1]?.content;

  if (!mainHtml) {
    // Create a basic HTML template if no HTML files exist
    mainHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            opacity: 0.9;
        }
        .files-list {
            margin-top: 2rem;
            text-align: left;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 1rem;
            backdrop-filter: blur(10px);
        }
        .file-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .file-item:last-child {
            border-bottom: none;
        }
        .file-name {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Live Preview</h1>
        <p>Your enhanced Bolt.diy environment is ready!</p>
        <p>Create an <code>index.html</code> file to see your project preview here.</p>
        
        <div class="files-list">
            <h3>📁 Current Files:</h3>
            ${Object.keys(files).map(path => 
              `<div class="file-item">
                <span class="file-name">${path}</span>
              </div>`
            ).join('')}
        </div>
    </div>
    
    <script>
        console.log('🚀 Enhanced Live Preview loaded!');
        console.log('Files in workspace:', ${JSON.stringify(Object.keys(files))});
        
        // Auto-refresh detection
        let lastModified = ${Date.now()};
        
        function checkForUpdates() {
            // This would typically be handled by the parent frame
            // For now, we'll just log that we're checking
            console.log('Checking for updates...');
        }
        
        // Check for updates every 2 seconds when auto-refresh is enabled
        if (window.parent.autoRefreshEnabled) {
            setInterval(checkForUpdates, 2000);
        }
        
        // Enhanced console logging for better debugging
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({
                type: 'console',
                level: 'log',
                message: args.join(' '),
                timestamp: Date.now()
            }, '*');
        };
        
        console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.parent.postMessage({
                type: 'console',
                level: 'warn',
                message: args.join(' '),
                timestamp: Date.now()
            }, '*');
        };
        
        console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({
                type: 'console',
                level: 'error',
                message: args.join(' '),
                timestamp: Date.now()
            }, '*');
        };
        
        // Report when page is ready
        window.addEventListener('load', () => {
            window.parent.postMessage({
                type: 'load',
                url: window.location.href,
                title: document.title,
                timestamp: Date.now()
            }, '*');
        });
        
        // Report errors
        window.addEventListener('error', (event) => {
            window.parent.postMessage({
                type: 'error',
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            }, '*');
        });
        
        // Report unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            window.parent.postMessage({
                type: 'error',
                message: 'Unhandled Promise Rejection: ' + event.reason,
                timestamp: Date.now()
            }, '*');
        });
    </script>
</body>
</html>`;
  }

  // Inject CSS files
  const cssIncludes = cssFiles.map(([path, file]) => 
    `<style data-file="${path}">\n${file.content}\n</style>`
  ).join('\n');

  // Inject JS files
  const jsIncludes = jsFiles.map(([path, file]) => 
    `<script data-file="${path}">\n${file.content}\n</script>`
  ).join('\n');

  // Insert CSS and JS into HTML
  let enhancedHtml = mainHtml;
  
  // Insert CSS before closing head tag
  if (cssIncludes) {
    enhancedHtml = enhancedHtml.replace(
      /<\/head>/i, 
      `${cssIncludes}\n</head>`
    );
  }
  
  // Insert JS before closing body tag
  if (jsIncludes) {
    enhancedHtml = enhancedHtml.replace(
      /<\/body>/i, 
      `${jsIncludes}\n</body>`
    );
  }

  return enhancedHtml;
};

export const LivePreview: React.FC<LivePreviewProps> = ({
  width = '100%',
  height = '100%',
  className,
  autoRefresh = true,
  refreshInterval = 1000,
  initialUrl,
  showDevTools = true,
  enableConsole = true,
  onError,
  onLoad,
  onUrlChange,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl || 'about:blank');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [selectedDevice, setSelectedDevice] = useState(devicePresets[0]);
  const [showConsole, setShowConsole] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  const files = useStore(filesStore);

  // Generate preview content from files
  const previewContent = useMemo(() => {
    return createPreviewHTML(files);
  }, [files]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshPreview();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, previewContent]);

  // Message handler for iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const { type, ...data } = event.data;

      switch (type) {
        case 'console':
          if (enableConsole) {
            const message: ConsoleMessage = {
              id: `${Date.now()}-${Math.random()}`,
              type: data.level,
              message: data.message,
              timestamp: data.timestamp,
            };
            setConsoleMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
          }
          break;

        case 'load':
          setIsLoading(false);
          setError(null);
          onLoad?.(data.url);
          break;

        case 'error':
          const errorMessage = `${data.message} (${data.filename}:${data.lineno}:${data.colno})`;
          setError(errorMessage);
          onError?.(errorMessage);
          
          if (enableConsole) {
            const consoleError: ConsoleMessage = {
              id: `${Date.now()}-${Math.random()}`,
              type: 'error',
              message: errorMessage,
              timestamp: data.timestamp,
            };
            setConsoleMessages(prev => [...prev.slice(-99), consoleError]);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [enableConsole, onError, onLoad]);

  const refreshPreview = useCallback(() => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    setError(null);
    setLastRefresh(Date.now());

    // Create blob URL for preview content
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;
    setCurrentUrl(url);
    onUrlChange?.(url);

    // Cleanup previous blob URL
    const prevSrc = iframeRef.current.getAttribute('data-prev-src');
    if (prevSrc && prevSrc.startsWith('blob:')) {
      URL.revokeObjectURL(prevSrc);
    }
    iframeRef.current.setAttribute('data-prev-src', url);
  }, [previewContent, onUrlChange]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newZoom / 100})`;
      iframeRef.current.style.transformOrigin = 'top left';
    }
  };

  const handleDeviceChange = (device: typeof devicePresets[0]) => {
    setSelectedDevice(device);
  };

  const clearConsole = () => {
    setConsoleMessages([]);
  };

  const downloadPreview = () => {
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preview.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Device-specific styles
  const deviceStyles = useMemo(() => {
    if (selectedDevice.name === 'Desktop') {
      return { width: '100%', height: '100%' };
    }
    return {
      width: selectedDevice.width,
      height: selectedDevice.height,
      maxWidth: '100%',
      maxHeight: '100%',
    };
  }, [selectedDevice]);

  return (
    <div className={`live-preview flex flex-col ${className || ''}`} style={{ width, height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-bolt-elements-bg-secondary border-b border-bolt-elements-borderColor">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshPreview}
            disabled={isLoading}
            title="Refresh preview"
          >
            <div className={`i-ph:arrow-clockwise text-sm ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <div className="w-px h-4 bg-bolt-elements-borderColor" />

          <Tooltip content="Device preset">
            <Dropdown
              trigger={
                <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                  <div className={`${selectedDevice.icon} text-sm`} />
                  <span className="text-xs">{selectedDevice.name}</span>
                  <div className="i-ph:caret-down text-xs" />
                </Button>
              }
            >
              <div className="py-1">
                {devicePresets.map((device) => (
                  <button
                    key={device.name}
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleDeviceChange(device)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`${device.icon} text-sm`} />
                      <span>{device.name}</span>
                      {typeof device.width === 'number' && (
                        <span className="text-xs text-gray-500">
                          {device.width}×{device.height}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Dropdown>
          </Tooltip>

          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleZoomChange(Math.max(25, zoomLevel - 25))}
              title="Zoom out"
              className="h-7 w-7 p-0"
            >
              <div className="i-ph:minus text-xs" />
            </Button>
            <span className="text-xs text-bolt-elements-textSecondary min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleZoomChange(Math.min(200, zoomLevel + 25))}
              title="Zoom in"
              className="h-7 w-7 p-0"
            >
              <div className="i-ph:plus text-xs" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status indicators */}
          {autoRefresh && (
            <Badge variant="outline" className="text-xs">
              Auto-refresh
            </Badge>
          )}
          
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}

          {enableConsole && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConsole(!showConsole)}
              title="Toggle console"
              className={showConsole ? 'bg-bolt-elements-bg-tertiary' : ''}
            >
              <div className="i-ph:terminal text-sm" />
              {consoleMessages.length > 0 && (
                <Badge className="ml-1 h-4 min-w-[16px] text-xs px-1">
                  {consoleMessages.length}
                </Badge>
              )}
            </Button>
          )}

          <div className="w-px h-4 bg-bolt-elements-borderColor" />

          <Button
            size="sm"
            variant="ghost"
            onClick={downloadPreview}
            title="Download HTML"
          >
            <div className="i-ph:download text-sm" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <div className="i-ph:arrow-square-out text-sm" />
          </Button>
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center p-2 bg-bolt-elements-bg-tertiary border-b border-bolt-elements-borderColor">
        <div className="flex items-center space-x-2 flex-1">
          <div className="i-ph:globe text-sm text-bolt-elements-textSecondary" />
          <Input
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (iframeRef.current) {
                  iframeRef.current.src = currentUrl;
                  onUrlChange?.(currentUrl);
                }
              }
            }}
            className="flex-1 h-7 text-xs"
            placeholder="Enter URL or use file preview"
          />
        </div>
        <div className="text-xs text-bolt-elements-textSecondary ml-2">
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Preview area */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
          <div 
            className="flex-1 flex items-center justify-center p-4"
            style={{ 
              backgroundColor: selectedDevice.name !== 'Desktop' ? '#f3f4f6' : 'transparent' 
            }}
          >
            <div 
              className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden"
              style={deviceStyles}
            >
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                }}
                onLoad={() => {
                  setIsLoading(false);
                  setError(null);
                }}
                onError={() => {
                  setIsLoading(false);
                  setError('Failed to load preview');
                }}
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading preview...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Console panel */}
        {showConsole && enableConsole && (
          <div className="w-80 flex flex-col border-l border-bolt-elements-borderColor bg-bolt-elements-bg-primary">
            <div className="flex items-center justify-between p-2 border-b border-bolt-elements-borderColor">
              <h3 className="text-sm font-medium">Console</h3>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearConsole}
                  title="Clear console"
                  className="h-6 w-6 p-0"
                >
                  <div className="i-ph:trash text-xs" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConsole(false)}
                  title="Close console"
                  className="h-6 w-6 p-0"
                >
                  <div className="i-ph:x text-xs" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
              {consoleMessages.length === 0 ? (
                <div className="text-bolt-elements-textSecondary italic">
                  Console messages will appear here...
                </div>
              ) : (
                consoleMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-1 rounded border-l-2 ${
                      msg.type === 'error'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : msg.type === 'warn'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        : msg.type === 'info'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-400 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex-1 break-words">{msg.message}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;