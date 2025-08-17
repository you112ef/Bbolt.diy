import { WebContainer } from '@webcontainer/api';
import { filesStore } from '~/lib/stores/files';

let webcontainerInstance: WebContainer | null = null;
let isInitialized = false;

// Enhanced WebContainer configuration
const WEBCONTAINER_CONFIG = {
  coep: 'credentialless' as const,
  workdirName: 'project',
  forwardPreviewErrors: true,
  // Add more robust configuration
  env: {
    NODE_ENV: 'development',
    // Enable better debugging
    DEBUG: 'webcontainer:*',
  },
  // Improve performance
  mount: {
    // Mount additional tools and utilities
    '/usr/local/bin': {
      directory: {
        'node': {
          file: {
            contents: '#!/bin/sh\nexec /usr/bin/node "$@"',
            mode: 0o755,
          },
        },
        'npm': {
          file: {
            contents: '#!/bin/sh\nexec /usr/bin/npm "$@"',
            mode: 0o755,
          },
        },
        'pnpm': {
          file: {
            contents: '#!/bin/sh\nexec /usr/bin/pnpm "$@"',
            mode: 0o755,
          },
        },
      },
    },
  },
};

// Enhanced error handling and recovery
class WebContainerManager {
  private instance: WebContainer | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private listeners: Map<string, Function[]> = new Map();

  async initialize(): Promise<WebContainer> {
    if (this.instance && isInitialized) {
      return this.instance;
    }

    try {
      console.log('Initializing WebContainer...');
      
      // Boot WebContainer with enhanced configuration
      this.instance = await WebContainer.boot(WEBCONTAINER_CONFIG);
      
      // Set up enhanced event listeners
      this.setupEventListeners();
      
      // Initialize file system
      await this.initializeFileSystem();
      
      isInitialized = true;
      webcontainerInstance = this.instance;
      
      console.log('WebContainer initialized successfully');
      return this.instance;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying WebContainer initialization (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.initialize();
      }
      
      throw new Error(`WebContainer initialization failed after ${this.maxRetries} attempts`);
    }
  }

  private setupEventListeners() {
    if (!this.instance) return;

    // Enhanced preview message handling
    this.instance.on('preview', (data) => {
      console.log('WebContainer preview:', data);
      this.emit('preview', data);
    });

    // Enhanced error handling
    this.instance.on('error', (error) => {
      console.error('WebContainer error:', error);
      this.emit('error', error);
    });

    // File system events
    this.instance.on('file-change', (event) => {
      console.log('File changed:', event);
      this.emit('file-change', event);
    });

    // Process events
    this.instance.on('process', (process) => {
      console.log('Process started:', process);
      this.emit('process', process);
    });
  }

  private async initializeFileSystem() {
    if (!this.instance) return;

    // Create basic project structure
    await this.instance.mount({
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'webcontainer-project',
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              'vite': '^5.0.0',
            },
          }, null, 2),
        },
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebContainer Project</title>
</head>
<body>
  <div id="app">
    <h1>Hello WebContainer!</h1>
    <p>Edit this file to see live changes.</p>
  </div>
  <script type="module" src="/main.js"></script>
</body>
</html>`,
        },
      },
      'main.js': {
        file: {
          contents: `console.log('Hello from WebContainer!');`,
        },
      },
      'vite.config.js': {
        file: {
          contents: `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
});`,
        },
      },
    });
  }

  // Enhanced file operations
  async writeFile(path: string, contents: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      await this.instance.mount({
        [path]: {
          file: { contents },
        },
      });
      
      // Update store
      filesStore.set({
        ...filesStore.get(),
        [path]: { contents, isLocked: false },
      });
      
      this.emit('file-written', { path, contents });
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
      throw error;
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const file = await this.instance.readFile(path);
      return file;
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      await this.instance.mount({
        [path]: null,
      });
      
      // Update store
      const files = filesStore.get();
      delete files[path];
      filesStore.set(files);
      
      this.emit('file-deleted', { path });
    } catch (error) {
      console.error(`Failed to delete file ${path}:`, error);
      throw error;
    }
  }

  // Enhanced process management
  async runCommand(command: string, args: string[] = []): Promise<any> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const process = await this.instance.spawn(command, args, {
        env: {
          ...process.env,
          NODE_ENV: 'development',
        },
      });

      return process;
    } catch (error) {
      console.error(`Failed to run command ${command}:`, error);
      throw error;
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Cleanup
  async dispose() {
    if (this.instance) {
      try {
        await this.instance.teardown();
      } catch (error) {
        console.error('Error during WebContainer teardown:', error);
      }
      this.instance = null;
      isInitialized = false;
      webcontainerInstance = null;
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.instance !== null && isInitialized;
  }

  // Get instance
  getInstance(): WebContainer | null {
    return this.instance;
  }
}

// Create singleton instance
const webContainerManager = new WebContainerManager();

// Export enhanced functions
export async function initializeWebContainer(): Promise<WebContainer> {
  return webContainerManager.initialize();
}

export async function getWebContainer(): Promise<WebContainer> {
  if (!webcontainerInstance || !isInitialized) {
    return initializeWebContainer();
  }
  return webcontainerInstance;
}

export async function writeFile(path: string, contents: string): Promise<void> {
  return webContainerManager.writeFile(path, contents);
}

export async function readFile(path: string): Promise<string> {
  return webContainerManager.readFile(path);
}

export async function deleteFile(path: string): Promise<void> {
  return webContainerManager.deleteFile(path);
}

export async function runCommand(command: string, args: string[] = []): Promise<any> {
  return webContainerManager.runCommand(command, args);
}

export function onWebContainerEvent(event: string, callback: Function) {
  webContainerManager.on(event, callback);
}

export function offWebContainerEvent(event: string, callback: Function) {
  webContainerManager.off(event, callback);
}

export async function disposeWebContainer(): Promise<void> {
  return webContainerManager.dispose();
}

export function isWebContainerHealthy(): boolean {
  return webContainerManager.isHealthy();
}

// Legacy exports for backward compatibility
export { webcontainerInstance as webcontainer };
