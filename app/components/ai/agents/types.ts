export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
}

export interface AgentResponse {
  content: string;
  suggestions?: string[];
  codeExample?: string;
  files?: string[];
}

export type AgentType = 'explainer' | 'fixer' | 'optimizer' | 'tester' | 'docs' | 'general';

export interface Agent {
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  process: (input: string, context?: AgentContext) => Promise<AgentResponse>;
}

export interface AgentContext {
  selectedFile?: string;
  selectedCode?: string;
  codebase?: {
    [filePath: string]: string;
  };
  language?: string;
  errorMessage?: string;
  frameworks?: string[];
}

export interface AIConfig {
  provider: 'local' | 'openai' | 'anthropic';
  model: string;
  apiKey?: string;
  localModelPath?: string;
  temperature: number;
  maxTokens: number;
}

export interface LocalAIModel {
  name: string;
  path: string;
  size: string;
  description: string;
  loaded: boolean;
}