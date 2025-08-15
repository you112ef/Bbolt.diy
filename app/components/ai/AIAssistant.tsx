import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { AgentMessage, AgentType, AgentContext } from './agents/types';
import LocalAIEngine from './engines/LocalAIEngine';
import ExplainerAgent from './agents/ExplainerAgent';
import FixerAgent from './agents/FixerAgent';
import OptimizerAgent from './agents/OptimizerAgent';
import TesterAgent from './agents/TesterAgent';
import DocsAgent from './agents/DocsAgent';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_CONFIG = {
  provider: 'local' as const,
  model: 'bolt-assistant',
  temperature: 0.7,
  maxTokens: 2048,
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('general');
  const [aiEngine] = useState(() => new LocalAIEngine(AI_CONFIG));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedFile = useStore(workbenchStore.selectedFile);
  const files = useStore(workbenchStore.files);
  const currentDocument = useStore(workbenchStore.currentDocument);

  // Initialize agents
  const agents = {
    explainer: new ExplainerAgent(aiEngine),
    fixer: new FixerAgent(aiEngine),
    optimizer: new OptimizerAgent(aiEngine),
    tester: new TesterAgent(aiEngine),
    docs: new DocsAgent(aiEngine),
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getCurrentContext = useCallback((): AgentContext => {
    const context: AgentContext = {};
    
    if (selectedFile) {
      context.selectedFile = selectedFile;
      context.language = selectedFile.split('.').pop() || 'javascript';
    }
    
    if (currentDocument) {
      context.selectedCode = currentDocument.content;
    }
    
    if (files) {
      context.codebase = Object.fromEntries(
        Object.entries(files).map(([path, file]) => [path, file.content])
      );
    }

    // Detect frameworks from package.json or file structure
    if (context.codebase?.['package.json']) {
      try {
        const packageJson = JSON.parse(context.codebase['package.json']);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        context.frameworks = Object.keys(deps).filter(dep => 
          ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'].includes(dep)
        );
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return context;
  }, [selectedFile, currentDocument, files]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      agentType: selectedAgent,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = getCurrentContext();
      let response;

      if (selectedAgent === 'general') {
        // General AI response
        response = await aiEngine.generate(input);
      } else {
        // Specific agent response
        const agent = agents[selectedAgent];
        response = await agent.process(input, context);
      }

      const assistantMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        agentType: selectedAgent,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        agentType: selectedAgent,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, aiEngine, agents, getCurrentContext]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const agentOptions = [
    { type: 'general' as AgentType, name: 'General Assistant', icon: 'i-ph:robot', color: 'blue' },
    { type: 'explainer' as AgentType, name: 'Code Explainer', icon: 'i-ph:book-open-text', color: 'green' },
    { type: 'fixer' as AgentType, name: 'Bug Fixer', icon: 'i-ph:wrench', color: 'red' },
    { type: 'optimizer' as AgentType, name: 'Optimizer', icon: 'i-ph:lightning', color: 'yellow' },
    { type: 'tester' as AgentType, name: 'Test Generator', icon: 'i-ph:test-tube', color: 'purple' },
    { type: 'docs' as AgentType, name: 'Documentation', icon: 'i-ph:article', color: 'indigo' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-4 top-20 bottom-4 w-96 z-50"
        >
          <div className="h-full bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="i-ph:robot text-white text-sm" />
                </div>
                <h3 className="font-semibold text-bolt-elements-textPrimary">AI Assistant</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
              >
                <div className="i-ph:x text-lg" />
              </button>
            </div>

            {/* Agent Selector */}
            <div className="p-3 border-b border-bolt-elements-borderColor">
              <div className="grid grid-cols-3 gap-1">
                {agentOptions.map((agent) => (
                  <button
                    key={agent.type}
                    onClick={() => setSelectedAgent(agent.type)}
                    className={`p-2 rounded-md text-xs flex flex-col items-center gap-1 transition-colors ${
                      selectedAgent === agent.type
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary'
                    }`}
                  >
                    <div className={`${agent.icon} text-sm`} />
                    <span className="truncate w-full text-center">{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-bolt-elements-textSecondary">
                  <div className="i-ph:chat-circle text-4xl mb-2 opacity-50" />
                  <p>Ask me anything about your code!</p>
                  <p className="text-xs mt-1">Select an agent type above for specialized help.</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-bolt-elements-background-depth-3 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-bolt-elements-borderColor">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your code..."
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-sm text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <div className="i-ph:paper-plane-right text-sm" />
                </button>
              </div>
              
              {selectedFile && (
                <div className="mt-2 text-xs text-bolt-elements-textTertiary">
                  Context: {selectedFile}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistant;