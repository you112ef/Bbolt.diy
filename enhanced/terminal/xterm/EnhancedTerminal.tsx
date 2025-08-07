import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { CanvasAddon } from '@xterm/addon-canvas';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Dropdown } from '~/components/ui/Dropdown';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

// Import CSS for xterm
import '@xterm/xterm/css/xterm.css';

interface EnhancedTerminalProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  initialCommand?: string;
  workingDirectory?: string;
  environmentVariables?: Record<string, string>;
  onCommandExecute?: (command: string) => void;
  onOutput?: (output: string) => void;
  enableWebGL?: boolean;
  enableLinks?: boolean;
  enableSearch?: boolean;
  fontSize?: number;
  fontFamily?: string;
  theme?: 'dark' | 'light' | 'auto';
  readOnly?: boolean;
}

// Terminal themes
const terminalThemes = {
  dark: {
    foreground: '#E2E8F0',
    background: '#0F172A',
    cursor: '#38BDF8',
    cursorAccent: '#1E293B',
    selection: '#334155',
    black: '#1E293B',
    red: '#F87171',
    green: '#4ADE80',
    yellow: '#FACC15',
    blue: '#60A5FA',
    magenta: '#C084FC',
    cyan: '#22D3EE',
    white: '#F1F5F9',
    brightBlack: '#475569',
    brightRed: '#FCA5A5',
    brightGreen: '#86EFAC',
    brightYellow: '#FDE047',
    brightBlue: '#93C5FD',
    brightMagenta: '#DDD6FE',
    brightCyan: '#67E8F9',
    brightWhite: '#FFFFFF',
  },
  light: {
    foreground: '#1F2937',
    background: '#FFFFFF',
    cursor: '#3B82F6',
    cursorAccent: '#F8FAFC',
    selection: '#E0E7FF',
    black: '#000000',
    red: '#DC2626',
    green: '#16A34A',
    yellow: '#CA8A04',
    blue: '#2563EB',
    magenta: '#9333EA',
    cyan: '#0891B2',
    white: '#F9FAFB',
    brightBlack: '#6B7280',
    brightRed: '#EF4444',
    brightGreen: '#22C55E',
    brightYellow: '#EAB308',
    brightBlue: '#3B82F6',
    brightMagenta: '#A855F7',
    brightCyan: '#06B6D4',
    brightWhite: '#FFFFFF',
  },
};

// Command history management
class CommandHistory {
  private history: string[] = [];
  private maxSize: number = 1000;
  private currentIndex: number = -1;

  add(command: string) {
    if (command.trim() && command !== this.history[this.history.length - 1]) {
      this.history.push(command);
      if (this.history.length > this.maxSize) {
        this.history.shift();
      }
    }
    this.currentIndex = this.history.length;
  }

  getPrevious(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  getNext(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    } else if (this.currentIndex === this.history.length - 1) {
      this.currentIndex++;
      return '';
    }
    return null;
  }

