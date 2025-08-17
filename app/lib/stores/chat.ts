import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '~/types/chat';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  selectedModelId: string | null;
  chatHistory: Record<string, ChatMessage[]>;
  currentChatId: string;
  showChat: boolean;
}

interface ChatActions {
  // Message Management
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  
  // Chat History
  saveChat: (chatId: string, messages: ChatMessage[]) => void;
  loadChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  getAllChats: () => Record<string, ChatMessage[]>;
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTyping: (typing: boolean) => void;
  setSelectedModel: (modelId: string | null) => void;
  setCurrentChatId: (chatId: string) => void;
  setShowChat: (show: boolean) => void;
  
  // Utility
  reset: () => void;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  isTyping: false,
  selectedModelId: null,
  chatHistory: {},
  currentChatId: 'default',
  showChat: true,
};

export const chatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Message Management
      addMessage: (message: ChatMessage) => {
        set((state) => {
          const newMessages = [...state.messages, message];
          const newChatHistory = {
            ...state.chatHistory,
            [state.currentChatId]: newMessages,
          };

          return {
            messages: newMessages,
            chatHistory: newChatHistory,
          };
        });
      },

      updateMessage: (messageId: string, updates: Partial<ChatMessage>) => {
        set((state) => {
          const updatedMessages = state.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg));

          const newChatHistory = {
            ...state.chatHistory,
            [state.currentChatId]: updatedMessages,
          };

          return {
            messages: updatedMessages,
            chatHistory: newChatHistory,
          };
        });
      },

      removeMessage: (messageId: string) => {
        set((state) => {
          const filteredMessages = state.messages.filter((msg) => msg.id !== messageId);
          const newChatHistory = {
            ...state.chatHistory,
            [state.currentChatId]: filteredMessages,
          };

          return {
            messages: filteredMessages,
            chatHistory: newChatHistory,
          };
        });
      },

      clearMessages: () => {
        set((state) => {
          const newChatHistory = {
            ...state.chatHistory,
            [state.currentChatId]: [],
          };

          return {
            messages: [],
            chatHistory: newChatHistory,
          };
        });
      },

      // Chat History
      saveChat: (chatId: string, messages: ChatMessage[]) => {
        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [chatId]: messages,
          },
        }));
      },

      loadChat: (chatId: string) => {
        set((state) => ({
          messages: state.chatHistory[chatId] || [],
          currentChatId: chatId,
        }));
      },

      deleteChat: (chatId: string) => {
        set((state) => {
          const newChatHistory = { ...state.chatHistory };
          delete newChatHistory[chatId];

          return {
            chatHistory: newChatHistory,
            messages: state.currentChatId === chatId ? [] : state.messages,
          };
        });
      },

      getAllChats: () => {
        return get().chatHistory;
      },

      // State Management
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setTyping: (typing: boolean) => set({ isTyping: typing }),
      setSelectedModel: (modelId: string | null) => set({ selectedModelId: modelId }),
      setCurrentChatId: (chatId: string) => set({ currentChatId: chatId }),
      setShowChat: (show: boolean) => set({ showChat: show }),

      // Utility
      reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chatHistory: state.chatHistory,
        selectedModelId: state.selectedModelId,
        currentChatId: state.currentChatId,
        showChat: state.showChat,
      }),
    },
  ),
);

// Export actions for easier access
export const chatActions = {
  addMessage: chatStore.getState().addMessage,
  updateMessage: chatStore.getState().updateMessage,
  removeMessage: chatStore.getState().removeMessage,
  clearMessages: chatStore.getState().clearMessages,
  saveChat: chatStore.getState().saveChat,
  loadChat: chatStore.getState().loadChat,
  deleteChat: chatStore.getState().deleteChat,
  getAllChats: chatStore.getState().getAllChats,
  setLoading: chatStore.getState().setLoading,
  setError: chatStore.getState().setError,
  setTyping: chatStore.getState().setTyping,
  setSelectedModel: chatStore.getState().setSelectedModel,
  setCurrentChatId: chatStore.getState().setCurrentChatId,
  setShowChat: chatStore.getState().setShowChat,
  reset: chatStore.getState().reset,
};
