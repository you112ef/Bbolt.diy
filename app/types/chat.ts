export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelId?: string;
  metadata?: Record<string, any>;
}

export interface ChatHistory {
  [chatId: string]: ChatMessage[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  selectedModelId: string | null;
  chatHistory: ChatHistory;
  currentChatId: string;
}

export interface ChatActions {
  // Message management
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  
  // Chat history
  loadChat: (chatId: string) => void;
  saveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  createNewChat: () => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTyping: (typing: boolean) => void;
  setSelectedModel: (modelId: string | null) => void;
  setCurrentChatId: (chatId: string) => void;
  
  // Utilities
  exportChat: (chatId: string) => string;
  importChat: (data: string) => void;
}