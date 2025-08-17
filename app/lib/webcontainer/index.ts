import { WebContainer } from '@webcontainer/api';
import { filesStore } from '~/lib/stores/files';

// Promise-based singleton for WebContainer instance
let _webcontainerPromise: Promise<WebContainer> | null = null;

function getWebcontainerPromise(): Promise<WebContainer> {
  if (!_webcontainerPromise) {
    _webcontainerPromise = WebContainer.boot({
      workdirName: 'project',
    });
  }

  return _webcontainerPromise;
}

export const webcontainerInstance: Promise<WebContainer> = getWebcontainerPromise();

class WebContainerManager {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing WebContainer...');

      const instance = await getWebcontainerPromise();

      // Setup file system watchers once
      this.setupFileWatchers(instance);

      this.isInitialized = true;
      console.log('WebContainer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      throw error;
    }
  }

  private setupFileWatchers(instance: WebContainer): void {
    try {
      // Watch for file changes and update any connected stores
      instance.fs.watch('/', (eventType, filename) => {
        console.log(`File system event: ${eventType} - ${filename}`);
      });
    } catch (err) {
      // Some environments may not support fs.watch
      console.warn('WebContainer fs.watch not available in this environment:', err);
    }
  }

  async writeFile(path: string, contents: string): Promise<void> {
    const instance = await getWebcontainerPromise();
    await instance.fs.writeFile(path, contents);
    console.log(`File written: ${path}`);
  }

  async deleteFile(path: string): Promise<void> {
    const instance = await getWebcontainerPromise();
    await instance.fs.rm(path);
    console.log(`File deleted: ${path}`);
  }

  async readFile(path: string): Promise<string> {
    const instance = await getWebcontainerPromise();
    const contents = await instance.fs.readFile(path, 'utf-8');
    return contents;
  }

  async listFiles(path: string = '/'): Promise<string[]> {
    const instance = await getWebcontainerPromise();
    const files = await instance.fs.readdir(path);
    return files as string[];
  }

  async runCommand(command: string, args: string[] = []): Promise<{ exitCode: number; output: string; error: string }> {
    const instance = await getWebcontainerPromise();

    const process = await instance.spawn(command, args);

    let output = '';
    let error = '';

    await process.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
        },
      }),
    );

    await process.stderr.pipeTo(
      new WritableStream({
        write(data) {
          error += data;
        },
      }),
    );

    const exitCode = await process.exit;

    return { exitCode, output, error };
  }

  async installDependencies(): Promise<void> {
    console.log('Installing dependencies...');
    const { exitCode } = await this.runCommand('npm', ['install']);
    if (exitCode !== 0) {
      throw new Error(`Failed to install dependencies (exit code: ${exitCode})`);
    }
    console.log('Dependencies installed successfully');
  }

  async startDevServer(): Promise<void> {
    console.log('Starting development server...');
    const instance = await getWebcontainerPromise();
    await instance.spawn('npm', ['run', 'dev']);
    console.log('Development server started');
  }

  async destroy(): Promise<void> {
    // WebContainer does not expose a destroy method; clear internal state
    this.isInitialized = false;
    this.initializationPromise = null;
    _webcontainerPromise = null;
    console.log('WebContainer reset');
  }

  getInstance(): Promise<WebContainer> {
    return getWebcontainerPromise();
  }

  isReady(): boolean {
    return !!this.initializationPromise || this.isInitialized;
  }
}

export const webcontainerManager = new WebContainerManager();
