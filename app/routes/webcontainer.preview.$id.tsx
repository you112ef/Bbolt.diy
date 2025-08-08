import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const PREVIEW_CHANNEL = 'preview-updates';

function createChannel(name: string) {
  const isBrowser = typeof window !== 'undefined' && typeof (window as any).BroadcastChannel !== 'undefined';

  if (isBrowser) {
    return new (window as any).BroadcastChannel(name) as BroadcastChannel;
  }

  return null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const previewId = params.id;

  if (!previewId) {
    throw new Response('Preview ID is required', { status: 400 });
  }

  return json({ previewId });
}

export default function WebContainerPreview() {
  const { previewId } = useLoaderData<typeof loader>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Handle preview refresh
  const handleRefresh = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      // Force a clean reload
      iframeRef.current.src = '';
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl;
        }
      });
    }
  }, [previewUrl]);

  // Notify other tabs that this preview is ready
  const notifyPreviewReady = useCallback(() => {
    if (typeof window !== 'undefined' && broadcastChannelRef.current && previewUrl) {
      broadcastChannelRef.current.postMessage({
        type: 'preview-ready',
        previewId,
        url: previewUrl,
        timestamp: Date.now(),
      });
    }
  }, [previewId, previewUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof (window as any).BroadcastChannel === 'undefined') {
      // SSR/Workers: skip BroadcastChannel usage
      const url = `https://${previewId}.local-credentialless.webcontainer-api.io`;
      setPreviewUrl(url);

      if (iframeRef.current) {
        iframeRef.current.src = url;
      }

      return;
    }

    // Initialize broadcast channel
    broadcastChannelRef.current = createChannel(PREVIEW_CHANNEL);

    // Listen for preview updates
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.onmessage = (event) => {
        const data = (event as MessageEvent & { data: any }).data;

        if (data?.previewId === previewId) {
          const type = data.type as string;

          if (type === 'refresh-preview' || type === 'file-change') {
            handleRefresh();
          }
        }
      };
    }

    // Construct the WebContainer preview URL
    const url = `https://${previewId}.local-credentialless.webcontainer-api.io`;
    setPreviewUrl(url);

    // Set the iframe src
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    // Notify other tabs that this preview is ready
    notifyPreviewReady();

    // Cleanup
    return () => {
      broadcastChannelRef.current?.close?.();
    };
  }, [previewId, handleRefresh, notifyPreviewReady]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        title="WebContainer Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
        allow="cross-origin-isolated"
        loading="eager"
        onLoad={notifyPreviewReady}
      />
    </div>
  );
}
