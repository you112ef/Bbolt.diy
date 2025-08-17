import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { webcontainerManager } from '~/lib/webcontainer';
import { map, type MapStore } from 'nanostores';
import type { WebContainer } from '@webcontainer/api';
import type { FileMap as WCFileMap, File as WCFile, Folder as WCFolder } from '~/lib/.server/llm/constants';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  content?: string;
}

interface FilesState {
  files: FileItem[];
  currentDirectory: string;
  isLoading: boolean;
  error: string | null;
  selectedFile: string | null;
}

interface FilesActions {
  // File Operations
  loadFiles: (path?: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  updateFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  
  // Navigation
  navigateTo: (path: string) => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  
  // Selection
  selectFile: (path: string | null) => void;
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility
  refresh: () => Promise<void>;
  reset: () => void;
}

const initialState: FilesState = {
  files: [],
  currentDirectory: '/',
  isLoading: false,
  error: null,
  selectedFile: null
};

export const filesStore = create<FilesState & FilesActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // File Operations
      loadFiles: async (path = '/') => {
        set({ isLoading: true, error: null });
        
        try {
          await webcontainerManager.initialize();
          
          const fileList = await webcontainerManager.listFiles(path);
          const files: FileItem[] = [];
          
          for (const fileName of fileList) {
            const filePath = path === '/' ? `/${fileName}` : `${path}/${fileName}`;
            
            try {
              const dir = await webcontainerManager.getInstance().then((wc) => wc.fs.readdir(path, { withFileTypes: true }) as any);
              const entry = (dir as any[]).find((e) => e.name === fileName);
              
              files.push({
                name: fileName,
                path: filePath,
                type: entry && typeof entry.isDirectory === 'function' && entry.isDirectory() ? 'directory' : 'file',
                size: undefined,
                lastModified: undefined
              });
            } catch (error) {
              console.warn(`Could not get stats for ${filePath}:`, error);
              // Add file anyway with basic info
              files.push({
                name: fileName,
                path: filePath,
                type: 'file'
              });
            }
          }
          
          set({
            files: files.sort((a, b) => {
              // Directories first, then files
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            }),
            currentDirectory: path,
            isLoading: false
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل الملفات';
          set({ error: errorMessage, isLoading: false });
        }
      },

      createFile: async (path: string, content = '') => {
        set({ isLoading: true, error: null });
        
        try {
          await webcontainerManager.initialize();
          await webcontainerManager.writeFile(path, content);
          
          // Refresh the file list
          await get().loadFiles(get().currentDirectory);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء الملف';
          set({ error: errorMessage, isLoading: false });
        }
      },

      updateFile: async (path: string, content: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await webcontainerManager.initialize();
          await webcontainerManager.writeFile(path, content);
          
          // Update the file in the list
          set(state => ({
            files: state.files.map(file =>
              file.path === path
                ? { ...file, lastModified: new Date() }
                : file
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث الملف';
          set({ error: errorMessage, isLoading: false });
        }
      },

      deleteFile: async (path: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await webcontainerManager.initialize();
          await webcontainerManager.deleteFile(path);
          
          // Refresh the file list
          await get().loadFiles(get().currentDirectory);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في حذف الملف';
          set({ error: errorMessage, isLoading: false });
        }
      },

      renameFile: async (oldPath: string, newPath: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await webcontainerManager.initialize();
          
          // Read the old file
          const content = await webcontainerManager.readFile(oldPath);
          
          // Create the new file
          await webcontainerManager.writeFile(newPath, content);
          
          // Delete the old file
          await webcontainerManager.deleteFile(oldPath);
          
          // Refresh the file list
          await get().loadFiles(get().currentDirectory);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'فشل في إعادة تسمية الملف';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Navigation
      navigateTo: async (path: string) => {
        await get().loadFiles(path);
      },

      goBack: () => {
        const currentPath = get().currentDirectory;
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        get().navigateTo(parentPath);
      },

      goForward: () => {
        // This would require maintaining a history stack
        // For now, we'll just refresh the current directory
        get().refresh();
      },

      // Selection
      selectFile: (path: string | null) => {
        set({ selectedFile: path });
      },

      // State Management
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Utility
      refresh: async () => {
        await get().loadFiles(get().currentDirectory);
      },

      reset: () => set(initialState)
    }),
    {
      name: 'files-storage',
      partialize: (state) => ({
        currentDirectory: state.currentDirectory,
        selectedFile: state.selectedFile
      })
    }
  )
);

// Export actions for easier access
export const filesActions = {
  loadFiles: filesStore.getState().loadFiles,
  createFile: filesStore.getState().createFile,
  updateFile: filesStore.getState().updateFile,
  deleteFile: filesStore.getState().deleteFile,
  renameFile: filesStore.getState().renameFile,
  navigateTo: filesStore.getState().navigateTo,
  goBack: filesStore.getState().goBack,
  goForward: filesStore.getState().goForward,
  selectFile: filesStore.getState().selectFile,
  setLoading: filesStore.getState().setLoading,
  setError: filesStore.getState().setError,
  clearError: filesStore.getState().clearError,
  refresh: filesStore.getState().refresh,
  reset: filesStore.getState().reset
};

// Re-export the FileMap type used across workbench/editor
export type FileMap = WCFileMap;

// Minimal FilesStore class used by workbench/editor code paths
export class FilesStore {
  #webcontainer: Promise<WebContainer>;
  files: MapStore<FileMap> = map({} as FileMap);
  #modifiedFiles = new Map<string, string>();

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
  }

  get filesCount(): number {
    const files = this.files.get();
    return Object.keys(files || {}).length;
  }

  getFile(path: string): (WCFile | WCFolder) | undefined {
    const files = this.files.get();
    return files[path];
  }

  async saveFile(path: string, content: string): Promise<void> {
    const wc = await this.#webcontainer;
    // Write to webcontainer
    await wc.fs.writeFile(path, content, 'utf8');
    // Update in-memory map
    const current = this.files.get();
    const entry = current[path] as WCFile | undefined;
    this.files.setKey(path, { type: 'file', content, isBinary: entry?.isBinary ?? false } as WCFile);
  }

  getFileModifications(): Map<string, string> {
    return this.#modifiedFiles;
  }

  getModifiedFiles(): Map<string, string> {
    return this.#modifiedFiles;
  }

  resetFileModifications(): void {
    this.#modifiedFiles.clear();
  }

  // Locking helpers
  lockFile(path: string): boolean {
    const entry = this.getFile(path);
    if (!entry || entry.type !== 'file') return false;
    this.files.setKey(path, { ...entry, isLocked: true } as WCFile);
    return true;
  }

  lockFolder(path: string): boolean {
    const entry = this.getFile(path);
    const folder: WCFolder = { type: 'folder', isLocked: true };
    this.files.setKey(path, { ...(entry?.type === 'folder' ? entry : {}), ...folder } as WCFolder);
    return true;
  }

  unlockFile(path: string): boolean {
    const entry = this.getFile(path);
    if (!entry || entry.type !== 'file') return false;
    const { isLocked, lockedByFolder, ...rest } = entry as WCFile & { lockedByFolder?: string };
    this.files.setKey(path, { ...rest, type: 'file' } as WCFile);
    return true;
  }

  unlockFolder(path: string): boolean {
    const entry = this.getFile(path);
    if (!entry || entry.type !== 'folder') return false;
    const { isLocked, lockedByFolder, ...rest } = entry as WCFolder & { lockedByFolder?: string };
    this.files.setKey(path, { ...rest, type: 'folder' } as WCFolder);
    return true;
  }

  isFileLocked(path: string): boolean {
    const entry = this.getFile(path);
    return !!(entry && entry.type === 'file' && (entry as WCFile).isLocked);
    
  }

  isFolderLocked(path: string): boolean {
    const entry = this.getFile(path);
    return !!(entry && entry.type === 'folder' && (entry as WCFolder).isLocked);
  }

  async createFile(path: string, content: string | Uint8Array = ''): Promise<boolean> {
    const wc = await this.#webcontainer;
    await wc.fs.writeFile(path, content as any, typeof content === 'string' ? 'utf8' : undefined);
    this.files.setKey(path, { type: 'file', content: typeof content === 'string' ? content : '', isBinary: !(typeof content === 'string') } as WCFile);
    return true;
  }

  async createFolder(path: string): Promise<boolean> {
    const wc = await this.#webcontainer;
    await wc.fs.mkdir(path, { recursive: true });
    this.files.setKey(path, { type: 'folder' } as WCFolder);
    return true;
  }

  async deleteFile(path: string): Promise<boolean> {
    const wc = await this.#webcontainer;
    await wc.fs.rm(path, { recursive: false });
    const current = { ...this.files.get() };
    delete (current as any)[path];
    this.files.set(current as FileMap);
    return true;
  }

  async deleteFolder(path: string): Promise<boolean> {
    const wc = await this.#webcontainer;
    await wc.fs.rm(path, { recursive: true });
    const current = { ...this.files.get() };
    Object.keys(current).forEach((p) => {
      if (p === path || p.startsWith(`${path}/`)) {
        delete (current as any)[p];
      }
    });
    this.files.set(current as FileMap);
    return true;
  }
}
