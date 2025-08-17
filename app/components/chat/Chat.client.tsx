import React, { useState, useCallback, useRef, useEffect } from 'react';
import { aiModelsStore, aiModelsActions } from '~/lib/stores/aiModels';
import { localAIManager } from '~/enhanced/models/providers/OfflineAI';
import type { AIModel } from '~/types/aiModels';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelId?: string;
  isError?: boolean;
}

interface ChatClientProps {
  className?: string;
}

export const ChatClient: React.FC<ChatClientProps> = ({ className }) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { selectedModel, localModels, cloudModels } = aiModelsStore.getState();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      modelId: selectedModel?.id || null
    };

    // Add user message
    addMessage(userMessage);
    setInput('');
    setIsGenerating(true);
    setError(null);

    try {
      let assistantResponse = '';

      if (selectedModel?.isLocal) {
        // Use local AI model
        assistantResponse = await aiModelsActions.performInference(
          selectedModel.id,
          input.trim(),
          {
            maxTokens: selectedModel.parameters.maxTokens,
            temperature: selectedModel.parameters.temperature,
            topP: selectedModel.parameters.topP
          }
        );
      } else if (selectedModel) {
        // Use cloud AI model (implement cloud API call here)
        assistantResponse = `استجابة من النموذج السحابي: ${selectedModel.name}`;
      } else {
        // No model selected
        assistantResponse = 'يرجى اختيار نموذج ذكاء اصطناعي أولاً.';
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date().toISOString(),
        modelId: selectedModel?.id || null
      };

      addMessage(assistantMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الرد';
      setError(errorMessage);
      
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ خطأ: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        modelId: selectedModel?.id || null,
        isError: true
      };

      addMessage(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, selectedModel, addMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleModelSelect = useCallback((model: AIModel) => {
    aiModelsActions.setSelectedModel(model);
  }, []);

  const clearChat = useCallback(() => {
    if (confirm('هل أنت متأكد من حذف جميع الرسائل؟')) {
      clearMessages();
    }
  }, [clearMessages]);

  const availableModels = [...localModels, ...cloudModels];

  return (
    <div className={`chat-client ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            المحادثة
          </h2>
          {selectedModel && (
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {selectedModel.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            مسح المحادثة
          </button>
        </div>
      </div>

      {/* Model Selection */}
      {availableModels.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اختيار النموذج:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedModel?.id === model.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {model.name}
                {model.isLocal && (
                  <span className="ml-1 text-[10px]">(محلي)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="i-ph:chat-circle text-4xl mb-3" />
            <p className="text-lg font-medium mb-2">مرحباً! 👋</p>
            <p className="text-sm">
              {selectedModel 
                ? `ابدأ المحادثة مع ${selectedModel.name}`
                : 'اختر نموذج ذكاء اصطناعي للبدء في المحادثة'
              }
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isError
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="i-ph:user text-lg" />
                    ) : (
                      <div className="i-ph:robot text-lg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.modelId && (
                        <span className="text-xs">
                          {availableModels.find(m => m.id === message.modelId)?.name || 'نموذج غير معروف'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="i-ph:robot text-lg" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-red-600 dark:text-red-300 hover:underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedModel 
                  ? `اكتب رسالتك هنا... (${selectedModel.name})`
                  : 'اختر نموذج ذكاء اصطناعي أولاً...'
              }
              disabled={!selectedModel || isGenerating}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50"
              rows={1}
              maxLength={4000}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {input.length}/4000
              </span>
              <span className="text-xs text-gray-500">
                اضغط Enter للإرسال، Shift+Enter للسطر الجديد
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !selectedModel || isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري التوليد...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="i-ph:paper-plane-right" />
                <span>إرسال</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
