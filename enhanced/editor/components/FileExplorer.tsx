import React, { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { filesStore } from '~/lib/stores/files';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Collapsible } from '~/components/ui/Collapsible';
import type { FileMap } from '~/lib/stores/files';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: string;
  unsaved?: boolean;
}

interface FileExplorerProps {
  onFileSelect?: (filePath: string) => void;
  onFileCreate?: (filePath: string, type: 'file' | 'directory') => void;
  onFileDelete?: (filePath: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  selectedFile?: string;
  className?: string;
}

// File type icons mapping
const getFileIcon = (fileName: string, isDirectory: boolean = false): string => {
  if (isDirectory) {
    return 'i-ph:folder';
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    // Programming languages
    'ts': 'i-vscode-icons:file-type-typescript',
    'tsx': 'i-vscode-icons:file-type-reactts',
    'js': 'i-vscode-icons:file-type-js',
    'jsx': 'i-vscode-icons:file-type-reactjs',
    'py': 'i-vscode-icons:file-type-python',
    'rs': 'i-vscode-icons:file-type-rust',
    'go': 'i-vscode-icons:file-type-go',
    'java': 'i-vscode-icons:file-type-java',
    'php': 'i-vscode-icons:file-type-php',
    'rb': 'i-vscode-icons:file-type-ruby',
    'swift': 'i-vscode-icons:file-type-swift',
    'kt': 'i-vscode-icons:file-type-kotlin',
    'scala': 'i-vscode-icons:file-type-scala',
    'cs': 'i-vscode-icons:file-type-csharp',
    'cpp': 'i-vscode-icons:file-type-cpp',
    'c': 'i-vscode-icons:file-type-c',
    'h': 'i-vscode-icons:file-type-c',
    
    // Web technologies
    'html': 'i-vscode-icons:file-type-html',
    'htm': 'i-vscode-icons:file-type-html',
    'css': 'i-vscode-icons:file-type-css',
    'scss': 'i-vscode-icons:file-type-scss',
    'sass': 'i-vscode-icons:file-type-sass',
    'less': 'i-vscode-icons:file-type-less',
    'vue': 'i-vscode-icons:file-type-vue',
    'svelte': 'i-vscode-icons:file-type-svelte',
    
    // Data formats
    'json': 'i-vscode-icons:file-type-json',
    'xml': 'i-vscode-icons:file-type-xml',
    'yaml': 'i-vscode-icons:file-type-yaml',
    'yml': 'i-vscode-icons:file-type-yaml',
    'toml': 'i-vscode-icons:file-type-toml',
    'ini': 'i-vscode-icons:file-type-settings',
    'csv': 'i-vscode-icons:file-type-excel',
    
    // Documentation
    'md': 'i-vscode-icons:file-type-markdown',
    'markdown': 'i-vscode-icons:file-type-markdown',
    'txt': 'i-vscode-icons:file-type-text',
    'rtf': 'i-vscode-icons:file-type-text',
    'pdf': 'i-vscode-icons:file-type-pdf',
    'doc': 'i-vscode-icons:file-type-word',
    'docx': 'i-vscode-icons:file-type-word',
    
    // Images
    'png': 'i-vscode-icons:file-type-image',
    'jpg': 'i-vscode-icons:file-type-image',
    'jpeg': 'i-vscode-icons:file-type-image',
    'gif': 'i-vscode-icons:file-type-image',
    'svg': 'i-vscode-icons:file-type-svg',
    'ico': 'i-vscode-icons:file-type-image',
    'webp': 'i-vscode-icons:file-type-image',
    
    // Configuration files
    'gitignore': 'i-vscode-icons:file-type-git',
    'env': 'i-vscode-icons:file-type-dotenv',
    'dockerfile': 'i-vscode-icons:file-type-docker',
    'dockerignore': 'i-vscode-icons:file-type-docker',
    
    // Package managers
    'package.json': 'i-vscode-icons:file-type-npm',
    'yarn.lock': 'i-vscode-icons:file-type-yarn',
    'pnpm-lock.yaml': 'i-vscode-icons:file-type-pnpm',
    'composer.json': 'i-vscode-icons:file-type-composer',
    'Cargo.toml': 'i-vscode-icons:file-type-cargo',
    'requirements.txt': 'i-vscode-icons:file-type-python',
    'Pipfile': 'i-vscode-icons:file-type-python',
    
    // Build tools
    'webpack.config.js': 'i-vscode-icons:file-type-webpack',
    'vite.config.ts': 'i-vscode-icons:file-type-vite',
    'rollup.config.js': 'i-vscode-icons:file-type-rollup',
    'gulpfile.js': 'i-vscode-icons:file-type-gulp',
    'makefile': 'i-vscode-icons:file-type-makefile',
    
    // Frameworks
    'next.config.js': 'i-vscode-icons:file-type-next',
    'nuxt.config.js': 'i-vscode-icons:file-type-nuxt',
    'astro.config.mjs': 'i-vscode-icons:file-type-astro',
    'remix.config.js': 'i-vscode-icons:file-type-remix',
  };

  // Special file names
  const specialFiles: Record<string, string> = {
    'package.json': 'i-vscode-icons:file-type-npm',
    'tsconfig.json': 'i-vscode-icons:file-type-tsconfig',
    'jsconfig.json': 'i-vscode-icons:file-type-jsconfig',
    'README.md': 'i-vscode-icons:file-type-readme',
    'LICENSE': 'i-vscode-icons:file-type-license',
    'Dockerfile': 'i-vscode-icons:file-type-docker',
    '.gitignore': 'i-vscode-icons:file-type-git',
    '.env': 'i-vscode-icons:file-type-dotenv',
    'Cargo.toml': 'i-vscode-icons:file-type-cargo',
    'go.mod': 'i-vscode-icons:file-type-go-mod',
    'requirements.txt': 'i-vscode-icons:file-type-python',
  };

  return specialFiles[fileName] || iconMap[ext || ''] || 'i-ph:file';
};

// Build file tree from flat file map
const buildFileTree = (files: FileMap): FileNode[] => {
  const tree: FileNode[] = [];
  const pathMap = new Map<string, FileNode>();

  // Sort paths to ensure parent directories are processed first
  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const file = files[filePath];
    const segments = filePath.split('/');
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      
      if (!pathMap.has(currentPath)) {
        const isFile = i === segments.length - 1;
        const node: FileNode = {
          name: segment,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
          unsaved: isFile ? file?.unsaved : undefined,
          size: isFile ? file?.size : undefined,
          modified: isFile ? file?.lastModified : undefined,
        };

        pathMap.set(currentPath, node);

        if (parentPath) {
          const parent = pathMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          tree.push(node);
        }
      }
    }
  }

  return tree;
};

