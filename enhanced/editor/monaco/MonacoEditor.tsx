import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';
import { FilesStore } from '~/lib/stores/files';

// Import Monaco language support
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/javascript/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution';
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution';
import 'monaco-editor/esm/vs/basic-languages/swift/swift.contribution';
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution';

interface MonacoEditorProps {
  filePath?: string;
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string, filePath: string) => void;
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  className?: string;
}

// Language detection based on file extension
const getLanguageFromFilePath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts': case 'tsx': return 'typescript';
    case 'js': case 'jsx': return 'javascript';
    case 'py': return 'python';
    case 'rs': return 'rust';
    case 'go': return 'go';
    case 'java': return 'java';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'swift': return 'swift';
    case 'kt': case 'kts': return 'kotlin';
    case 'html': case 'htm': return 'html';
    case 'css': return 'css';
    case 'scss': case 'sass': return 'scss';
    case 'json': return 'json';
    case 'xml': return 'xml';
    case 'yaml': case 'yml': return 'yaml';
    case 'md': case 'markdown': return 'markdown';
    case 'sh': case 'bash': return 'shell';
    case 'sql': return 'sql';
    case 'dockerfile': return 'dockerfile';
    case 'vue': return 'html'; // Vue files are treated as HTML with special handling
    case 'svelte': return 'html'; // Svelte files are treated as HTML
    default: return 'plaintext';
  }
};

// Advanced Monaco configuration
const getMonacoOptions = (
  readOnly: boolean = false,
  theme: string = 'vs-dark'
): monaco.editor.IStandaloneEditorConstructionOptions => ({
  automaticLayout: true,
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  fontLigatures: true,
  lineNumbers: 'on',
  lineNumbersMinChars: 4,
  glyphMargin: true,
  folding: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover',
  unfoldOnClickAfterEndOfLine: false,
  contextmenu: true,
  minimap: {
    enabled: true,
    side: 'right',
    showSlider: 'mouseover',
    renderCharacters: true,
    maxColumn: 120,
  },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  renderWhitespace: 'selection',
  renderControlCharacters: true,
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    bracketPairsHorizontal: true,
    highlightActiveBracketPair: true,
    indentation: true,
  },
  suggest: {
    showIcons: true,
    showSnippets: true,
    showWords: true,
    showKeywords: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showUsers: true,
    showIssues: true,
  },
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true,
  },
  quickSuggestionsDelay: 100,
  parameterHints: {
    enabled: true,
    cycle: true,
  },
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestions: 'matchingDocuments',
  occurrencesHighlight: 'singleFile',
  selectionHighlight: true,
  codeLens: true,
  colorDecorators: true,
  lightbulb: {
    enabled: 'on' as any,
  },
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'full',
  find: {
    seedSearchStringFromSelection: 'selection',
    autoFindInSelection: 'multiline',
    addExtraSpaceOnTop: false,
  },
  hover: {
    enabled: true,
    delay: 300,
    sticky: true,
  },
  matchBrackets: 'always',
  showUnused: true,
  readOnly,
  renderValidationDecorations: 'on',
  scrollbar: {
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
  },
  overviewRulerLanes: 3,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: false,
  links: true,
  multiCursorModifier: 'ctrlCmd',
  multiCursorMergeOverlapping: true,
  accessibilitySupport: 'auto',
});

