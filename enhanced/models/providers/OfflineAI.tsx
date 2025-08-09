import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { aiModelsStore, aiModelsActions } from '~/lib/stores/aiModels';
import type { AIModel, ModelInferenceConfig } from '~/types/aiModels';

// Transformers.js integration for offline AI
let transformersLib: any = null;

// Initialize transformers.js
const initializeTransformers = async () => {
  if (transformersLib) return transformersLib;
  
  try {
    const t = await import('@xenova/transformers');
    transformersLib = t;
    transformersLib.env.allowLocalModels = true;
    transformersLib.env.allowRemoteModels = true;
    return transformersLib;
  } catch (error) {
    console.error('Failed to initialize transformers.js:', error);
    throw error;
  }
};

// Local AI Model Manager
export class LocalAIManager {
  private models: Map<string, any> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    await initializeTransformers();
    this.isInitialized = true;
  }

  async loadModel(modelConfig: AIModel): Promise<boolean> {
    try {
      await this.initialize();
      
      if (this.models.has(modelConfig.id)) {
        return true; // Already loaded
      }

      // Update model status
      aiModelsActions.updateModelStatus(modelConfig.id, 'loading');

      let pipeline;
      
      // Handle different model types
      switch (modelConfig.type) {
        case 'GGUF':
          // For GGUF models, we would use a WebAssembly runtime
          // This is a simplified implementation
          pipeline = await this.loadGGUFModel(modelConfig);
          break;
          
        default:
          // Use transformers.js for other formats
          if (transformersLib.pipeline) {
            const { pipeline: createPipeline } = transformersLib;
            pipeline = await createPipeline('text-generation', modelConfig.modelPath || modelConfig.name, {
              local_files_only: true,
              dtype: 'fp16',
            });
          } else {
            // Try loading a default small local model via transformers.js
            const { pipeline: createPipeline } = transformersLib;
            const modelId = modelConfig.modelPath || modelConfig.name || 'Xenova/distilbert-base-uncased';
            pipeline = await createPipeline('text-generation', modelId, {
              local_files_only: false,
            });
          }
          break;
      }

      this.models.set(modelConfig.id, pipeline);
      aiModelsActions.updateModelStatus(modelConfig.id, 'ready');
      
      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      aiModelsActions.updateModelStatus(modelConfig.id, 'error');
      return false;
    }
  }

  private async loadGGUFModel(modelConfig: AIModel): Promise<any> {
    // Route GGUF to local Ollama if available
    const resp = await fetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelConfig.name, prompt: '' }),
    }).catch(() => undefined);

    if (!resp || !resp.ok) {
      // Minimal fallback that throws to surface lack of support
      return {
        generate: async () => {
          throw new Error('GGUF generation requires Ollama. Please configure Ollama provider.');
        },
      };
    }

    return {
      generate: async (prompt: string, options: any) => {
        const r = await fetch('/api/ollama/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelConfig.name,
            prompt,
            options: {
              temperature: options?.temperature ?? 0.7,
              top_p: options?.top_p ?? 0.9,
              num_predict: options?.max_new_tokens ?? 150,
            },
          }),
        });
        if (!r.ok) throw new Error(`Ollama error: ${r.status}`);
        const data: any = await r.json();
        return (data && typeof data === 'object' && 'response' in data) ? (data as any).response : '';
      },
    };
  }

  private async loadMockModel(modelConfig: AIModel): Promise<any> {
    // Attempt a generic small-cpu-friendly pipeline as a fallback
    if (transformersLib?.pipeline) {
      const { pipeline: createPipeline } = transformersLib;
      const modelId = modelConfig.modelPath || modelConfig.name || 'Xenova/bert-base-uncased';
      const pipe = await createPipeline('fill-mask', modelId, { local_files_only: false });
      return {
        generate: async (prompt: string) => {
          const out = await pipe(prompt);
          const text = Array.isArray(out) ? out[0]?.sequence ?? '' : String(out);
          return text;
        },
      };
    }

    // No fallback available
    return {
      generate: async () => {
        throw new Error('No local transformers runtime available.');
      },
    };
  }

  async generateText(
    modelId: string, 
    prompt: string, 
    options: Partial<ModelInferenceConfig> = {}
  ): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    try {
      const result = await model.generate(prompt, {
        max_new_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        do_sample: true,
      });

      // Update metrics
      aiModelsActions.updateMetrics(modelId, {
        totalInferences: 1,
        totalTokensGenerated: result.length,
        lastUsed: new Date().toISOString(),
      });

      return typeof result === 'string' ? result : result.generated_text || result[0]?.generated_text || '';
    } catch (error) {
      console.error('Inference error:', error);
      aiModelsActions.updateMetrics(modelId, { errorCount: 1 });
      throw error;
    }
  }

  unloadModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (model) {
      // Cleanup model resources
      if (typeof model.dispose === 'function') {
        model.dispose();
      }
      this.models.delete(modelId);
      aiModelsActions.updateModelStatus(modelId, 'ready');
      return true;
    }
    return false;
  }

  getLoadedModels(): string[] {
    return Array.from(this.models.keys());
  }

  isModelLoaded(modelId: string): boolean {
    return this.models.has(modelId);
  }
}

