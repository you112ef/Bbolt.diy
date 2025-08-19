import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { EditorDocument } from '../codemirror/CodeMirrorEditor';

// Monaco editor interface
interface Monaco {
  editor: {
    create: (element: HTMLElement, options: any) => MonacoEditorInstance;
    setTheme: (theme: string) => void;
    defineTheme: (name: string, theme: any) => void;
  };
  languages: {
    typescript: {
      typescriptDefaults: any;
      javascriptDefaults: any;
    };
  };
}

interface MonacoEditorInstance {
  getValue: () => string;
  setValue: (value: string) => void;
  onDidChangeModelContent: (callback: () => void) => void;
  updateOptions: (options: any) => void;
  layout: () => void;
  dispose: () => void;
  getModel: () => any;
  focus: () => void;
}

interface MonacoEditorProps {
  value?: string;
  language?: string;
  theme?: 'light' | 'dark';
  onChange?: (value: string) => void;
  doc?: EditorDocument;
  editable?: boolean;
  autoFocusOnDocumentChange?: boolean;
  onSave?: () => void;
  className?: string;
}

// Define dark theme for Monaco
const darkTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#f0f6fc',
    'editorLineNumber.foreground': '#7d8590',
    'editorCursor.foreground': '#f0f6fc',
    'editor.selectionBackground': '#264f78',
    'editor.lineHighlightBackground': '#1c2128',
  },
};

let monacoPromise: Promise<Monaco> | null = null;

// Lazy load Monaco editor
const loadMonaco = (): Promise<Monaco> => {
  if (monacoPromise) {
    return monacoPromise;
  }

  monacoPromise = new Promise((resolve, reject) => {
    // Create script tag for Monaco loader
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js';
    script.onload = () => {
      // @ts-ignore
      const require = window.require;
      require.config({
        paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' },
      });

      require(['vs/editor/editor.main'], () => {
        // @ts-ignore
        const monaco = window.monaco;
        
        // Define dark theme
        monaco.editor.defineTheme('bolt-dark', darkTheme);
        
        resolve(monaco);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return monacoPromise;
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = '',
  language = 'javascript',
  theme = 'dark',
  onChange,
  doc,
  editable = true,
  autoFocusOnDocumentChange = false,
  onSave,
  className = '',
}) => {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  // Load Monaco editor
  useEffect(() => {
    loadMonaco()
      .then((monacoInstance) => {
        setMonaco(monacoInstance);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Monaco editor:', error);
      });
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!isLoaded || !monaco || !containerRef.current || editorRef.current) {
      return;
    }

    const editor = monaco.editor.create(containerRef.current, {
      value: doc?.content || value,
      language: doc?.language || language,
      theme: theme === 'dark' ? 'bolt-dark' : 'vs',
      readOnly: !editable,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
    });

    editorRef.current = editor;

    // Setup change handler
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      onChange?.(newValue);
    });

    // Setup save handler
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        onSave?.();
      },
    });

    if (autoFocusOnDocumentChange) {
      editor.focus();
    }

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, [isLoaded, monaco, editable]);

  // Update content when doc changes
  useEffect(() => {
    if (!editorRef.current || !doc) {
      return;
    }

    const currentValue = editorRef.current.getValue();
    if (currentValue !== doc.content) {
      editorRef.current.setValue(doc.content);
    }

    // Update language if needed
    const model = editorRef.current.getModel();
    if (model && model.getLanguageId() !== doc.language) {
      monaco?.editor.setModelLanguage(model, doc.language || 'javascript');
    }

    if (autoFocusOnDocumentChange) {
      editorRef.current.focus();
    }
  }, [doc, autoFocusOnDocumentChange, monaco]);

  // Update theme
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.setTheme(theme === 'dark' ? 'bolt-dark' : 'vs');
  }, [theme, monaco]);

  // Update readOnly state
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({ readOnly: !editable });
  }, [editable]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          Loading Monaco Editor...
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default MonacoEditor;