import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let isInitialized = false;

const WEBCONTAINER_CONFIG = {
  coep: 'credentialless' as const,
  workdirName: 'project',
  forwardPreviewErrors: true,
  env: {
    NODE_ENV: 'development',
    DEBUG: 'webcontainer:*',
  },
  mount: {
    node_modules: {
      directory: {
        fs: 'node_modules',
      },
    },
    npm: {
      directory: {
        fs: 'npm',
      },
    },
    pnpm: {
      directory: {
        fs: 'pnpm',
      },
    },
  },
};

class WebContainerManager {
  private instance: WebContainer | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private listeners: Map<string, Function[]> = new Map();

  async initialize(): Promise<WebContainer> {
    if (this.instance) {
      return this.instance;
    }

    try {
      console.log('Initializing WebContainer...');
      
      this.instance = await WebContainer.boot(WEBCONTAINER_CONFIG);
      
      this.setupEventListeners();
      await this.initializeFileSystem();
      
      isInitialized = true;
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
      
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.instance) return;

    // Preview events
    this.instance.on('server-ready', (port, url) => {
      console.log(`Server ready on port ${port}: ${url}`);
      this.emit('preview-ready', { port, url });
    });

    // Error events
    this.instance.on('error', (error) => {
      console.error('WebContainer error:', error);
      this.emit('error', error);
    });

    // File change events
    this.instance.on('file-change', (path) => {
      console.log(`File changed: ${path}`);
      this.emit('file-change', path);
    });

    // Process events
    this.instance.on('process', (process) => {
      console.log(`Process started: ${process.command}`);
      this.emit('process-start', process);
    });
  }

  private async initializeFileSystem() {
    if (!this.instance) return;

    try {
      // Create initial project structure
      await this.writeFile('package.json', JSON.stringify({
        name: 'webcontainer-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          'vite': '^5.0.0'
        }
      }, null, 2));

      await this.writeFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebContainer Project</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>`);

      await this.writeFile('main.js', `console.log('Hello from WebContainer!');`);

      await this.writeFile('vite.config.js', `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000
  }
});`);

      console.log('File system initialized');
    } catch (error) {
      console.error('Failed to initialize file system:', error);
    }
  }

  async writeFile(path: string, contents: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      await this.instance.fs.writeFile(path, contents);
      console.log(`File written: ${path}`);
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
      const content = await this.instance.fs.readFile(path, 'utf-8');
      return content;
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
      await this.instance.fs.rm(path);
      console.log(`File deleted: ${path}`);
    } catch (error) {
      console.error(`Failed to delete file ${path}:`, error);
      throw error;
    }
  }

  async runCommand(command: string, args: string[] = []): Promise<any> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const process = await this.instance.spawn(command, args);
      console.log(`Command executed: ${command} ${args.join(' ')}`);
      return process;
    } catch (error) {
      console.error(`Failed to run command ${command}:`, error);
      throw error;
    }
  }

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
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  async dispose() {
    if (this.instance) {
      try {
        // Cleanup any running processes
        // Note: WebContainer doesn't have a dispose method, so we just clear references
        this.instance = null;
        this.listeners.clear();
        isInitialized = false;
        console.log('WebContainer disposed');
      } catch (error) {
        console.error('Error disposing WebContainer:', error);
      }
    }
  }

  isHealthy(): boolean {
    return this.instance !== null && isInitialized;
  }

  getInstance(): WebContainer | null {
    return this.instance;
  }
}

const webContainerManager = new WebContainerManager();

export async function initializeWebContainer(): Promise<WebContainer> {
  return webContainerManager.initialize();
}

export async function getWebContainer(): Promise<WebContainer> {
  if (!webContainerManager.isHealthy()) {
    return webContainerManager.initialize();
  }
  return webContainerManager.getInstance()!;
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

export { webcontainerInstance as webcontainer };
