import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'enhanced-header flex items-center px-4 border-b h-[var(--header-height)]',
        'bolt-glass backdrop-blur-md',
        {
          'border-transparent bg-transparent': !chat.started,
          'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/80': chat.started,
        }
      )}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer enhanced-header">
        <div className="i-ph:sidebar-simple-duotone text-lg opacity-70 hover:opacity-100 transition-opacity" />
        <a href="/" className="header-title text-accent flex items-center hover:opacity-90 transition-opacity">
          {/* Switched to SVG for better performance and scalability */}
          <img
            src="/logo.svg"
            alt="YOUSEF.SHTIWE AI"
            className="h-10 md:h-12 lg:h-14 inline-block opacity-90"
            fetchPriority="high"
            decoding="async"
          />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary bolt-text-sm opacity-80">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
