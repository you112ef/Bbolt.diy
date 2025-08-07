import React, { useState, useCallback, memo } from 'react';
import { useStore } from '@nanostores/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import * as Tabs from '@radix-ui/react-tabs';
import { PanelHeader } from '~/components/ui/PanelHeader';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import type { FileMap } from '~/lib/stores/files';
import type { FileHistory } from '~/types/actions';
import type {
  EditorDocument,
  OnChangeCallback as OnEditorChange,
  OnSaveCallback as OnEditorSave,
  OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';

// Import existing components
import { CodeMirrorEditor } from '~/components/editor/codemirror/CodeMirrorEditor';
import { FileBreadcrumb } from '~/components/workbench/FileBreadcrumb';
import { FileTree } from '~/components/workbench/FileTree';
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from '~/components/workbench/terminal/TerminalTabs';
import { Search } from '~/components/workbench/Search';
import { LockManager } from '~/components/workbench/LockManager';

// Import new Monaco editor (lazy loaded)
const MonacoEditor = React.lazy(() => import('./monaco/MonacoEditor'));

interface EnhancedEditorPanelProps {
  files?: FileMap;
  unsavedFiles?: Set<string>;
  editorDocument?: EditorDocument;
  selectedFile?: string | undefined;
  isStreaming?: boolean;
  fileHistory?: Record<string, FileHistory>;
  onEditorChange?: OnEditorChange;
  onEditorScroll?: OnEditorScroll;
  onFileSelect?: (value?: string) => void;
  onFileSave?: OnEditorSave;
  onFileReset?: () => void;
}

const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

const editorSettings = { tabSize: 2 };

export const EnhancedEditorPanel = memo(
  ({
    files,
    unsavedFiles,
    editorDocument,
    selectedFile,
    isStreaming,
    fileHistory,
    onFileSelect,
    onEditorChange,
    onEditorScroll,
    onFileSave,
    onFileReset,
  }: EnhancedEditorPanelProps) => {
    const [useMonacoEditor, setUseMonacoEditor] = useState(false);
    const theme = useStore(themeStore);
    const showTerminal = useStore(workbenchStore.showTerminal);

    const activeFileSegments = React.useMemo(() => {
      if (!editorDocument) {
        return undefined;
      }
      return editorDocument.filePath.split('/');
    }, [editorDocument]);

    const activeFileUnsaved = React.useMemo(() => {
      if (!editorDocument || !unsavedFiles) {
        return false;
      }
      return unsavedFiles instanceof Set && unsavedFiles.has(editorDocument.filePath);
    }, [editorDocument, unsavedFiles]);

    const handleMonacoChange = useCallback(
      (value: string) => {
        if (onEditorChange && editorDocument) {
          onEditorChange({
            content: value,
            scrollPosition: { line: 0, col: 0 },
          });
        }
      },
      [onEditorChange, editorDocument]
    );

    const renderEditor = () => {
      if (useMonacoEditor) {
        return (
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  Loading Monaco Editor...
                </div>
              </div>
            }
          >
            <MonacoEditor
              doc={editorDocument}
              theme={theme}
              editable={!isStreaming && editorDocument !== undefined}
              autoFocusOnDocumentChange={false}
              onChange={handleMonacoChange}
              onSave={onFileSave}
              className="h-full"
            />
          </React.Suspense>
        );
      }

      return (
        <CodeMirrorEditor
          theme={theme}
          editable={!isStreaming && editorDocument !== undefined}
          settings={editorSettings}
          doc={editorDocument}
          autoFocusOnDocumentChange={false}
          onScroll={onEditorScroll}
          onChange={onEditorChange}
          onSave={onFileSave}
        />
      );
    };

    return (
      <PanelGroup direction="vertical">
        <Panel defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={15} collapsible className="border-r border-bolt-elements-borderColor">
              <div className="h-full">
                <Tabs.Root defaultValue="files" className="flex flex-col h-full">
                  <PanelHeader className="w-full text-sm font-medium text-bolt-elements-textSecondary px-1">
                    <div className="h-full flex-shrink-0 flex items-center justify-between w-full">
                      <Tabs.List className="h-full flex-shrink-0 flex items-center">
                        <Tabs.Trigger
                          value="files"
                          className={classNames(
                            'h-full bg-transparent hover:bg-bolt-elements-background-depth-3 py-0.5 px-2 rounded-lg text-sm font-medium text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary data-[state=active]:text-bolt-elements-textPrimary'
                          )}
                        >
                          Files
                        </Tabs.Trigger>
                        <Tabs.Trigger
                          value="search"
                          className={classNames(
                            'h-full bg-transparent hover:bg-bolt-elements-background-depth-3 py-0.5 px-2 rounded-lg text-sm font-medium text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary data-[state=active]:text-bolt-elements-textPrimary'
                          )}
                        >
                          Search
                        </Tabs.Trigger>
                        <Tabs.Trigger
                          value="locks"
                          className={classNames(
                            'h-full bg-transparent hover:bg-bolt-elements-background-depth-3 py-0.5 px-2 rounded-lg text-sm font-medium text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary data-[state=active]:text-bolt-elements-textPrimary'
                          )}
                        >
                          Locks
                        </Tabs.Trigger>
                      </Tabs.List>
                    </div>
                  </PanelHeader>

                  <Tabs.Content value="files" className="flex-grow overflow-auto focus-visible:outline-none">
                    <FileTree
                      className="h-full"
                      files={files}
                      hideRoot
                      unsavedFiles={unsavedFiles}
                      fileHistory={fileHistory}
                      rootFolder="/project"
                      selectedFile={selectedFile}
                      onFileSelect={onFileSelect}
                    />
                  </Tabs.Content>

                  <Tabs.Content value="search" className="flex-grow overflow-auto focus-visible:outline-none">
                    <Search />
                  </Tabs.Content>

                  <Tabs.Content value="locks" className="flex-grow overflow-auto focus-visible:outline-none">
                    <LockManager />
                  </Tabs.Content>
                </Tabs.Root>
              </div>
            </Panel>

            <PanelResizeHandle />
            <Panel className="flex flex-col" defaultSize={80} minSize={20}>
              <PanelHeader className="overflow-x-auto">
                <div className="flex items-center justify-between w-full">
                  {activeFileSegments?.length && (
                    <div className="flex items-center flex-1 text-sm">
                      <FileBreadcrumb pathSegments={activeFileSegments} files={files} onFileSelect={onFileSelect} />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {/* Editor Toggle */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setUseMonacoEditor(false)}
                        className={`px-2 py-1 rounded ${
                          !useMonacoEditor
                            ? 'bg-blue-500 text-white'
                            : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3'
                        }`}
                      >
                        CodeMirror
                      </button>
                      <button
                        onClick={() => setUseMonacoEditor(true)}
                        className={`px-2 py-1 rounded ${
                          useMonacoEditor
                            ? 'bg-blue-500 text-white'
                            : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3'
                        }`}
                      >
                        Monaco
                      </button>
                    </div>

                    {activeFileUnsaved && (
                      <div className="flex gap-1">
                        <PanelHeaderButton onClick={onFileSave}>
                          <div className="i-ph:floppy-disk-duotone" />
                          Save
                        </PanelHeaderButton>
                        <PanelHeaderButton onClick={onFileReset}>
                          <div className="i-ph:clock-counter-clockwise-duotone" />
                          Reset
                        </PanelHeaderButton>
                      </div>
                    )}
                  </div>
                </div>
              </PanelHeader>
              
              <div className="h-full flex-1 overflow-hidden modern-scrollbar">
                {renderEditor()}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <TerminalTabs />
      </PanelGroup>
    );
  }
);

export default EnhancedEditorPanel;