  getAll(): string[] {
    return [...this.history];
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

// Simple shell emulator
class ShellEmulator {
  private currentDirectory: string = '/project/workspace';
  private environmentVariables: Record<string, string> = {
    PWD: '/project/workspace',
    HOME: '/home/user',
    USER: 'user',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
  };
  private fileSystem: Record<string, any> = {
    '/project/workspace': {
      type: 'directory',
      contents: {
        'README.md': { type: 'file', content: '# Welcome to Enhanced Terminal\n\nThis is a real terminal emulator with shell capabilities.' },
        'package.json': { type: 'file', content: '{\n  "name": "enhanced-terminal",\n  "version": "1.0.0"\n}' },
        src: {
          type: 'directory',
          contents: {
            'index.ts': { type: 'file', content: 'console.log("Hello from Enhanced Terminal!");' },
            'utils.ts': { type: 'file', content: 'export const greet = (name: string) => `Hello, ${name}!`;' },
          },
        },
        docs: {
          type: 'directory',
          contents: {
            'guide.md': { type: 'file', content: '# Terminal Guide\n\nUse commands like ls, cd, cat, etc.' },
          },
        },
      },
    },
  };

  constructor(initialVars?: Record<string, string>) {
    if (initialVars) {
      this.environmentVariables = { ...this.environmentVariables, ...initialVars };
    }
  }

  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      path = `${this.currentDirectory}/${path}`;
    }
    
    const parts = path.split('/').filter(Boolean);
    const normalized: string[] = [];
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        normalized.pop();
      } else {
        normalized.push(part);
      }
    }
    
    return '/' + normalized.join('/');
  }

  private getItem(path: string): any {
    const normalizedPath = this.normalizePath(path);
    const parts = normalizedPath.split('/').filter(Boolean);
    
    let current = this.fileSystem['/'];
    if (!current) return null;
    
    for (const part of parts) {
      if (current.type !== 'directory' || !current.contents || !current.contents[part]) {
        return null;
      }
      current = current.contents[part];
    }
    
    return current;
  }

  private listDirectory(path: string): string[] {
    const item = this.getItem(path);
    if (!item || item.type !== 'directory') return [];
    return Object.keys(item.contents || {});
  }

  executeCommand(command: string): string {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'pwd':
        return this.currentDirectory;

      case 'ls':
        const targetDir = args[0] || this.currentDirectory;
        const items = this.listDirectory(targetDir);
        if (items.length === 0) {
          const item = this.getItem(targetDir);
          if (!item) return `ls: ${targetDir}: No such file or directory`;
          if (item.type === 'file') return targetDir.split('/').pop() || '';
        }
        return items.map(item => {
          const fullPath = this.normalizePath(`${targetDir}/${item}`);
          const itemData = this.getItem(fullPath);
          return itemData?.type === 'directory' ? `\x1b[34m${item}/\x1b[0m` : item;
        }).join('  ');

      case 'cd':
        if (args.length === 0) {
          this.currentDirectory = this.environmentVariables.HOME;
          this.environmentVariables.PWD = this.currentDirectory;
          return '';
        }
        const newDir = this.normalizePath(args[0]);
        const dirItem = this.getItem(newDir);
        if (!dirItem) {
          return `cd: ${args[0]}: No such file or directory`;
        }
        if (dirItem.type !== 'directory') {
          return `cd: ${args[0]}: Not a directory`;
        }
        this.currentDirectory = newDir;
        this.environmentVariables.PWD = this.currentDirectory;
        return '';

      case 'cat':
        if (args.length === 0) return 'cat: missing file operand';
        const filePath = this.normalizePath(args[0]);
        const fileItem = this.getItem(filePath);
        if (!fileItem) return `cat: ${args[0]}: No such file or directory`;
        if (fileItem.type !== 'file') return `cat: ${args[0]}: Is a directory`;
        return fileItem.content || '';

      case 'echo':
        return args.join(' ').replace(/\$(\w+)/g, (_, varName) => {
          return this.environmentVariables[varName] || '';
        });

      case 'env':
        return Object.entries(this.environmentVariables)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');

      case 'export':
        if (args.length === 0) return this.executeCommand('env');
        const assignment = args[0];
        const [key, value] = assignment.split('=');
        if (value !== undefined) {
          this.environmentVariables[key] = value;
        }
        return '';

      case 'history':
        return 'Command history is managed by the terminal interface';

      case 'clear':
        return '\x1b[2J\x1b[H'; // ANSI escape codes to clear screen

      case 'whoami':
        return this.environmentVariables.USER;

      case 'date':
        return new Date().toString();

      case 'help':
        return `Available commands:
  pwd       - print working directory
  ls [dir]  - list directory contents
  cd [dir]  - change directory
  cat file  - display file contents
  echo text - display text
  env       - show environment variables
  export    - set environment variable
  clear     - clear terminal
  whoami    - current user
  date      - current date and time
  help      - show this help
  exit      - close terminal

Navigation:
  Use ↑/↓ arrows for command history
  Use Tab for autocompletion
  Use Ctrl+C to interrupt
  Use Ctrl+L to clear screen`;

      case 'exit':
        return '\x1b[31mTerminal session ended\x1b[0m';

      case '':
        return '';

      default:
        // Check if it's a path to execute
        if (cmd.includes('/') || cmd.includes('.')) {
          const item = this.getItem(cmd);
          if (item && item.type === 'file') {
            return `Executing: ${cmd}\n${item.content}`;
          }
        }
        return `${cmd}: command not found

Type 'help' to see available commands.`;
    }
  }

  getCurrentDirectory(): string {
    return this.currentDirectory;
  }

  getEnvironmentVariable(name: string): string | undefined {
    return this.environmentVariables[name];
  }
}