// Global instance
export const localAIManager = new LocalAIManager();

interface OfflineAIProps {
  onModelLoad?: (modelId: string) => void;
  onModelUnload?: (modelId: string) => void;
  onInferenceComplete?: (modelId: string, result: string) => void;
}

export const OfflineAI: React.FC<OfflineAIProps> = ({
  onModelLoad,
  onModelUnload,
  onInferenceComplete,
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const models = useStore(aiModelsStore);
  const localModels = models.filter(model => model.isLocal);

  useEffect(() => {
    initializeOfflineAI();
  }, []);

  const initializeOfflineAI = async () => {
    if (isReady) return;
    
    setIsInitializing(true);
    try {
      await localAIManager.initialize();
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize offline AI:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadModel = useCallback(async (model: AIModel) => {
    const success = await localAIManager.loadModel(model);
    if (success) {
      onModelLoad?.(model.id);
    }
  }, [onModelLoad]);

  const unloadModel = useCallback((modelId: string) => {
    const success = localAIManager.unloadModel(modelId);
    if (success) {
      onModelUnload?.(modelId);
    }
  }, [onModelUnload]);

  const performInference = useCallback(async (
    modelId: string,
    prompt: string,
    options?: Partial<ModelInferenceConfig>
  ) => {
    try {
      const result = await localAIManager.generateText(modelId, prompt, options);
      onInferenceComplete?.(modelId, result);
      return result;
    } catch (error) {
      console.error('Inference failed:', error);
      throw error;
    }
  }, [onInferenceComplete]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium">Initializing Offline AI</h3>
            <p className="text-sm text-gray-600">Setting up local models...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="offline-ai-manager">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Offline AI Models</h3>
        <p className="text-sm text-gray-600">
          Local AI models that work without internet connection
        </p>
      </div>

      {localModels.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🧠</div>
          <p>No local AI models available</p>
          <p className="text-sm mt-1">Upload models in the AI Models tab</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localModels.map(model => (
            <div 
              key={model.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{model.name}</h4>
                  <p className="text-sm text-gray-600">{model.type} • {model.parameters}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    model.status === 'ready' ? 'bg-green-100 text-green-800' :
                    model.status === 'loading' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {model.status}
                  </span>
                  
                  {localAIManager.isModelLoaded(model.id) ? (
                    <button
                      onClick={() => unloadModel(model.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Unload
                    </button>
                  ) : (
                    <button
                      onClick={() => loadModel(model)}
                      disabled={model.status === 'loading'}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      Load
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfflineAI;