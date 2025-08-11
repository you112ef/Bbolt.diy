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
        'enhanced-header flex items-center px-4 border-b h-[48px] contrast-125',
        'bolt-glass backdrop-blur-md',
        {
          'border-transparent bg-transparent': !chat.started,
          'border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/80': chat.started,
        },
      )}
    >
<<<<<<< HEAD
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary cursor-pointer enhanced-header">
        <div className="i-ph:sidebar-simple-duotone text-xl opacity-80 hover:opacity-100 transition-opacity" />
        <a href="/" className="header-title text-accent flex items-center hover:opacity-90 transition-opacity">
          <img
            src="/yousef-logo-enhanced.png"
            alt="يوسف شتيوي AI"
            className="h-8 md:h-9 lg:h-10 inline-block opacity-95 filter drop-shadow-sm"
            fetchPriority="high"
            decoding="async"
          />
=======
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-2xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <img src="/logo-light-styled.png" alt="logo" className="h-20 w-auto inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="h-20 w-auto inline-block hidden dark:block" />
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary bolt-text-sm opacity-90">
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
