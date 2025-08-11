export interface AIModel {
  id: string;
  name: string;
  fileName: string;
  size: number;
  type: 'GGUF' | 'PyTorch' | 'SafeTensors' | 'ONNX' | 'Unknown';
  uploadDate: string;
  status: 'ready' | 'loading' | 'error' | 'processing';
  isLocal: boolean;
  capabilities: string[];
  parameters: string;
  description?: string;
  modelPath?: string;
  quantization?: string;
  architecture?: string;
  contextLength?: number;
  tokenizer?: string;
  metadata?: Record<string, any>;
}

export interface ModelUploadProgress {
  modelId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  startTime: number;
  estimatedTime?: number;
}

export interface ModelInferenceConfig {
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  contextLength?: number;
  seed?: number;
  systemPrompt?: string;
}

export interface LocalInferenceSession {
  id: string;
  modelId: string;
  config: ModelInferenceConfig;
  status: 'initializing' | 'ready' | 'busy' | 'error';
  createdAt: string;
  lastUsed: string;
}

export interface ModelMetrics {
  modelId: string;
  totalInferences: number;
  totalTokensGenerated: number;
  averageLatency: number;
  lastUsed: string;
  errorCount: number;
}

export type SupportedModelFormat = 'gguf' | 'bin' | 'safetensors' | 'onnx';

export interface ModelValidation {
  isValid: boolean;
  format: SupportedModelFormat | null;
  size: number;
  estimatedParameters?: string;
  architecture?: string;
  errors: string[];
  warnings: string[];
}

export interface ModelRepository {
  id: string;
  name: string;
  description: string;
  models: AIModel[];
  tags: string[];
  author: string;
  license: string;
  homepage?: string;
  downloadUrl?: string;
}

// Local model management utilities
export interface LocalModelManager {
  loadModel: (modelId: string, config?: ModelInferenceConfig) => Promise<LocalInferenceSession>;
  unloadModel: (sessionId: string) => Promise<void>;
  inference: (sessionId: string, prompt: string, config?: Partial<ModelInferenceConfig>) => Promise<string>;
  getModelInfo: (modelId: string) => Promise<AIModel | null>;
  validateModel: (file: File) => Promise<ModelValidation>;
  getAvailableModels: () => Promise<AIModel[]>;
  getMetrics: (modelId: string) => Promise<ModelMetrics>;
}
