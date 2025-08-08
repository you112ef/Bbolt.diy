import { atom } from 'nanostores';
import type { AIModel, LocalInferenceSession, ModelMetrics, ModelInferenceConfig } from '~/types/aiModels';

// AI Models Store
export const aiModelsStore = atom<AIModel[]>([]);

// Active inference sessions
export const inferenceSessionsStore = atom<LocalInferenceSession[]>([]);

// Model metrics
export const modelMetricsStore = atom<Record<string, ModelMetrics>>({});

// Currently selected model for chat
export const selectedModelStore = atom<string | null>(null);

// Model loading status
export const modelLoadingStore = atom<Record<string, boolean>>({});

// Store management functions
export const aiModelsActions = {
  // Add a new model
  addModel: (model: AIModel) => {
    const currentModels = aiModelsStore.get();
    aiModelsStore.set([...currentModels, model]);
    
    // Save to localStorage
    localStorage.setItem('bolt-ai-models', JSON.stringify([...currentModels, model]));
  },

  // Remove a model
  removeModel: (modelId: string) => {
    const currentModels = aiModelsStore.get();
    const updatedModels = currentModels.filter(model => model.id !== modelId);
    aiModelsStore.set(updatedModels);
    
    // Remove from localStorage
    localStorage.setItem('bolt-ai-models', JSON.stringify(updatedModels));
    
    // Clean up related data
    const currentSessions = inferenceSessionsStore.get();
    const updatedSessions = currentSessions.filter(session => session.modelId !== modelId);
    inferenceSessionsStore.set(updatedSessions);
    
    const currentMetrics = modelMetricsStore.get();
    const { [modelId]: removedMetric, ...remainingMetrics } = currentMetrics;
    modelMetricsStore.set(remainingMetrics);
  },

  // Update model status
  updateModelStatus: (modelId: string, status: AIModel['status']) => {
    const currentModels = aiModelsStore.get();
    const updatedModels = currentModels.map(model =>
      model.id === modelId ? { ...model, status } : model
    );
    aiModelsStore.set(updatedModels);
    localStorage.setItem('bolt-ai-models', JSON.stringify(updatedModels));
  },

  // Get model by ID
  getModel: (modelId: string): AIModel | undefined => {
    const models = aiModelsStore.get();
    return models.find(model => model.id === modelId);
  },

  // Initialize from localStorage
  initializeFromStorage: () => {
    try {
      const stored = localStorage.getItem('bolt-ai-models');
      if (stored) {
        const models = JSON.parse(stored) as AIModel[];
        aiModelsStore.set(models);
      }
    } catch (error) {
      console.error('Failed to load AI models from storage:', error);
    }
  },

  // Create inference session
  createInferenceSession: (modelId: string, config: ModelInferenceConfig): LocalInferenceSession => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: LocalInferenceSession = {
      id: sessionId,
      modelId,
      config,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    const currentSessions = inferenceSessionsStore.get();
    inferenceSessionsStore.set([...currentSessions, session]);
    
    return session;
  },

  // Update session status
  updateSessionStatus: (sessionId: string, status: LocalInferenceSession['status']) => {
    const currentSessions = inferenceSessionsStore.get();
    const updatedSessions = currentSessions.map(session =>
      session.id === sessionId ? { 
        ...session, 
        status, 
        lastUsed: new Date().toISOString() 
      } : session
    );
    inferenceSessionsStore.set(updatedSessions);
  },

  // Remove inference session
  removeInferenceSession: (sessionId: string) => {
    const currentSessions = inferenceSessionsStore.get();
    const updatedSessions = currentSessions.filter(session => session.id !== sessionId);
    inferenceSessionsStore.set(updatedSessions);
  },

  // Update model metrics
  updateMetrics: (modelId: string, metrics: Partial<ModelMetrics>) => {
    const currentMetrics = modelMetricsStore.get();
    const existingMetrics = currentMetrics[modelId] || {
      modelId,
      totalInferences: 0,
      totalTokensGenerated: 0,
      averageLatency: 0,
      lastUsed: new Date().toISOString(),
      errorCount: 0
    };

    const updatedMetrics = { ...existingMetrics, ...metrics };
    modelMetricsStore.set({
      ...currentMetrics,
      [modelId]: updatedMetrics
    });
  },

  // Set selected model
  setSelectedModel: (modelId: string | null) => {
    selectedModelStore.set(modelId);
    localStorage.setItem('bolt-selected-model', modelId || '');
  },

  // Get selected model
  getSelectedModel: (): string | null => {
    return selectedModelStore.get();
  },

  // Set model loading status
  setModelLoading: (modelId: string, loading: boolean) => {
    const currentStatus = modelLoadingStore.get();
    modelLoadingStore.set({
      ...currentStatus,
      [modelId]: loading
    });
  },

  // Check if model is loading
  isModelLoading: (modelId: string): boolean => {
    const status = modelLoadingStore.get();
    return status[modelId] || false;
  },

  // Get ready models
  getReadyModels: (): AIModel[] => {
    const models = aiModelsStore.get();
    return models.filter(model => model.status === 'ready');
  },

  // Get local models only
  getLocalModels: (): AIModel[] => {
    const models = aiModelsStore.get();
    return models.filter(model => model.isLocal);
  },

  // Clear all data
  clearAll: () => {
    aiModelsStore.set([]);
    inferenceSessionsStore.set([]);
    modelMetricsStore.set({});
    selectedModelStore.set(null);
    modelLoadingStore.set({});
    localStorage.removeItem('bolt-ai-models');
    localStorage.removeItem('bolt-selected-model');
  }
};

// Initialize from localStorage on module load
if (typeof window !== 'undefined') {
  aiModelsActions.initializeFromStorage();
  
  // Try to restore selected model
  const savedSelectedModel = localStorage.getItem('bolt-selected-model');
  if (savedSelectedModel) {
    selectedModelStore.set(savedSelectedModel);
  }
}

// Export convenience hooks for React components
export const useAIModels = () => aiModelsStore.get();
export const useInferenceSessions = () => inferenceSessionsStore.get();
export const useModelMetrics = () => modelMetricsStore.get();
export const useSelectedModel = () => selectedModelStore.get();