// File tree node component
const FileTreeNode: React.FC<{
  node: FileNode;
  level: number;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  onFileCreate?: (filePath: string, type: 'file' | 'directory') => void;
  onFileDelete?: (filePath: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
}> = ({ node, level, selectedFile, onFileSelect, onFileCreate, onFileDelete, onFileRename }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const isSelected = selectedFile === node.path;
  const hasUnsavedChanges = node.unsaved;

  const handleClick = () => {
    if (node.type === 'file') {
      onFileSelect?.(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleRename = () => {
    if (newName !== node.name && newName.trim()) {
      const newPath = node.path.replace(new RegExp(`${node.name}$`), newName);
      onFileRename?.(node.path, newPath);
    }
    setIsRenaming(false);
    setNewName(node.name);
  };

  const handleCreateFile = (type: 'file' | 'directory') => {
    const basePath = node.type === 'directory' ? node.path : node.path.replace(/\/[^/]*$/, '');
    const newPath = `${basePath}/new-${type}${type === 'file' ? '.txt' : ''}`;
    onFileCreate?.(newPath, type);
    setShowCreateMenu(false);
  };

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 hover:bg-bolt-elements-bg-secondary cursor-pointer group relative ${
          isSelected ? 'bg-bolt-elements-bg-secondary border-l-2 border-bolt-elements-focus' : ''
        }`}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={handleClick}
        onDoubleClick={() => node.type === 'file' && setIsRenaming(true)}
      >
        {/* Expand/Collapse icon for directories */}
        {node.type === 'directory' && (
          <div
            className={`w-4 h-4 flex items-center justify-center transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            <div className="i-ph:caret-right text-xs" />
          </div>
        )}

        {/* File/Directory icon */}
        <div
          className={`w-4 h-4 ${getFileIcon(node.name, node.type === 'directory')} text-sm ${
            node.type === 'directory' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        />

        {/* File/Directory name */}
        {isRenaming ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setNewName(node.name);
              }
            }}
            className="ml-2 h-6 text-sm"
            autoFocus
          />
        ) : (
          <span
            className={`ml-2 text-sm truncate flex-1 ${
              hasUnsavedChanges ? 'text-orange-500 font-medium' : ''
            }`}
          >
            {node.name}
            {hasUnsavedChanges && ' •'}
          </span>
        )}

        {/* Action buttons (show on hover) */}
        <div className="hidden group-hover:flex items-center space-x-1 ml-auto">
          {node.type === 'directory' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateMenu(!showCreateMenu);
              }}
              title="Create file or folder"
            >
              <div className="i-ph:plus text-xs" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            title="Rename"
          >
            <div className="i-ph:pencil text-xs" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${node.name}?`)) {
                onFileDelete?.(node.path);
              }
            }}
            title="Delete"
          >
            <div className="i-ph:trash text-xs" />
          </Button>
        </div>

        {/* Create menu */}
        {showCreateMenu && (
          <div className="absolute top-full left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10 py-1">
            <button
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleCreateFile('file')}
            >
              <div className="i-ph:file-plus mr-2" />
              New File
            </button>
            <button
              className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleCreateFile('directory')}
            >
              <div className="i-ph:folder-plus mr-2" />
              New Folder
            </button>
          </div>
        )}
      </div>

      {/* Children (for directories) */}
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main File Explorer component
export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  selectedFile,
  className,
}) => {
  const files = useStore(filesStore);
  const [searchQuery, setSearchQuery] = useState('');

  // Build file tree
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Filter files based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return fileTree;
    
    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((filtered: FileNode[], node) => {
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          filtered.push(node);
        } else if (node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            filtered.push({ ...node, children: filteredChildren });
          }
        }
        return filtered;
      }, []);
    };

    return filterNodes(fileTree);
  }, [fileTree, searchQuery]);

  const handleCreateInRoot = (type: 'file' | 'directory') => {
    const newPath = `new-${type}${type === 'file' ? '.txt' : ''}`;
    onFileCreate?.(newPath, type);
  };

  return (
    <div className={`flex flex-col h-full bg-bolt-elements-bg-primary border-r border-bolt-elements-borderColor ${className || ''}`}>
      {/* Header */}
      <div className="p-3 border-b border-bolt-elements-borderColor">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Explorer</h3>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => handleCreateInRoot('file')}
              title="New File"
            >
              <div className="i-ph:file-plus text-xs" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => handleCreateInRoot('directory')}
              title="New Folder"
            >
              <div className="i-ph:folder-plus text-xs" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
          prefix={<div className="i-ph:magnifying-glass text-xs" />}
        />
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredTree.length === 0 ? (
            <div className="p-4 text-center text-sm text-bolt-elements-textSecondary">
              {searchQuery ? 'No files match your search' : 'No files in workspace'}
            </div>
          ) : (
            filteredTree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                level={0}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                onFileCreate={onFileCreate}
                onFileDelete={onFileDelete}
                onFileRename={onFileRename}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with file count */}
      <div className="p-2 border-t border-bolt-elements-borderColor">
        <div className="text-xs text-bolt-elements-textSecondary">
          {Object.keys(files).length} files in workspace
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;