import React, { useState, useCallback, useRef } from 'react';
import { aiModelsStore, aiModelsActions } from '~/lib/stores/aiModels';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';
import { Alert } from '~/components/ui/Alert';
import type { AIModel } from '~/types/aiModels';

interface AIModelsTabProps {
  className?: string;
}

export const AIModelsTab: React.FC<AIModelsTabProps> = ({ className }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { localModels, cloudModels, selectedModel, isLoading, error, uploadProgress: storeProgress } = aiModelsStore();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        // Validate file type
        const validExtensions = ['.gguf', '.bin', '.safetensors', '.onnx'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExtension)) {
          throw new Error(`نوع الملف غير مدعوم. الأنواع المدعومة: ${validExtensions.join(', ')}`);
        }

        // Validate file size (max 4GB)
        const maxSize = 4 * 1024 * 1024 * 1024; // 4GB
        if (file.size > maxSize) {
          throw new Error('حجم الملف كبير جداً. الحد الأقصى: 4GB');
        }

        const modelId = `local_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Start upload progress
        setUploadProgress(prev => ({ ...prev, [modelId]: 0 }));
        aiModelsActions.setUploadProgress(modelId, 0);

        // Simulate file upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[modelId] || 0;
            if (currentProgress >= 100) {
              clearInterval(uploadInterval);
              return prev;
            }
            const newProgress = Math.min(currentProgress + 10, 100);
            aiModelsActions.setUploadProgress(modelId, newProgress);
            return { ...prev, [modelId]: newProgress };
          });
        }, 200);

        // Create model info
        const modelInfo: AIModel = {
          id: modelId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          size: file.size,
          type: fileExtension === '.gguf' ? 'GGUF' : 
                fileExtension === '.bin' ? 'PyTorch' :
                fileExtension === '.safetensors' ? 'SafeTensors' : 'ONNX',
          uploadDate: new Date().toISOString(),
          status: 'ready',
          isLocal: true,
          capabilities: ['text-generation', 'chat'],
          parameters: 'maxTokens=2000, temperature=0.7, topP=0.9',
          description: `نموذج محلي: ${file.name}`,
          modelPath: URL.createObjectURL(file)
        };

        // Load the model
        const success = await aiModelsActions.loadLocalModel(modelId, modelInfo.modelPath!);
        
        if (success) {
          // Clear progress
          clearInterval(uploadInterval);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[modelId];
            return newProgress;
          });
          aiModelsActions.clearUploadProgress(modelId);
          
          // Set as selected model
          aiModelsActions.setSelectedModel(modelInfo);
        } else {
          throw new Error('فشل في تحميل النموذج');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        aiModelsActions.setError(errorMessage);
        console.error('Model upload failed:', error);
      }
    }
    
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleModelSelect = useCallback((model: AIModel) => {
    aiModelsActions.setSelectedModel(model);
  }, []);

  const handleModelUnload = useCallback(async (modelId: string) => {
    try {
      await aiModelsActions.unloadLocalModel(modelId);
    } catch (error) {
      console.error('Failed to unload model:', error);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    }
  }, [handleFileUpload]);

  return (
    <div className={`ai-models-tab ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          نماذج الذكاء الاصطناعي
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          إدارة النماذج المحلية والسحابية للذكاء الاصطناعي
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert
          type="error"
          title="خطأ في تحميل النموذج"
          message={error}
          onClose={() => aiModelsActions.clearError()}
          className="mb-4"
        />
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          رفع نموذج محلي
        </h3>
        
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="i-ph:upload-simple text-3xl text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            اسحب وأفلت ملفات النموذج هنا أو
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            اختر ملفات
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            الأنواع المدعومة: .gguf, .bin, .safetensors, .onnx (الحد الأقصى: 4GB)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".gguf,.bin,.safetensors,.onnx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([modelId, progress]) => (
              <div key={modelId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    رفع النموذج...
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Models */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          النماذج المحلية ({localModels.length})
        </h3>
        
        {localModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="i-ph:brain text-4xl mb-3" />
            <p>لا توجد نماذج محلية</p>
            <p className="text-sm">قم برفع نموذج للبدء</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {localModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedModel?.id === model.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        محلي
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        model.status === 'ready' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : model.status === 'loading'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {model.status === 'ready' ? 'جاهز' : 
                         model.status === 'loading' ? 'جاري التحميل' : 'خطأ'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {model.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>النوع: {model.type}</span>
                      <span>الحجم: {(model.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedModel?.id !== model.id && (
                      <button
                        onClick={() => handleModelSelect(model)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        اختيار
                      </button>
                    )}
                    
                    {selectedModel?.id === model.id && (
                      <span className="px-3 py-1 text-xs bg-blue-500 text-white rounded">
                        مختار
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleModelUnload(model.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloud Models */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          النماذج السحابية ({cloudModels.length})
        </h3>
        
        {cloudModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="i-ph:cloud text-4xl mb-3" />
            <p>لا توجد نماذج سحابية</p>
            <p className="text-sm">قم بتكوين مزودي الذكاء الاصطناعي</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {cloudModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedModel?.id === model.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        سحابي
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        model.status === 'ready' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                      }`}>
                        {model.status === 'ready' ? 'متاح' : 'غير متاح'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {model.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedModel?.id !== model.id && model.status === 'ready' && (
                      <button
                        onClick={() => handleModelSelect(model)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        اختيار
                      </button>
                    )}
                    
                    {selectedModel?.id === model.id && (
                      <span className="px-3 py-1 text-xs bg-blue-500 text-white rounded">
                        مختار
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {(isLoading || isUploading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <LoadingSpinner size="lg" color="primary" className="mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300">
              {isUploading ? 'جاري رفع النموذج...' : 'جاري التحميل...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelsTab;