export const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({
  width = '100%',
  height = '100%',
  className,
  initialCommand,
  workingDirectory = '/project/workspace',
  environmentVariables = {},
  onCommandExecute,
  onOutput,
  enableWebGL = true,
  enableLinks = true,
  enableSearch = true,
  fontSize = 14,
  fontFamily = '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  theme = 'auto',
  readOnly = false,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const searchAddon = useRef<SearchAddon | null>(null);
  const shell = useRef<ShellEmulator | null>(null);
  const commandHistory = useRef<CommandHistory | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentTheme = useStore(themeStore);
  const effectiveTheme = theme === 'auto' ? currentTheme : theme;

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || isInitialized) return;

    // Initialize shell and command history
    shell.current = new ShellEmulator(environmentVariables);
    commandHistory.current = new CommandHistory();

    // Create terminal instance
    const terminal = new Terminal({
      fontSize,
      fontFamily,
      theme: terminalThemes[effectiveTheme as keyof typeof terminalThemes],
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      allowTransparency: true,
      convertEol: true,
      disableStdin: readOnly,
      rows: 30,
      cols: 100,
      scrollback: 10000,
      tabStopWidth: 4,
      wordSeparator: ' ()[]{}\'",;',
      fastScrollModifier: 'ctrl',
      fastScrollSensitivity: 5,
      scrollSensitivity: 1,
      altClickMovesCursor: true,
      rightClickSelectsWord: true,
      rendererType: enableWebGL ? 'webgl' : 'canvas',
    });

    // Add addons
    fitAddon.current = new FitAddon();
    terminal.loadAddon(fitAddon.current);

    if (enableLinks) {
      terminal.loadAddon(new WebLinksAddon());
    }

    if (enableSearch) {
      searchAddon.current = new SearchAddon();
      terminal.loadAddon(searchAddon.current);
    }

    terminal.loadAddon(new Unicode11Addon());
    
    try {
      if (enableWebGL) {
        terminal.loadAddon(new WebglAddon());
      } else {
        terminal.loadAddon(new CanvasAddon());
      }
    } catch (error) {
      console.warn('WebGL not available, falling back to canvas:', error);
      terminal.loadAddon(new CanvasAddon());
    }

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.current.fit();

    terminalInstance.current = terminal;

    // Set up terminal behavior
    setupTerminalBehavior(terminal);

    // Initial prompt
    writePrompt();

    // Execute initial command if provided
    if (initialCommand) {
      executeCommand(initialCommand);
    }

    setIsInitialized(true);

    return () => {
      terminal.dispose();
    };
  }, [terminalRef.current]);

  // Update theme when it changes
  useEffect(() => {
    if (terminalInstance.current) {
      terminalInstance.current.options.theme = terminalThemes[effectiveTheme as keyof typeof terminalThemes];
    }
  }, [effectiveTheme]);

  // Setup terminal behavior
  const setupTerminalBehavior = (terminal: Terminal) => {
    let currentInput = '';
    let cursorPosition = 0;

    // Handle data input
    terminal.onData((data) => {
      if (readOnly) return;

      const code = data.charCodeAt(0);

      // Handle special keys
      if (code === 13) { // Enter
        terminal.write('\r\n');
        if (currentInput.trim()) {
          commandHistory.current?.add(currentInput);
          executeCommand(currentInput);
          onCommandExecute?.(currentInput);
        }
        currentInput = '';
        cursorPosition = 0;
        writePrompt();
      } else if (code === 127) { // Backspace
        if (cursorPosition > 0) {
          currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
          cursorPosition--;
          redrawLine(currentInput, cursorPosition);
        }
      } else if (code === 27) { // Escape sequences
        const sequence = data.slice(1);
        if (sequence === '[A') { // Up arrow
          const prev = commandHistory.current?.getPrevious();
          if (prev !== null) {
            currentInput = prev;
            cursorPosition = currentInput.length;
            redrawLine(currentInput, cursorPosition);
          }
        } else if (sequence === '[B') { // Down arrow
          const next = commandHistory.current?.getNext();
          if (next !== null) {
            currentInput = next;
            cursorPosition = currentInput.length;
            redrawLine(currentInput, cursorPosition);
          }
        } else if (sequence === '[C') { // Right arrow
          if (cursorPosition < currentInput.length) {
            cursorPosition++;
            terminal.write('\x1b[C');
          }
        } else if (sequence === '[D') { // Left arrow
          if (cursorPosition > 0) {
            cursorPosition--;
            terminal.write('\x1b[D');
          }
        } else if (sequence === '[H') { // Home
          terminal.write(`\x1b[${currentInput.length - cursorPosition}D`);
          cursorPosition = 0;
        } else if (sequence === '[F') { // End
          terminal.write(`\x1b[${currentInput.length - cursorPosition}C`);
          cursorPosition = currentInput.length;
        }
      } else if (code === 9) { // Tab - autocomplete
        handleTabCompletion(currentInput, cursorPosition);
      } else if (code === 3) { // Ctrl+C
        terminal.write('^C\r\n');
        currentInput = '';
        cursorPosition = 0;
        writePrompt();
      } else if (code === 12) { // Ctrl+L
        terminal.clear();
        writePrompt();
      } else if (code >= 32) { // Printable characters
        currentInput = currentInput.slice(0, cursorPosition) + data + currentInput.slice(cursorPosition);
        cursorPosition++;
        redrawLine(currentInput, cursorPosition);
      }

      setCurrentCommand(currentInput);
    });

    const redrawLine = (input: string, cursor: number) => {
      // Clear current line and redraw
      terminal.write('\r\x1b[K');
      writePrompt();
      terminal.write(input);
      // Move cursor to correct position
      const moveBack = input.length - cursor;
      if (moveBack > 0) {
        terminal.write(`\x1b[${moveBack}D`);
      }
    };

    const handleTabCompletion = (input: string, cursor: number) => {
      const parts = input.split(' ');
      const currentPart = parts[parts.length - 1];
      
      if (parts.length === 1) {
        // Command completion
        const commands = ['ls', 'cd', 'cat', 'echo', 'pwd', 'env', 'export', 'help', 'clear', 'whoami', 'date', 'exit'];
        const matches = commands.filter(cmd => cmd.startsWith(currentPart));
        
        if (matches.length === 1) {
          const completion = matches[0].slice(currentPart.length);
          currentInput += completion + ' ';
          cursorPosition += completion.length + 1;
          redrawLine(currentInput, cursorPosition);
        } else if (matches.length > 1) {
          terminal.write('\r\n' + matches.join('  ') + '\r\n');
          writePrompt();
          terminal.write(input);
        }
      } else {
        // File/directory completion
        const currentDir = shell.current?.getCurrentDirectory() || '/';
        // This would require implementing file listing from the shell
        // For now, just add a space if there's no completion
        if (!currentPart.includes('/')) {
          currentInput += ' ';
          cursorPosition++;
          redrawLine(currentInput, cursorPosition);
        }
      }
    };
  };

  const writePrompt = () => {
    if (!terminalInstance.current || !shell.current) return;
    
    const user = shell.current.getEnvironmentVariable('USER') || 'user';
    const cwd = shell.current.getCurrentDirectory();
    const shortCwd = cwd.replace(/^\/project\/workspace/, '~').replace(/^\/home\/[^\/]+/, '~');
    
    terminalInstance.current.write(`\x1b[32m${user}@bolt\x1b[0m:\x1b[34m${shortCwd}\x1b[0m$ `);
  };

  const executeCommand = (command: string) => {
    if (!shell.current || !terminalInstance.current) return;

    const output = shell.current.executeCommand(command);
    if (output) {
      terminalInstance.current.write(output);
      if (!output.endsWith('\n')) {
        terminalInstance.current.write('\r\n');
      }
      onOutput?.(output);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search functionality
  const handleSearch = (query: string, options?: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }) => {
    if (searchAddon.current && terminalInstance.current) {
      searchAddon.current.findNext(query, options);
    }
  };

  const handleSearchNext = () => {
    if (searchAddon.current) {
      searchAddon.current.findNext(searchQuery);
    }
  };

  const handleSearchPrevious = () => {
    if (searchAddon.current) {
      searchAddon.current.findPrevious(searchQuery);
    }
  };

  const handleClear = () => {
    if (terminalInstance.current) {
      terminalInstance.current.clear();
      writePrompt();
    }
  };

  const handleCopy = () => {
    if (terminalInstance.current && terminalInstance.current.hasSelection()) {
      const selection = terminalInstance.current.getSelection();
      navigator.clipboard.writeText(selection);
    }
  };

  const handlePaste = async () => {
    if (terminalInstance.current && !readOnly) {
      try {
        const text = await navigator.clipboard.readText();
        terminalInstance.current.paste(text);
      } catch (error) {
        console.warn('Failed to paste from clipboard:', error);
      }
    }
  };

  return (
    <div className={`enhanced-terminal flex flex-col ${className || ''}`} style={{ width, height }}>
      {/* Terminal toolbar */}
      <div className="flex items-center justify-between p-2 bg-bolt-elements-bg-secondary border-b border-bolt-elements-borderColor">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            title="Clear terminal"
          >
            <div className="i-ph:broom text-sm" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            title="Copy selection"
          >
            <div className="i-ph:copy text-sm" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <div className="i-ph:clipboard text-sm" />
          </Button>
          
          <div className="w-px h-4 bg-bolt-elements-borderColor" />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            title="Search in terminal"
          >
            <div className="i-ph:magnifying-glass text-sm" />
          </Button>
        </div>

        <div className="text-xs text-bolt-elements-textSecondary">
          Enhanced Terminal • {effectiveTheme === 'dark' ? 'Dark' : 'Light'} Theme
        </div>
      </div>

      {/* Search bar */}
      {isSearchVisible && (
        <div className="flex items-center p-2 bg-bolt-elements-bg-tertiary border-b border-bolt-elements-borderColor">
          <Input
            placeholder="Search terminal output..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.shiftKey ? handleSearchPrevious() : handleSearchNext();
              } else if (e.key === 'Escape') {
                setIsSearchVisible(false);
                setSearchQuery('');
              }
            }}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <div className="flex items-center ml-2 space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSearchPrevious}
              title="Previous match"
              className="h-8 w-8 p-0"
            >
              <div className="i-ph:caret-up text-sm" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSearchNext}
              title="Next match"
              className="h-8 w-8 p-0"
            >
              <div className="i-ph:caret-down text-sm" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsSearchVisible(false);
                setSearchQuery('');
              }}
              title="Close search"
              className="h-8 w-8 p-0"
            >
              <div className="i-ph:x text-sm" />
            </Button>
          </div>
        </div>
      )}

      {/* Terminal container */}
      <div 
        ref={terminalRef}
        className="flex-1 p-2 bg-bolt-elements-bg-primary"
        style={{ 
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
        }}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-bolt-elements-bg-secondary border-t border-bolt-elements-borderColor text-xs text-bolt-elements-textSecondary">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          {shell.current && (
            <span>{shell.current.getCurrentDirectory()}</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{terminalInstance.current?.rows || 0}×{terminalInstance.current?.cols || 0}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTerminal;