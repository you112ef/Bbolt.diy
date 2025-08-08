import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { aiModelsStore, aiModelsActions } from '~/lib/stores/aiModels';
import { localAIManager } from '~/enhanced/models/providers/OfflineAI';
import { isMobile, isTouchDevice } from '~/utils/mobile';
import type { AIModel, ModelUploadProgress, ModelValidation } from '~/types/aiModels';

// Capacitor imports for mobile filesystem
let Filesystem: any = null;
let Haptics: any = null;

// Initialize mobile APIs
const initializeMobileAPIs = async () => {
  if (isMobile()) {
    try {
      const { Filesystem: CapFilesystem } = await import('@capacitor/filesystem');
      const { Haptics: CapHaptics } = await import('@capacitor/haptics');
      Filesystem = CapFilesystem;
      Haptics = CapHaptics;
    } catch (error) {
      console.warn('Failed to load Capacitor APIs:', error);
    }
  }
};

// Model format detection and validation
const validateModelFile = async (file: File): Promise<ModelValidation> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check file size (max 10GB)
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB) exceeds maximum allowed size of 10GB`);
  }
  
  // Determine format from file extension
  const fileName = file.name.toLowerCase();
  let format: any = null;
  let estimatedParameters = '';
  let architecture = '';
  
  if (fileName.endsWith('.gguf')) {
    format = 'gguf';
    // Extract model info from filename if possible
    if (fileName.includes('7b')) estimatedParameters = '7B';
    else if (fileName.includes('13b')) estimatedParameters = '13B';
    else if (fileName.includes('70b')) estimatedParameters = '70B';
    else if (fileName.includes('3b')) estimatedParameters = '3B';
    architecture = 'Llama/Mistral';
  } else if (fileName.endsWith('.bin')) {
    format = 'bin';
    architecture = 'PyTorch/Transformers';
  } else if (fileName.endsWith('.safetensors')) {
    format = 'safetensors';
    architecture = 'SafeTensors';
  } else if (fileName.endsWith('.onnx')) {
    format = 'onnx';
    architecture = 'ONNX Runtime';
  } else {
    errors.push('Unsupported file format. Please use .gguf, .bin, .safetensors, or .onnx files.');
  }
  
  // Size-based warnings
  if (file.size > 4 * 1024 * 1024 * 1024) { // 4GB+
    warnings.push('Large model file may require significant RAM and processing time.');
  }
  
  return {
    isValid: errors.length === 0,
    format,
    size: file.size,
    estimatedParameters,
    architecture,
    errors,
    warnings
  };
};

const AIModelsTab = () => {
  const models = useStore(aiModelsStore);
  const [uploadProgress, setUploadProgress] = useState<ModelUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    initializeMobileAPIs().then(() => setIsInitialized(true));
  }, []);
  
  const localModels = models.filter(model => model.isLocal);
  
  // Haptic feedback for mobile
  const triggerHaptic = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (isTouchDevice() && Haptics) {
      try {
        await Haptics.impact({ style: type === 'error' ? 'Heavy' : type === 'warning' ? 'Medium' : 'Light' });
      } catch (error) {
        // Fallback to vibration API
        if (navigator.vibrate) {
          const pattern = type === 'error' ? [100, 50, 100] : type === 'warning' ? [80] : [50];
          navigator.vibrate(pattern);
        }
      }
    }
  }, []);
  
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      const validation = await validateModelFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        await triggerHaptic('error');
        alert(`Invalid file "${file.name}": ${validation.errors.join(', ')}`);
      }
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      await triggerHaptic('success');
      await uploadModels(validFiles);
    }
  }, [triggerHaptic]);
  
  const uploadModels = async (files: File[]) => {
    for (const file of files) {
      const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const validation = await validateModelFile(file);
      
      // Create upload progress entry
      const progress: ModelUploadProgress = {
        modelId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        startTime: Date.now()
      };
      
      setUploadProgress(prev => [...prev, progress]);
      
      try {
        // Save model file to local storage
        let filePath: string;
        
        if (Filesystem && isMobile()) {
          // Use Capacitor Filesystem for mobile
          const fileName = `ai_model_${modelId}_${file.name}`;
          const directory = await Filesystem.getUri({
            directory: 'Documents',
            path: 'BoltDIY/AI_Models/'
          });
          
          // Create directory if it doesn't exist
          try {
            await Filesystem.mkdir({
              path: 'BoltDIY/AI_Models',
              directory: 'Documents',
              recursive: true
            });
          } catch (error) {
            // Directory might already exist
          }
          
          // Convert file to base64 for mobile storage
          const base64Data = await fileToBase64(file);
          
          await Filesystem.writeFile({
            path: `BoltDIY/AI_Models/${fileName}`,
            data: base64Data,
            directory: 'Documents'
          });
          
          filePath = `${directory.uri}${fileName}`;
        } else {
          // Use IndexedDB for web storage
          filePath = await saveFileToIndexedDB(file, modelId);
        }
        
        // Update progress
        setUploadProgress(prev =>
          prev.map(p => p.modelId === modelId ? { ...p, progress: 50, status: 'processing' } : p)
        );
        
        // Create AI model entry
        const model: AIModel = {
          id: modelId,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          fileName: file.name,
          size: file.size,
          type: validation.format?.toUpperCase() as any || 'Unknown',
          uploadDate: new Date().toISOString(),
          status: 'ready',
          isLocal: true,
          capabilities: ['text-generation'],
          parameters: validation.estimatedParameters || 'Unknown',
          description: `Local ${validation.architecture} model`,
          modelPath: filePath,
          quantization: validation.format === 'gguf' ? 'GGUF' : undefined,
          architecture: validation.architecture,
          contextLength: 4096, // Default context length
          metadata: {
            originalSize: file.size,
            uploadMethod: isMobile() ? 'capacitor' : 'indexeddb',
            validation
          }
        };
        
        // Add to store
        aiModelsActions.addModel(model);
        
        // Complete progress
        setUploadProgress(prev =>
          prev.map(p => p.modelId === modelId ? { ...p, progress: 100, status: 'completed' } : p)
        );
        
        await triggerHaptic('success');
        
      } catch (error) {
        console.error('Failed to upload model:', error);
        setUploadProgress(prev =>
          prev.map(p => p.modelId === modelId ? { 
            ...p, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : p)
        );
        await triggerHaptic('error');
      }
    }
    
    // Clear progress after 5 seconds
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'completed' && p.status !== 'error'));
    }, 5000);
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };
  
  const saveFileToIndexedDB = async (file: File, modelId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BoltDIY_AIModels', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        
        const modelData = {
          id: modelId,
          fileName: file.name,
          data: file,
          createdAt: new Date().toISOString()
        };
        
        const addRequest = store.add(modelData);
        addRequest.onsuccess = () => resolve(`indexeddb://${modelId}`);
        addRequest.onerror = () => reject(addRequest.error);
      };
    });
  };
  
  const removeModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    try {
      // Remove from filesystem
      if (Filesystem && isMobile() && model.modelPath?.includes('Documents')) {
        const fileName = model.modelPath.split('/').pop();
        if (fileName) {
          await Filesystem.deleteFile({
            path: `BoltDIY/AI_Models/${fileName}`,
            directory: 'Documents'
          });
        }
      } else if (model.modelPath?.startsWith('indexeddb://')) {
        // Remove from IndexedDB
        const request = indexedDB.open('BoltDIY_AIModels', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['models'], 'readwrite');
          const store = transaction.objectStore('models');
          store.delete(modelId);
        };
      }
      
      // Unload from memory if loaded
      if (localAIManager.isModelLoaded(modelId)) {
        localAIManager.unloadModel(modelId);
      }
      
      // Remove from store
      aiModelsActions.removeModel(modelId);
      
      await triggerHaptic('success');
    } catch (error) {
      console.error('Failed to remove model:', error);
      await triggerHaptic('error');
    }
  };
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  }, [handleFileSelect]);
  
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-bolt-elements-textPrimary mb-1 sm:mb-2">
          AI Models Management
        </h2>
        <p className="text-xs sm:text-sm text-bolt-elements-textSecondary">
          Upload and manage local AI models for offline inference. Models are stored securely on your device and work without internet connection.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium">Upload AI Model</h3>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-bolt-elements-focus bg-bolt-elements-focus/5 scale-105' 
                : 'border-bolt-elements-borderColor hover:border-bolt-elements-focus'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-1 sm:space-y-2">
              <div className={`text-2xl sm:text-3xl lg:text-4xl transition-transform ${
                isDragging ? 'animate-bounce' : ''
              }`}>🧠</div>
              <div className="text-xs sm:text-sm text-bolt-elements-textSecondary">
                {isDragging ? 'Drop AI model files here' : 'Drag and drop AI model files here or click to browse'}
              </div>
              <div className="text-[10px] sm:text-xs text-bolt-elements-textTertiary">
                Supports: .gguf, .bin, .safetensors, .onnx (max 10GB each)
              </div>
              {isMobile() && (
                <div className="text-[10px] sm:text-xs text-bolt-elements-accent">
                  📱 Mobile-optimized storage
                </div>
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".gguf,.bin,.safetensors,.onnx"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            size={isTouchDevice() ? 'touch' : 'default'}
          >
            Select Model Files
          </Button>
          
          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-medium">Upload Progress</h4>
              {uploadProgress.map((progress) => (
                <div key={progress.modelId} className="bg-bolt-elements-surface rounded-lg p-2 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{progress.fileName}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${
                      progress.status === 'completed' ? 'border-green-500 text-green-600 bg-transparent' :
                      progress.status === 'error' ? 'border-red-500 text-red-600 bg-transparent' :
                      'border-blue-500 text-blue-600 bg-transparent'
                    }`}>
                      {progress.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  {progress.error && (
                    <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Models List */}
      <Card className="p-3 sm:p-4 lg:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-2 sm:mb-4">
          Uploaded Models ({localModels.length})
        </h3>
        
        {localModels.length === 0 ? (
          <div className="text-center py-4 sm:py-6 lg:py-8 text-bolt-elements-textSecondary">
            <div className="text-2xl sm:text-3xl lg:text-4xl mb-2">📚</div>
            <p className="text-xs sm:text-sm">No AI models uploaded yet</p>
            <p className="text-[10px] sm:text-xs mt-1">Upload your first model to get started with offline AI inference</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {localModels.map((model) => (
              <div key={model.id} className="border border-bolt-elements-borderColor rounded-lg p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm sm:text-base truncate">{model.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        model.status === 'ready' ? 'border-green-500 text-green-600 bg-transparent' :
                        model.status === 'loading' ? 'border-blue-500 text-blue-600 bg-transparent' :
                        model.status === 'error' ? 'border-red-500 text-red-600 bg-transparent' :
                        'border-gray-500 text-gray-600 bg-transparent'
                      }`}>
                        {model.status}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-bolt-elements-textSecondary space-y-0.5">
                      <p>{model.type} • {model.parameters} • {(model.size / (1024 * 1024)).toFixed(0)}MB</p>
                      <p>{model.architecture} • Uploaded {new Date(model.uploadDate).toLocaleDateString()}</p>
                      {model.capabilities && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.capabilities.map((cap) => (
                            <span key={cap} className="px-1.5 py-0.5 bg-bolt-elements-surface rounded text-xs">
                              {cap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 sm:gap-2">
                    {localAIManager.isModelLoaded(model.id) ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          localAIManager.unloadModel(model.id);
                          triggerHaptic('success');
                        }}
                      >
                        Unload
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await localAIManager.loadModel(model);
                          await triggerHaptic('success');
                        }}
                        disabled={model.status === 'loading'}
                      >
                        Load
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${model.name}"? This action cannot be undone.`)) {
                          removeModel(model.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Model Usage Info */}
      <Card className="p-3 sm:p-4 lg:p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2 text-blue-900 dark:text-blue-100">
          💡 How to Use Local AI Models
        </h3>
        <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs lg:text-sm text-blue-800 dark:text-blue-200">
          <p>• Upload GGUF, PyTorch, SafeTensors, or ONNX model files</p>
          <p>• Models are stored {isMobile() ? 'in your device storage' : 'locally in your browser'} for privacy</p>
          <p>• Load models to start using them for offline AI inference</p>
          <p>• Larger models (7B+) require more RAM and processing time</p>
          <p>• GGUF format is recommended for best performance</p>
          {isMobile() && (
            <p>• On mobile: Models are stored in Documents/BoltDIY/AI_Models/</p>
          )}
        </div>
        
        {localModels.length > 0 && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              📊 Storage Usage
            </h4>
            <div className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200">
              <p>Total Models: {localModels.length}</p>
              <p>Total Storage: {(localModels.reduce((sum, model) => sum + model.size, 0) / (1024 * 1024 * 1024)).toFixed(2)}GB</p>
              <p>Loaded Models: {localModels.filter(m => localAIManager.isModelLoaded(m.id)).length}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIModelsTab;