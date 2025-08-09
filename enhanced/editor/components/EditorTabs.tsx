import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { FilesStore } from '~/lib/stores/files';
import { Button } from '~/components/ui/Button';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Tooltip } from '~/components/ui/Tooltip';
import type { FileMap } from '~/lib/stores/files';

interface EditorTab {
  filePath: string;
  fileName: string;
  isActive: boolean;
  isDirty: boolean;
  isPinned?: boolean;
  language?: string;
}

interface EditorTabsProps {
  openTabs: string[];
  activeTab?: string;
  onTabSelect: (filePath: string) => void;
  onTabClose: (filePath: string) => void;
  onTabPin?: (filePath: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

// Get file icon based on file extension
const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'ts': 'i-vscode-icons:file-type-typescript',
    'tsx': 'i-vscode-icons:file-type-reactts',
    'js': 'i-vscode-icons:file-type-js',
    'jsx': 'i-vscode-icons:file-type-reactjs',
    'py': 'i-vscode-icons:file-type-python',
    'rs': 'i-vscode-icons:file-type-rust',
    'go': 'i-vscode-icons:file-type-go',
    'java': 'i-vscode-icons:file-type-java',
    'php': 'i-vscode-icons:file-type-php',
    'rb': 'i-vscode-icons:file-type-ruby',
    'html': 'i-vscode-icons:file-type-html',
    'css': 'i-vscode-icons:file-type-css',
    'scss': 'i-vscode-icons:file-type-scss',
    'json': 'i-vscode-icons:file-type-json',
    'md': 'i-vscode-icons:file-type-markdown',
    'yaml': 'i-vscode-icons:file-type-yaml',
    'yml': 'i-vscode-icons:file-type-yaml',
    'xml': 'i-vscode-icons:file-type-xml',
    'svg': 'i-vscode-icons:file-type-svg',
    'vue': 'i-vscode-icons:file-type-vue',
    'svelte': 'i-vscode-icons:file-type-svelte',
  };

  return iconMap[ext || ''] || 'i-ph:file';
};

// Get short file name with directory context if needed
const getDisplayName = (filePath: string, allPaths: string[]): string => {
  const fileName = filePath.split('/').pop() || filePath;
  
  // Check if there are other files with the same name
  const sameNameFiles = allPaths.filter(path => {
    const otherFileName = path.split('/').pop();
    return otherFileName === fileName && path !== filePath;
  });
  
  if (sameNameFiles.length === 0) {
    return fileName;
  }
  
  // Add parent directory to disambiguate
  const pathParts = filePath.split('/');
  if (pathParts.length > 1) {
    return `${pathParts[pathParts.length - 2]}/${fileName}`;
  }
  
  return fileName;
};