// Custom themes for better integration
const setupCustomThemes = () => {
  // Bolt Dark Theme
  monaco.editor.defineTheme('bolt-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'tag', foreground: '569CD6' },
      { token: 'attribute.name', foreground: '92C5F8' },
      { token: 'attribute.value', foreground: 'CE9178' },
    ],
    colors: {
      'editor.background': '#0F172A',
      'editor.foreground': '#E2E8F0',
      'editor.lineHighlightBackground': '#1E293B',
      'editor.selectionBackground': '#334155',
      'editor.inactiveSelectionBackground': '#1E293B',
      'editorCursor.foreground': '#38BDF8',
      'editorWhitespace.foreground': '#475569',
      'editorLineNumber.foreground': '#64748B',
      'editorLineNumber.activeForeground': '#94A3B8',
      'editorBracketMatch.background': '#334155',
      'editorBracketMatch.border': '#38BDF8',
      'editorSuggestWidget.background': '#1E293B',
      'editorSuggestWidget.border': '#334155',
      'editorSuggestWidget.foreground': '#E2E8F0',
      'editorSuggestWidget.selectedBackground': '#334155',
      'editorHoverWidget.background': '#1E293B',
      'editorHoverWidget.border': '#334155',
      'scrollbarSlider.background': '#33415577',
      'scrollbarSlider.hoverBackground': '#47556999',
      'scrollbarSlider.activeBackground': '#64748BAA',
    },
  });

  // Bolt Light Theme
  monaco.editor.defineTheme('bolt-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
      { token: 'class', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
      { token: 'constant', foreground: '0070C1' },
      { token: 'regexp', foreground: 'AF00DB' },
      { token: 'delimiter', foreground: '000000' },
      { token: 'tag', foreground: '800000' },
      { token: 'attribute.name', foreground: 'FF0000' },
      { token: 'attribute.value', foreground: '0451A5' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1F2937',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editor.selectionBackground': '#E0E7FF',
      'editor.inactiveSelectionBackground': '#F1F5F9',
      'editorCursor.foreground': '#3B82F6',
      'editorWhitespace.foreground': '#CBD5E1',
      'editorLineNumber.foreground': '#9CA3AF',
      'editorLineNumber.activeForeground': '#6B7280',
      'editorBracketMatch.background': '#E0E7FF',
      'editorBracketMatch.border': '#3B82F6',
    },
  });
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  language,
  value = '',
  onChange,
  onSave,
  readOnly = false,
  height = '100%',
  width = '100%',
  theme,
  options = {},
  className,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Get theme from store
  const currentTheme = useStore(themeStore);
  // Subscribe to files store
  const files = useStore(new FilesStore((window as any)?.webcontainer || ({} as any)).files);
  
  // Determine the actual theme to use
  const effectiveTheme = theme || (currentTheme === 'dark' ? 'bolt-dark' : 'bolt-light');
  
  // Determine language from file path if not provided
  const effectiveLanguage = language || (filePath ? getLanguageFromFilePath(filePath) : 'plaintext');
  
  // Get file content from store if filePath is provided
  const fileContent = filePath && (files as any)[filePath]?.content || value;

  // Setup Monaco when it's ready
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsReady(true);

    // Setup custom themes
    setupCustomThemes();

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && filePath) {
        const content = editor.getValue();
        onSave(content, filePath);
      }
    });

    // Add advanced text operations
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Add multi-cursor support
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.addSelectionToNextFindMatch')?.run();
    });

    // Add quick documentation
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      editor.getAction('editor.action.showHover')?.run();
    });

    // Configure TypeScript/JavaScript language features
    if (effectiveLanguage === 'typescript' || effectiveLanguage === 'javascript') {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
        strict: true,
        noImplicitAny: false,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: false,
        noImplicitOverride: true,
        useDefineForClassFields: true,
        skipLibCheck: true,
      });

      // Enable additional libraries
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
      });
    }

    // Configure other language features
    configureLanguageFeatures(effectiveLanguage);

    // Focus editor
    editor.focus();
  }, [effectiveLanguage, onSave, filePath]);

  // Configure specific language features
  const configureLanguageFeatures = (lang: string) => {
    switch (lang) {
      case 'python':
        // Python-specific configuration
        monaco.languages.setLanguageConfiguration('python', {
          indentationRules: {
            increaseIndentPattern: /^\s*(class|def|if|elif|else|for|while|with|try|except|finally|async\s+def)\b.*:\s*$/,
            decreaseIndentPattern: /^\s*(pass|break|continue|raise|return)\b.*$/,
          },
        });
        break;
      
      case 'rust':
        // Rust-specific configuration
        monaco.languages.setLanguageConfiguration('rust', {
          comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        });
        break;
    }
  };

  // Handle content changes
  const handleChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange?.(newValue);
    }
  }, [onChange]);

  // Effect to update editor theme when store theme changes
  useEffect(() => {
    if (isReady && editorRef.current) {
      monaco.editor.setTheme(effectiveTheme);
    }
  }, [currentTheme, effectiveTheme, isReady]);

  // Merged options
  const mergedOptions = {
    ...getMonacoOptions(readOnly, effectiveTheme),
    ...options,
  };

  return (
    <div className={`monaco-editor-container ${className || ''}`} style={{ height, width }}>
      <Editor
        height={height}
        width={width}
        language={effectiveLanguage}
        value={fileContent}
        theme={effectiveTheme}
        options={mergedOptions}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading Monaco Editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

// Export additional utilities
export { monaco };
export type { MonacoEditorProps };
export { getLanguageFromFilePath, getMonacoOptions, setupCustomThemes };

export default MonacoEditor;