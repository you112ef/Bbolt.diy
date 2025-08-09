import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { FilesStore } from '~/lib/stores/files';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Badge } from '~/components/ui/Badge';
import { Tooltip } from '~/components/ui/Tooltip';
import { Dropdown } from '~/components/ui/Dropdown';

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

interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

const createPreviewHTML = (files: Record<string, { type: 'file' | 'folder'; content?: string } | undefined>): string => {
  const pairs = Object.entries(files);
  const htmlFiles = pairs.filter(([p, d]) => (d?.type === 'file') && (p.endsWith('.html') || p.endsWith('.htm')));
  const cssFiles = pairs.filter(([p, d]) => (d?.type === 'file') && p.endsWith('.css'));
  const jsFiles = pairs.filter(([p, d]) => (d?.type === 'file') && p.endsWith('.js') && !p.includes('node_modules'));

  let mainHtml = htmlFiles.find(([p]) => p.includes('index.html') || p.endsWith('index.html'))?.[1]?.content
    || htmlFiles[0]?.[1]?.content;

  if (!mainHtml) {
    mainHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Live Preview</title></head><body><h1>Live Preview</h1><p>Create an <code>index.html</code> file to see preview.</p></body></html>`;
  }

  const cssIncludes = cssFiles.map(([path, file]) => `<style data-file="${path}">\n${file!.content || ''}\n</style>`).join('\n');
  const jsIncludes = jsFiles.map(([path, file]) => `<script data-file="${path}">\n${file!.content || ''}\n</script>`).join('\n');

  let enhancedHtml = mainHtml;
  if (cssIncludes) enhancedHtml = enhancedHtml.replace(/<\/head>/i, `${cssIncludes}\n</head>`);
  if (jsIncludes) enhancedHtml = enhancedHtml.replace(/<\/body>/i, `${jsIncludes}\n</body>`);
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
  const [zoomLevel, setZoomLevel] = useState(100);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const files = useStore(new FilesStore((window as any)?.webcontainer || ({} as any)).files);

  const previewContent = useMemo(() => createPreviewHTML(files as any), [files]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { refreshPreview(); }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, previewContent]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type, ...data } = event.data || {};
      switch (type) {
        case 'console':
          if (enableConsole) {
            const message: ConsoleMessage = { id: `${Date.now()}-${Math.random()}`, type: data.level, message: data.message, timestamp: data.timestamp };
            setConsoleMessages(prev => [...prev.slice(-99), message]);
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
            const consoleError: ConsoleMessage = { id: `${Date.now()}-${Math.random()}`, type: 'error', message: errorMessage, timestamp: data.timestamp };
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
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    setCurrentUrl(url);
    onUrlChange?.(url);
    const prevSrc = iframeRef.current.getAttribute('data-prev-src');
    if (prevSrc && prevSrc.startsWith('blob:')) URL.revokeObjectURL(prevSrc);
    iframeRef.current.setAttribute('data-prev-src', url);
  }, [previewContent, onUrlChange]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newZoom / 100})`;
      iframeRef.current.style.transformOrigin = 'top left';
    }
  };

  const openInNewTab = () => {
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className={`live-preview flex flex-col ${className || ''}`} style={{ width, height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-bolt-elements-bg-secondary border-b border-bolt-elements-borderColor">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={refreshPreview} disabled={isLoading} title="Refresh preview">
            <div className={`i-ph:arrow-clockwise text-sm ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {autoRefresh && (<Badge variant="outline" className="text-xs">Auto-refresh</Badge>)}
          {error && (<Badge variant="destructive" className="text-xs">Error</Badge>)}
          <div className="w-px h-4 bg-bolt-elements-borderColor" />
          <Button size="sm" variant="ghost" onClick={() => handleZoomChange(Math.max(25, zoomLevel - 25))} title="Zoom out" className="h-7 w-7 p-0">
            <div className="i-ph:minus text-xs" />
          </Button>
          <span className="text-xs text-bolt-elements-textSecondary min-w-[3rem] text-center">{zoomLevel}%</span>
          <Button size="sm" variant="ghost" onClick={() => handleZoomChange(Math.min(200, zoomLevel + 25))} title="Zoom in" className="h-7 w-7 p-0">
            <div className="i-ph:plus text-xs" />
          </Button>
          <div className="w-px h-4 bg-bolt-elements-borderColor" />
          <Button size="sm" variant="ghost" onClick={openInNewTab} title="Open in new tab">
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
              if (e.key === 'Enter' && iframeRef.current) {
                iframeRef.current.src = currentUrl;
                onUrlChange?.(currentUrl);
              }
            }}
            className="flex-1 h-7 text-xs"
            placeholder="Enter URL or use file preview"
          />
        </div>
        <div className="text-xs text-bolt-elements-textSecondary ml-2">Last updated: {new Date(lastRefresh).toLocaleTimeString()}</div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden" style={{ width: '100%', height: '100%' }}>
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                onLoad={() => { setIsLoading(false); setError(null); }}
                onError={() => { setIsLoading(false); setError('Failed to load preview'); }}
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
        {enableConsole && (
          <div className="w-80 flex flex-col border-l border-bolt-elements-borderColor bg-bolt-elements-bg-primary">
            <div className="flex items-center justify-between p-2 border-b border-bolt-elements-borderColor">
              <h3 className="text-sm font-medium">Console</h3>
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" onClick={() => setConsoleMessages([])} title="Clear console" className="h-6 w-6 p-0">
                  <div className="i-ph:trash text-xs" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
              {consoleMessages.length === 0 ? (
                <div className="text-bolt-elements-textSecondary italic">Console messages will appear here...</div>
              ) : (
                consoleMessages.map((msg) => (
                  <div key={msg.id} className={`p-1 rounded border-l-2 ${msg.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : msg.type === 'warn' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' : msg.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-400 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                    <div className="flex items-start justify-between">
                      <span className="flex-1 break-words">{msg.message}</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
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