// Individual tab component
const TabItem: React.FC<{
  tab: EditorTab;
  allTabs: EditorTab[];
  onSelect: () => void;
  onClose: () => void;
  onPin?: () => void;
  onMiddleClick?: () => void;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}> = ({
  tab,
  allTabs,
  onSelect,
  onClose,
  onPin,
  onMiddleClick,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  const displayName = getDisplayName(tab.filePath, allTabs.map(t => t.filePath));

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowCloseButton(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowCloseButton(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      onMiddleClick?.();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPin?.();
  };

  return (
    <div
      className={`group flex items-center min-w-0 max-w-[200px] h-8 px-2 cursor-pointer border-r border-bolt-elements-borderColor transition-colors ${
        tab.isActive
          ? 'bg-bolt-elements-bg-primary text-bolt-elements-textPrimary border-b-2 border-bolt-elements-focus'
          : 'bg-bolt-elements-bg-secondary text-bolt-elements-textSecondary hover:bg-bolt-elements-bg-tertiary'
      } ${isDragOver ? 'bg-bolt-elements-focus/20' : ''}`}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={tab.filePath}
    >
      {/* Pin indicator */}
      {tab.isPinned && (
        <div className="i-ph:push-pin text-xs text-blue-500 mr-1" />
      )}

      {/* File icon */}
      <div className={`${getFileIcon(tab.fileName)} text-sm mr-2 flex-shrink-0`} />

      {/* File name */}
      <span className="text-xs truncate min-w-0 flex-1">
        {displayName}
      </span>

      {/* Dirty indicator */}
      {tab.isDirty && !showCloseButton && (
        <div className="w-2 h-2 rounded-full bg-orange-500 ml-1 flex-shrink-0" />
      )}

      {/* Action buttons */}
      <div className="flex items-center ml-1 flex-shrink-0">
        {/* Pin button (on hover) */}
        {isHovered && !tab.isPinned && (
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
            onClick={handlePinClick}
            title="Pin tab"
          >
            <div className="i-ph:push-pin text-xs" />
          </Button>
        )}

        {/* Close button */}
        {(showCloseButton || tab.isDirty) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 ml-1 hover:bg-red-500 hover:text-white"
            onClick={handleCloseClick}
            title={tab.isDirty ? 'Close (unsaved changes)' : 'Close'}
          >
            {tab.isDirty && !showCloseButton ? (
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            ) : (
              <div className="i-ph:x text-xs" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Main EditorTabs component
export const EditorTabs: React.FC<EditorTabsProps> = ({
  openTabs,
  activeTab,
  onTabSelect,
  onTabClose,
  onTabPin,
  onTabReorder,
  className,
}) => {
  const files = useStore(filesStore);
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert file paths to tab objects
  const tabs: EditorTab[] = openTabs.map((filePath) => {
    const file = files[filePath];
    const fileName = filePath.split('/').pop() || filePath;
    
    return {
      filePath,
      fileName,
      isActive: activeTab === filePath,
      isDirty: file?.unsaved || false,
      isPinned: file?.pinned || false,
      language: file?.language,
    };
  });

  // Scroll active tab into view
  useEffect(() => {
    if (activeTab && scrollRef.current) {
      const activeIndex = openTabs.indexOf(activeTab);
      if (activeIndex !== -1) {
        const tabElement = scrollRef.current.children[activeIndex] as HTMLElement;
        if (tabElement) {
          tabElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    }
  }, [activeTab, openTabs]);

  // Handle drag and drop for tab reordering
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (fromIndex !== index && onTabReorder) {
      onTabReorder(fromIndex, index);
    }
    
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeTab) return;

    const currentIndex = openTabs.indexOf(activeTab);
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'w':
          e.preventDefault();
          onTabClose(activeTab);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Previous tab
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : openTabs.length - 1;
            onTabSelect(openTabs[prevIndex]);
          } else {
            // Next tab
            const nextIndex = (currentIndex + 1) % openTabs.length;
            onTabSelect(openTabs[nextIndex]);
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const tabIndex = parseInt(e.key) - 1;
          if (openTabs[tabIndex]) {
            onTabSelect(openTabs[tabIndex]);
          }
          break;
      }
    }
  };

  const handleCloseAllTabs = () => {
    if (confirm('Close all tabs? Unsaved changes will be lost.')) {
      openTabs.forEach(filePath => onTabClose(filePath));
    }
  };

  const handleCloseOtherTabs = () => {
    if (activeTab && confirm('Close other tabs? Unsaved changes will be lost.')) {
      openTabs.forEach(filePath => {
        if (filePath !== activeTab) {
          onTabClose(filePath);
        }
      });
    }
  };

  const handleCloseSavedTabs = () => {
    openTabs.forEach(filePath => {
      const file = files[filePath];
      if (!file?.unsaved) {
        onTabClose(filePath);
      }
    });
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center bg-bolt-elements-bg-secondary border-b border-bolt-elements-borderColor ${className || ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Tabs container */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 overflow-x-auto"
      >
        <div className="flex min-w-max">
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.filePath}
              tab={tab}
              allTabs={tabs}
              onSelect={() => onTabSelect(tab.filePath)}
              onClose={() => onTabClose(tab.filePath)}
              onPin={() => onTabPin?.(tab.filePath)}
              onMiddleClick={() => onTabClose(tab.filePath)}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Tab actions */}
      <div className="flex items-center border-l border-bolt-elements-borderColor">
        <Tooltip content="Tab actions">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.preventDefault();
              // Show context menu
              const menu = document.createElement('div');
              menu.className = 'absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 py-1';
              menu.style.right = '8px';
              menu.style.top = '32px';
              
              menu.innerHTML = `
                <button class="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" data-action="close-all">Close All Tabs</button>
                <button class="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" data-action="close-others">Close Other Tabs</button>
                <button class="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" data-action="close-saved">Close Saved Tabs</button>
              `;
              
              menu.addEventListener('click', (menuEvent) => {
                const target = menuEvent.target as HTMLElement;
                const action = target.getAttribute('data-action');
                
                switch (action) {
                  case 'close-all':
                    handleCloseAllTabs();
                    break;
                  case 'close-others':
                    handleCloseOtherTabs();
                    break;
                  case 'close-saved':
                    handleCloseSavedTabs();
                    break;
                }
                
                menu.remove();
              });
              
              // Position relative to this component
              const container = e.currentTarget.closest('.flex') as HTMLElement;
              if (container) {
                container.style.position = 'relative';
                container.appendChild(menu);
                
                // Remove menu when clicking outside
                const removeMenu = (clickEvent: Event) => {
                  if (!menu.contains(clickEvent.target as Node)) {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                  }
                };
                
                setTimeout(() => document.addEventListener('click', removeMenu), 0);
              }
            }}
          >
            <div className="i-ph:dots-three text-sm" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default EditorTabs;