import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { webcontainerManager } from '~/lib/webcontainer';

// Export types from server constants
export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string;
}

export interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string;
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

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
              // WebContainer doesn't have a stat method, so we'll use basic file info
              const isDirectory = fileName.includes('.') === false; // Simple heuristic
              
              files.push({
                name: fileName,
                path: filePath,
                type: isDirectory ? 'directory' : 'file',
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
