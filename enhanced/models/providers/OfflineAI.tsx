import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { aiModelsStore, aiModelsActions } from '~/lib/stores/aiModels';
import { pipeline, AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers';
import { LlamaCpp } from '@llama-node/llama-cpp';
import { AIModel, LocalModelManager, ModelInferenceConfig, ModelMetrics } from '~/types/aiModels';

export class RealLocalAIManager implements LocalModelManager {
  private loadedModels: Map<string, any> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();

  async loadModel(modelId: string, modelPath: string): Promise<boolean> {
    try {
      console.log(`Loading model: ${modelId} from ${modelPath}`);
      
      // Check if it's a GGUF model
      if (modelPath.endsWith('.gguf')) {
        const llamaModel = new LlamaCpp();
        await llamaModel.load(modelPath);
        this.loadedModels.set(modelId, llamaModel);
      } else {
        // Use transformers.js for other formats
        const tokenizer = await AutoTokenizer.from_pretrained(modelPath);
        const model = await AutoModelForCausalLM.from_pretrained(modelPath);
        
        this.loadedModels.set(modelId, { tokenizer, model });
      }

      // Initialize metrics
      this.modelMetrics.set(modelId, {
        loadTime: Date.now(),
        inferenceCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0
      });

      console.log(`Model ${modelId} loaded successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      return false;
    }
  }

  async unloadModel(modelId: string): Promise<boolean> {
    try {
      const model = this.loadedModels.get(modelId);
      if (model) {
        if (model instanceof LlamaCpp) {
          await model.dispose();
        } else if (model.model) {
          await model.model.dispose();
        }
        this.loadedModels.delete(modelId);
        this.modelMetrics.delete(modelId);
        console.log(`Model ${modelId} unloaded successfully`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to unload model ${modelId}:`, error);
      return false;
    }
  }

  async inference(
    modelId: string, 
    prompt: string, 
    config: ModelInferenceConfig = {}
  ): Promise<string> {
    const startTime = Date.now();
    const model = this.loadedModels.get(modelId);
    
    if (!model) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    try {
      let response: string;

      if (model instanceof LlamaCpp) {
        // GGUF model inference
        response = await model.complete({
          prompt,
          maxTokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          topP: config.topP || 0.9,
          stopSequences: config.stopSequences || []
        });
      } else {
        // Transformers.js model inference
        const { tokenizer, model: transformerModel } = model;
        
        const inputs = await tokenizer(prompt, {
          return_tensors: 'pt',
          max_length: config.maxTokens || 1000,
          truncation: true
        });

        const outputs = await transformerModel.generate(inputs, {
          max_length: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
          top_p: config.topP || 0.9,
          do_sample: true,
          pad_token_id: tokenizer.eos_token_id
        });

        response = await tokenizer.decode(outputs[0], { skip_special_tokens: true });
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      const metrics = this.modelMetrics.get(modelId);
      if (metrics) {
        metrics.inferenceCount++;
        metrics.averageResponseTime = 
          (metrics.averageResponseTime * (metrics.inferenceCount - 1) + responseTime) / metrics.inferenceCount;
        metrics.memoryUsage = performance.memory?.usedJSHeapSize || 0;
      }

      return response;
    } catch (error) {
      console.error(`Inference failed for model ${modelId}:`, error);
      throw error;
    }
  }

  getModelInfo(modelId: string): AIModel | null {
    const model = this.loadedModels.get(modelId);
    if (!model) return null;

    const metrics = this.modelMetrics.get(modelId);
    
    return {
      id: modelId,
      name: modelId,
      fileName: modelId,
      size: 0, // Would need to calculate actual size
      type: model instanceof LlamaCpp ? 'GGUF' : 'PyTorch',
      status: 'loaded',
      isLocal: true,
      capabilities: ['text-generation', 'chat'],
      parameters: {
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9
      },
      description: `Local ${model instanceof LlamaCpp ? 'GGUF' : 'PyTorch'} model`,
      metrics
    };
  }

  async validateModel(modelPath: string): Promise<boolean> {
    try {
      // Basic validation - check if file exists and has correct extension
      const validExtensions = ['.gguf', '.bin', '.safetensors', '.onnx'];
      const isValidExtension = validExtensions.some(ext => modelPath.endsWith(ext));
      
      if (!isValidExtension) {
        return false;
      }

      // Try to load a small portion to validate
      if (modelPath.endsWith('.gguf')) {
        const testModel = new LlamaCpp();
        await testModel.load(modelPath);
        await testModel.dispose();
      } else {
        const tokenizer = await AutoTokenizer.from_pretrained(modelPath);
        await tokenizer.dispose();
      }

      return true;
    } catch (error) {
      console.error('Model validation failed:', error);
      return false;
    }
  }

  getAvailableModels(): string[] {
    return Array.from(this.loadedModels.keys());
  }

  getMetrics(modelId: string): ModelMetrics | null {
    return this.modelMetrics.get(modelId) || null;
  }
}

// Export singleton instance
export const localAIManager = new RealLocalAIManager();

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
      // This part of the logic needs to be adapted to the new localAIManager
      // For now, it will just set isReady to true if no models are loaded
      // In a real scenario, you'd iterate through localModels and load them
      // with a placeholder path or a default model if no path is provided.
      // The onModelLoad callback would then trigger the actual loadModel call.
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize offline AI:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadModel = useCallback(async (model: AIModel) => {
    // This part of the logic needs to be adapted to the new localAIManager
    // For now, it will just call loadModel with a placeholder path
    // In a real scenario, you'd call localAIManager.loadModel(model.id, model.modelPath)
    // and onModelLoad would be triggered.
    onModelLoad?.(model.id);
  }, [onModelLoad]);

  const unloadModel = useCallback((modelId: string) => {
    // This part of the logic needs to be adapted to the new localAIManager
    // For now, it will just call unloadModel
    // In a real scenario, you'd call localAIManager.unloadModel(modelId)
    // and onModelUnload would be triggered.
    onModelUnload?.(modelId);
  }, [onModelUnload]);

  const performInference = useCallback(async (
    modelId: string,
    prompt: string,
    options?: Partial<ModelInferenceConfig>
  ) => {
    try {
      // This part of the logic needs to be adapted to the new localAIManager
      // For now, it will just call inference with a placeholder config
      // In a real scenario, you'd call localAIManager.inference(modelId, prompt, options)
      // and onInferenceComplete would be triggered.
      const result = await localAIManager.inference(modelId, prompt, options as ModelInferenceConfig);
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
                  
                  {localAIManager.getAvailableModels().includes(model.id) ? (
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