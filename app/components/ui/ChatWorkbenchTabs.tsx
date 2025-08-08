import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { workbenchStore } from '~/lib/stores/workbench';
import { IconButton } from './IconButton';

export type TabType = 'chat' | 'workbench';

interface ChatWorkbenchTabsProps {
  children: React.ReactNode;
  chatStarted?: boolean;
  className?: string;
}

export function ChatWorkbenchTabs({ children, chatStarted, className }: ChatWorkbenchTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Auto-switch to workbench when it becomes available and we're on a small screen
  useEffect(() => {
    if (showWorkbench && isSmallScreen && chatStarted) {
      setActiveTab('workbench');
    }
  }, [showWorkbench, isSmallScreen, chatStarted]);

  // On large screens, always show both
  if (!isSmallScreen) {
    return <div className={className}>{children}</div>;
  }

  // Only show tabs if workbench is available and chat has started
  if (!showWorkbench || !chatStarted) {
    return <div className={className}>{children}</div>;
  }

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <div 
      className={classNames('chat-workbench-tabs flex flex-col h-full', className)}
      data-active-tab={activeTab}
    >
      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={classNames(
              'tab-button flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden',
              'hover:bg-bolt-elements-background-depth-3',
              'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:ring-inset',
              activeTab === 'chat'
                ? 'active text-bolt-elements-textPrimary bg-bolt-elements-background-depth-1'
                : 'text-bolt-elements-textSecondary'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="i-ph:chat-circle text-lg" />
              <span>Chat</span>
            </div>
            {activeTab === 'chat' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-bolt-elements-focus"
                layoutId="tabIndicator"
                initial={false}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('workbench')}
            className={classNames(
              'tab-button flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden',
              'hover:bg-bolt-elements-background-depth-3',
              'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:ring-inset',
              activeTab === 'workbench'
                ? 'active text-bolt-elements-textPrimary bg-bolt-elements-background-depth-1'
                : 'text-bolt-elements-textSecondary'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="i-ph:code text-lg" />
              <span>Code</span>
            </div>
            {activeTab === 'workbench' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-bolt-elements-focus"
                layoutId="tabIndicator"
                initial={false}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
            data-active-tab={activeTab}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Switch Button (Floating) */}
      <div className="absolute bottom-4 right-4 z-50">
        <IconButton
          onClick={() => setActiveTab(activeTab === 'chat' ? 'workbench' : 'chat')}
          className={classNames(
            'quick-switch-button w-12 h-12 rounded-full shadow-lg transition-all duration-200',
            'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
            'hover:bg-bolt-elements-background-depth-3 hover:scale-110',
            'focus:ring-2 focus:ring-bolt-elements-focus'
          )}
          title={activeTab === 'chat' ? 'Switch to Code Editor' : 'Switch to Chat'}
        >
          <div 
            className={classNames(
              'text-lg transition-transform duration-200',
              activeTab === 'chat' ? 'i-ph:code' : 'i-ph:chat-circle'
            )}
          />
        </IconButton>
      </div>
    </div>
  );
}

// CSS module styles for tab content visibility
export const tabStyles = `
  [data-active-tab="chat"] .workbench-container {
    display: none;
  }
  
  [data-active-tab="workbench"] .chat-container {
    display: none;
  }
  
  @media (min-width: 1024px) {
    [data-active-tab] .workbench-container,
    [data-active-tab] .chat-container {
      display: flex;
    }
  }
`;