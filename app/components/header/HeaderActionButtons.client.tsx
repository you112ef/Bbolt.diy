import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { useState } from 'react';
import { streamingState } from '~/lib/stores/streaming';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { useChatHistory } from '~/lib/persistence';
import { DeployButton } from '~/components/deploy/DeployButton';
import { chatStore } from '~/lib/stores/chat';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const isStreaming = useStore(streamingState);
  const { exportChat } = useChatHistory();
  const { showChat } = useStore(chatStore);

  const shouldShowButtons = !isStreaming;

  return (
    <div className="flex items-center gap-2">
      {chatStarted && (
        <>
          <button
            className="px-2 py-1 rounded-md text-xs border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3"
            onClick={() => {
              chatStore.setKey('showChat', true);
              workbenchStore.showWorkbench.set(false);
            }}
            aria-pressed={showChat}
            title="Show Chat"
          >
            <span className="i-ph:chat-circle-text text-sm mr-1" /> Chat
          </button>
          <button
            className="px-2 py-1 rounded-md text-xs border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3"
            onClick={() => {
              chatStore.setKey('showChat', false);
              workbenchStore.showWorkbench.set(true);
              workbenchStore.currentView.set('code');
            }}
            title="Show Editor"
          >
            <span className="i-ph:code text-sm mr-1" /> Editor
          </button>
        </>
      )}
      {chatStarted && shouldShowButtons && <ExportChatButton exportChat={exportChat} />}
      {shouldShowButtons && <DeployButton />}
    </div>
  );
}
