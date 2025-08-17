import { WebContainer } from '@webcontainer/api';
import { filesStore } from '~/lib/stores/files';

let webcontainerInstance: WebContainer | null = null;

class WebContainerManager {
  private instance: WebContainer | null = null;
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
      
      this.instance = await WebContainer.boot({
        workdirName: 'project',
        mount: {
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: 'ai-platform',
                type: 'module',
                scripts: {
                  dev: 'vite',
                  build: 'vite build',
                  preview: 'vite preview'
                },
                dependencies: {
                  'react': '^18.0.0',
                  'react-dom': '^18.0.0',
                  'vite': '^4.0.0',
                  '@vitejs/plugin-react': '^3.0.0'
                }
              })
            }
          },
          'vite.config.js': {
            file: {
              contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});
              `.trim()
            }
          },
          'index.html': {
            file: {
              contents: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
              `.trim()
            }
          },
          'src/main.jsx': {
            file: {
              contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
              `.trim()
            }
          },
          'src/App.jsx': {
            file: {
              contents: `
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>مرحباً بك في منصة الذكاء الاصطناعي</h1>
      <p>هذا مشروع تجريبي يعمل في WebContainer</p>
    </div>
  );
}

export default App;
              `.trim()
            }
          }
        }
      });

      webcontainerInstance = this.instance;
      this.isInitialized = true;
      
      console.log('WebContainer initialized successfully');
      
      // Set up file system watchers
      this.setupFileWatchers();
      
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      throw error;
    }
  }

  private setupFileWatchers(): void {
    if (!this.instance) return;

    // Watch for file changes and update the files store
    this.instance.fs.watch('/', (eventType, filename) => {
      console.log(`File system event: ${eventType} - ${filename}`);
      
      // Update files store if it exists
      // Trigger a refresh of the file system
      this.refreshFileSystem();
    });
  }

  private async refreshFileSystem(): Promise<void> {
    if (!this.instance) return;

    try {
      const files = await this.instance.fs.readdir('/');
      console.log('File system refreshed:', files);
    } catch (error) {
      console.error('Error refreshing file system:', error);
    }
  }

  async writeFile(path: string, contents: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      await this.instance.fs.writeFile(path, contents);
      console.log(`File written: ${path}`);
      
      // Update files store if it exists
      // The file watcher will handle the update
    } catch (error) {
      console.error(`Error writing file ${path}:`, error);
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
      
      // Update files store if it exists
      // The file watcher will handle the update
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      throw error;
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const contents = await this.instance.fs.readFile(path, 'utf-8');
      return contents;
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      throw error;
    }
  }

  async listFiles(path: string = '/'): Promise<string[]> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const files = await this.instance.fs.readdir(path);
      return files as string[];
    } catch (error) {
      console.error(`Error listing files in ${path}:`, error);
      throw error;
    }
  }

  async runCommand(command: string, args: string[] = []): Promise<{ exitCode: number; output: string; error: string }> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const process = await this.instance.spawn(command, args);
      
      let output = '';
      let error = '';

      process.output.pipeTo(new WritableStream({
        write(data) {
          output += data;
        }
      }));

      process.stderr.pipeTo(new WritableStream({
        write(data) {
          error += data;
        }
      }));

      const exitCode = await process.exit;
      
      return { exitCode, output, error };
    } catch (err) {
      console.error(`Error running command ${command}:`, err);
      throw err;
    }
  }

  async installDependencies(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      console.log('Installing dependencies...');
      const { exitCode } = await this.runCommand('npm', ['install']);
      
      if (exitCode === 0) {
        console.log('Dependencies installed successfully');
      } else {
        throw new Error(`Failed to install dependencies (exit code: ${exitCode})`);
      }
    } catch (error) {
      console.error('Error installing dependencies:', error);
      throw error;
    }
  }

  async startDevServer(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer not initialized');
    }

    try {
      console.log('Starting development server...');
      const process = await this.instance.spawn('npm', ['run', 'dev']);
      
      // The dev server will continue running
      console.log('Development server started');
    } catch (error) {
      console.error('Error starting development server:', error);
      throw error;
    }
  }

  getInstance(): WebContainer | null {
    return this.instance;
  }

  isReady(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  async destroy(): Promise<void> {
    if (this.instance) {
      // WebContainer doesn't have a destroy method, but we can clean up our references
      this.instance = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      webcontainerInstance = null;
      console.log('WebContainer destroyed');
    }
  }
}

export const webcontainerManager = new WebContainerManager();

// Export the global instance for backward compatibility
export { webcontainerInstance };
