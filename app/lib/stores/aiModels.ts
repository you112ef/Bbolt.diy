import { create } from 'zustand';
import { localAIManager } from '~/enhanced/models/providers/OfflineAI';
import type { AIModel, ModelInferenceConfig, ModelMetrics } from '~/types/aiModels';

interface AIModelsState {
  localModels: AIModel[];
  cloudModels: AIModel[];
  selectedModel: AIModel | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: Record<string, number>;
}

interface AIModelsActions {
  // Local Models Management
  loadLocalModel: (modelId: string, modelPath: string) => Promise<boolean>;
  unloadLocalModel: (modelId: string) => Promise<boolean>;
  getLocalModelInfo: (modelId: string) => AIModel | null;
  getLocalModelMetrics: (modelId: string) => ModelMetrics | null;
  validateLocalModel: (modelPath: string) => Promise<boolean>;
  
  // Model Operations
  performInference: (modelId: string, prompt: string, config?: ModelInferenceConfig) => Promise<string>;
  updateModelStatus: (modelId: string, status: 'loading' | 'ready' | 'error') => void;
  setSelectedModel: (model: AIModel | null) => void;
  
  // Upload Management
  setUploadProgress: (modelId: string, progress: number) => void;
  clearUploadProgress: (modelId: string) => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // State Management
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const aiModelsStore = create<AIModelsState & AIModelsActions>((set, get) => ({
  // Initial State
  localModels: [],
  cloudModels: [],
  selectedModel: null,
  isLoading: false,
  error: null,
  uploadProgress: {},

  // Local Models Management
  loadLocalModel: async (modelId: string, modelPath: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const success = await localAIManager.loadModel(modelId, modelPath);
      
      if (success) {
        const modelInfo = localAIManager.getModelInfo(modelId);
        if (modelInfo) {
          set(state => ({
            localModels: [...state.localModels.filter(m => m.id !== modelId), modelInfo],
            selectedModel: modelInfo
          }));
        }
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  unloadLocalModel: async (modelId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const success = await localAIManager.unloadModel(modelId);
      
      if (success) {
        set(state => ({
          localModels: state.localModels.filter(m => m.id !== modelId),
          selectedModel: state.selectedModel?.id === modelId ? null : state.selectedModel
        }));
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unload model';
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  getLocalModelInfo: (modelId: string) => {
    return localAIManager.getModelInfo(modelId);
  },

  getLocalModelMetrics: (modelId: string) => {
    return localAIManager.getMetrics(modelId);
  },

  validateLocalModel: async (modelPath: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const isValid = await localAIManager.validateModel(modelPath);
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model validation failed';
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Model Operations
  performInference: async (modelId: string, prompt: string, config?: ModelInferenceConfig) => {
    set({ isLoading: true, error: null });
    
    try {
      const cfg: ModelInferenceConfig | undefined = config ? { ...config, modelId: config.modelId || modelId } : { modelId };
      const response = await localAIManager.inference(modelId, prompt, cfg as any);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Inference failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateModelStatus: (modelId: string, status: 'loading' | 'ready' | 'error') => {
    set(state => ({
      localModels: state.localModels.map(model => 
        model.id === modelId ? { ...model, status } : model
      ),
      cloudModels: state.cloudModels.map(model => 
        model.id === modelId ? { ...model, status } : model
      )
    }));
  },

  setSelectedModel: (model: AIModel | null) => {
    set({ selectedModel: model });
  },

  // Upload Management
  setUploadProgress: (modelId: string, progress: number) => {
    set(state => ({
      uploadProgress: { ...state.uploadProgress, [modelId]: progress }
    }));
  },

  clearUploadProgress: (modelId: string) => {
    set(state => {
      const newProgress = { ...state.uploadProgress };
      delete newProgress[modelId];
      return { uploadProgress: newProgress };
    });
  },

  // Error Handling
  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // State Management
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  reset: () => {
    set({
      localModels: [],
      cloudModels: [],
      selectedModel: null,
      isLoading: false,
      error: null,
      uploadProgress: {}
    });
  }
}));

// Export actions for easier access
export const aiModelsActions = {
  loadLocalModel: aiModelsStore.getState().loadLocalModel,
  unloadLocalModel: aiModelsStore.getState().unloadLocalModel,
  getLocalModelInfo: aiModelsStore.getState().getLocalModelInfo,
  getLocalModelMetrics: aiModelsStore.getState().getLocalModelMetrics,
  validateLocalModel: aiModelsStore.getState().validateLocalModel,
  performInference: aiModelsStore.getState().performInference,
  updateModelStatus: aiModelsStore.getState().updateModelStatus,
  setSelectedModel: aiModelsStore.getState().setSelectedModel,
  setUploadProgress: aiModelsStore.getState().setUploadProgress,
  clearUploadProgress: aiModelsStore.getState().clearUploadProgress,
  setError: aiModelsStore.getState().setError,
  clearError: aiModelsStore.getState().clearError,
  setLoading: aiModelsStore.getState().setLoading,
  reset: aiModelsStore.getState().reset
};
