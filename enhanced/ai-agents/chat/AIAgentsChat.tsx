import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { filesStore } from '~/lib/stores/files';
import { aiModelsStore, useAIModels } from '~/lib/stores/aiModels';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Dropdown } from '~/components/ui/Dropdown';
import { Textarea } from '~/components/ui/Textarea';
import { Tabs } from '~/components/ui/Tabs';
import type { AIModel } from '~/types/aiModels';

// AI Agent types and definitions
export type AIAgentType = 
  | 'explainer'
  | 'test-generator'
  | 'bug-fixer'
  | 'optimizer'
  | 'documenter'
  | 'refactor'
  | 'security-auditor'
  | 'code-reviewer';

interface AIAgent {
  id: AIAgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  systemPrompt: string;
  examples: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentId?: AIAgentType;
  context?: {
    files?: string[];
    selectedCode?: string;
    operation?: string;
  };
  isLoading?: boolean;
  error?: string;
}

interface AIAgentsChatProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  onCodeInsert?: (code: string, filePath?: string) => void;
  onFileCreate?: (content: string, fileName: string) => void;
  selectedCode?: string;
  currentFile?: string;
}

// Define AI Agents with their capabilities
const AI_AGENTS: Record<AIAgentType, AIAgent> = {
  explainer: {
    id: 'explainer',
    name: 'Code Explainer',
    description: 'Explains code functionality, patterns, and concepts',
    icon: 'i-ph:book-open',
    color: 'blue',
    capabilities: ['Code Analysis', 'Documentation', 'Learning Support'],
    systemPrompt: `You are an expert code explainer. Your role is to:
- Analyze and explain code functionality clearly and concisely
- Break down complex algorithms and patterns
- Provide educational insights about programming concepts
- Use simple language while maintaining technical accuracy
- Include examples and analogies when helpful
- Focus on the "why" behind the code, not just the "what"`,
    examples: [
      'Explain this React component',
      'What does this function do?',
      'How does this algorithm work?',
      'Explain the design pattern used here',
    ],
  },
  'test-generator': {
    id: 'test-generator',
    name: 'Test Generator',
    description: 'Creates comprehensive test suites and test cases',
    icon: 'i-ph:test-tube',
    color: 'green',
    capabilities: ['Unit Tests', 'Integration Tests', 'Test Coverage', 'Mock Generation'],
    systemPrompt: `You are an expert test generator. Your role is to:
- Generate comprehensive test suites for given code
- Create unit tests, integration tests, and edge case tests
- Use appropriate testing frameworks (Jest, Vitest, pytest, etc.)
- Include proper mocking and stubbing
- Ensure good test coverage and maintainability
- Follow testing best practices and conventions
- Generate both positive and negative test cases`,
    examples: [
      'Generate tests for this function',
      'Create integration tests for this API',
      'Write edge case tests',
      'Generate mock data for testing',
    ],
  },
  'bug-fixer': {
    id: 'bug-fixer',
    name: 'Bug Fixer',
    description: 'Identifies and fixes bugs in code',
    icon: 'i-ph:bug',
    color: 'red',
    capabilities: ['Bug Detection', 'Error Fixing', 'Debugging', 'Code Validation'],
    systemPrompt: `You are an expert bug fixer. Your role is to:
- Identify bugs, errors, and issues in code
- Provide clear explanations of what's wrong
- Offer multiple solution approaches when possible
- Fix logical errors, syntax issues, and runtime problems
- Suggest preventive measures to avoid similar bugs
- Validate fixes and ensure they don't introduce new issues
- Focus on root cause analysis`,
    examples: [
      'Fix this error in my code',
      'Why is this function not working?',
      'Debug this React component',
      'Solve this performance issue',
    ],
  },
  optimizer: {
    id: 'optimizer',
    name: 'Performance Optimizer',
    description: 'Optimizes code for better performance and efficiency',
    icon: 'i-ph:lightning',
    color: 'yellow',
    capabilities: ['Performance Analysis', 'Code Optimization', 'Memory Management', 'Algorithms'],
    systemPrompt: `You are an expert performance optimizer. Your role is to:
- Analyze code for performance bottlenecks
- Suggest algorithmic improvements and optimizations
- Optimize memory usage and resource consumption
- Improve code efficiency without sacrificing readability
- Recommend better data structures and algorithms
- Consider scalability and maintainability in optimizations
- Provide performance metrics and benchmarking suggestions`,
    examples: [
      'Optimize this algorithm',
      'Improve the performance of this function',
      'Reduce memory usage in this code',
      'Make this code more efficient',
    ],
  },
  documenter: {
    id: 'documenter',
    name: 'Code Documenter',
    description: 'Creates comprehensive documentation and comments',
    icon: 'i-ph:file-text',
    color: 'purple',
    capabilities: ['API Documentation', 'Code Comments', 'README Generation', 'Type Definitions'],
    systemPrompt: `You are an expert code documenter. Your role is to:
- Generate comprehensive documentation for code
- Write clear and helpful code comments
- Create API documentation and usage examples
- Generate README files and project documentation
- Document function parameters, return values, and side effects
- Follow documentation standards (JSDoc, Sphinx, etc.)
- Make documentation accessible to different skill levels`,
    examples: [
      'Document this API',
      'Generate README for this project',
      'Add comments to this code',
      'Create API documentation',
    ],
  },
  refactor: {
    id: 'refactor',
    name: 'Code Refactorer',
    description: 'Refactors code for better structure and maintainability',
    icon: 'i-ph:arrows-clockwise',
    color: 'indigo',
    capabilities: ['Code Restructuring', 'Design Patterns', 'Clean Code', 'Architecture'],
    systemPrompt: `You are an expert code refactorer. Your role is to:
- Refactor code for better structure and maintainability
- Apply design patterns and clean code principles
- Improve code organization and modularity
- Eliminate code smells and anti-patterns
- Ensure backward compatibility when possible
- Maintain or improve functionality while restructuring
- Follow language-specific best practices and conventions`,
    examples: [
      'Refactor this component',
      'Improve the structure of this code',
      'Apply design patterns here',
      'Clean up this messy code',
    ],
  },
  'security-auditor': {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Identifies security vulnerabilities and suggests fixes',
    icon: 'i-ph:shield-check',
    color: 'orange',
    capabilities: ['Vulnerability Detection', 'Security Best Practices', 'Code Scanning', 'Risk Assessment'],
    systemPrompt: `You are an expert security auditor. Your role is to:
- Identify security vulnerabilities and risks in code
- Suggest secure coding practices and fixes
- Analyze for common security issues (XSS, SQL injection, etc.)
- Review authentication and authorization implementations
- Check for data validation and sanitization issues
- Recommend security libraries and tools
- Provide risk assessments and mitigation strategies`,
    examples: [
      'Audit this code for security issues',
      'Check for vulnerabilities',
      'Review authentication logic',
      'Validate input sanitization',
    ],
  },
  'code-reviewer': {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Provides comprehensive code reviews and feedback',
    icon: 'i-ph:eye',
    color: 'teal',
    capabilities: ['Code Quality', 'Best Practices', 'Style Guide', 'Architecture Review'],
    systemPrompt: `You are an expert code reviewer. Your role is to:
- Provide comprehensive code reviews with constructive feedback
- Check for adherence to coding standards and best practices
- Review code architecture and design decisions
- Identify potential issues before they become problems
- Suggest improvements for readability and maintainability
- Ensure code follows team conventions and style guides
- Balance thoroughness with practicality in reviews`,
    examples: [
      'Review this pull request',
      'Check code quality',
      'Validate coding standards',
      'Review architecture decisions',
    ],
  },
};

// Mock AI inference function (replace with actual AI model integration)
const performAIInference = async (
  prompt: string,
  agent: AIAgent,
  context?: ChatMessage['context'],
  modelId?: string
): Promise<string> => {
  // Simulate AI thinking time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Get available models
  const models = aiModelsStore.get();
  const selectedModel = models.find(m => m.id === modelId) || models[0];

  // Construct full prompt with context
  let fullPrompt = `${agent.systemPrompt}\n\n`;
  
  if (context?.selectedCode) {
    fullPrompt += `Code to analyze:\n\`\`\`\n${context.selectedCode}\n\`\`\`\n\n`;
  }
  
  if (context?.files?.length) {
    fullPrompt += `Related files: ${context.files.join(', ')}\n\n`;
  }
  
  fullPrompt += `User request: ${prompt}`;

  // Mock response based on agent type
  switch (agent.id) {
    case 'explainer':
      return `## Code Explanation

Based on the provided code, here's a detailed explanation:

### Functionality
${context?.selectedCode ? 
  `This code appears to be a ${context.selectedCode.includes('function') ? 'function' : 'component'} that handles specific logic within your application.` :
  'This code implements specific functionality for your project.'
}

### Key Concepts
- **Structure**: The code follows modern ${context?.selectedCode?.includes('React') ? 'React' : 'JavaScript'} patterns
- **Purpose**: It serves as a ${agent.name.toLowerCase()} component in your application
- **Benefits**: Provides reusable and maintainable code structure

### How it works
1. The code initializes with proper setup
2. It processes inputs according to defined logic
3. Returns or renders appropriate outputs

${selectedModel ? `\n*Analysis performed using: ${selectedModel.name}*` : ''}`;

    case 'test-generator':
      return `## Generated Test Suite

Here's a comprehensive test suite for your code:

\`\`\`javascript
describe('${context?.currentFile || 'Component'} Tests', () => {
  test('should handle basic functionality', () => {
    // Test basic operation
    expect(true).toBe(true);
  });
  
  test('should handle edge cases', () => {
    // Test edge cases
    expect(true).toBe(true);
  });
  
  test('should handle error conditions', () => {
    // Test error handling
    expect(true).toBe(true);
  });
});
\`\`\`

### Test Coverage
- ✅ Basic functionality tests
- ✅ Edge case scenarios
- ✅ Error handling
- ✅ Integration tests

${selectedModel ? `\n*Tests generated using: ${selectedModel.name}*` : ''}`;

    case 'bug-fixer':
      return `## Bug Analysis & Fix

### Issues Identified
1. **Potential Issue**: Logic flow could be improved
2. **Recommendation**: Add proper error handling

### Proposed Fix
\`\`\`javascript
// Fixed version with improved error handling
try {
  // Your improved code here
  console.log('Code fixed and optimized');
} catch (error) {
  console.error('Error handled:', error);
}
\`\`\`

### Prevention
- Add input validation
- Implement proper error boundaries
- Use TypeScript for better type safety

${selectedModel ? `\n*Bug analysis performed using: ${selectedModel.name}*` : ''}`;

    case 'optimizer':
      return `## Performance Optimization

### Current Performance Analysis
- **Time Complexity**: O(n) - Good performance
- **Memory Usage**: Optimized
- **Bottlenecks**: None identified

### Optimization Suggestions
\`\`\`javascript
// Optimized version
const optimizedFunction = useMemo(() => {
  // Memoized computation for better performance
  return computeExpensiveValue();
}, [dependencies]);
\`\`\`

### Performance Improvements
- ⚡ 25% faster execution
- 💾 Reduced memory footprint
- 📊 Better scalability

${selectedModel ? `\n*Optimization analysis using: ${selectedModel.name}*` : ''}`;

    case 'documenter':
      return `## Generated Documentation

### API Documentation

\`\`\`javascript
/**
 * ${context?.currentFile || 'Function'} - Description
 * @param {string} param1 - Description of parameter
 * @param {object} options - Configuration options
 * @returns {Promise<any>} Description of return value
 * @example
 * // Usage example
 * const result = await myFunction('input', { option: true });
 */
\`\`\`

### README Section
\`\`\`markdown
## ${context?.currentFile || 'Component'}

Brief description of functionality.

### Usage
\`\`\`javascript
import Component from './Component';
// Usage example
\`\`\`

### API Reference
- **Props**: List of props
- **Methods**: Available methods
- **Events**: Event handlers
\`\`\`

${selectedModel ? `\n*Documentation generated using: ${selectedModel.name}*` : ''}`;

    case 'refactor':
      return `## Code Refactoring

### Current Structure Analysis
- Code organization could be improved
- Some functions could be extracted
- Better separation of concerns needed

### Refactored Code
\`\`\`javascript
// Refactored for better maintainability
const useEnhancedLogic = () => {
  // Extracted custom hook
  const [state, setState] = useState();
  
  const handleOperation = useCallback(() => {
    // Optimized operation
  }, []);
  
  return { state, handleOperation };
};
\`\`\`

### Improvements Made
- ✨ Better code organization
- 🔧 Extracted reusable logic
- 📦 Improved modularity
- 🧹 Cleaner code structure

${selectedModel ? `\n*Refactoring suggestions from: ${selectedModel.name}*` : ''}`;

    case 'security-auditor':
      return `## Security Audit Report

### Security Analysis
🔍 **Overall Security Score**: 8/10

### Findings
- ✅ No critical vulnerabilities detected
- ⚠️ Consider input validation improvements
- ✅ Proper authentication patterns used

### Recommendations
1. **Input Validation**: Add stricter input sanitization
2. **Error Handling**: Avoid exposing stack traces
3. **Dependencies**: Keep dependencies updated

### Secure Code Example
\`\`\`javascript
// Security-enhanced version
const sanitizeInput = (input) => {
  return input.replace(/[<>]/g, '');
};

const secureFunction = (userInput) => {
  const cleanInput = sanitizeInput(userInput);
  // Process safely
};
\`\`\`

${selectedModel ? `\n*Security audit performed using: ${selectedModel.name}*` : ''}`;

    case 'code-reviewer':
      return `## Code Review

### Overall Assessment
📊 **Code Quality Score**: 85/100

### Strengths
- ✅ Clean and readable code structure
- ✅ Good naming conventions
- ✅ Proper error handling

### Areas for Improvement
1. **Documentation**: Add more inline comments
2. **Testing**: Increase test coverage
3. **Performance**: Consider memoization for expensive operations

### Detailed Feedback
\`\`\`javascript
// Suggested improvements
const improvedComponent = memo(({ props }) => {
  // Add prop validation
  const validatedProps = validateProps(props);
  
  // Your component logic here
  return <div>{/* Component JSX */}</div>;
});
\`\`\`

### Action Items
- [ ] Add PropTypes or TypeScript interfaces
- [ ] Implement error boundaries
- [ ] Add unit tests

${selectedModel ? `\n*Code review performed using: ${selectedModel.name}*` : ''}`;

    default:
      return `I'm here to help with your ${agent.name.toLowerCase()} needs. Please provide more specific details about what you'd like me to analyze or assist with.`;
  }
};

export const AIAgentsChat: React.FC<AIAgentsChatProps> = ({
  width = '100%',
  height = '100%',
  className,
  onCodeInsert,
  onFileCreate,
  selectedCode,
  currentFile,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgentType>('explainer');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const files = useStore(filesStore);
  const availableModels = useAIModels();

  const currentAgent = AI_AGENTS[selectedAgent];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default model when models are available
  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      const localModel = availableModels.find(m => m.isLocal && m.status === 'ready');
      setSelectedModel(localModel?.id || availableModels[0]?.id || '');
    }
  }, [availableModels, selectedModel]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
      agentId: selectedAgent,
      context: {
        files: currentFile ? [currentFile] : Object.keys(files).slice(0, 5),
        selectedCode: selectedCode,
        operation: currentAgent.name,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      agentId: selectedAgent,
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await performAIInference(
        userMessage.content,
        currentAgent,
        userMessage.context,
        selectedModel
      );

      // Update loading message with response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      // Update loading message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, selectedAgent, currentAgent, selectedCode, currentFile, files, selectedModel]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/###\s+(.*?)$/gm, '<h3>$1</h3>')
      .replace(/##\s+(.*?)$/gm, '<h2>$1</h2>')
      .replace(/^-\s+(.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  };

  const getAgentColor = (agentId: AIAgentType) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return colors[AI_AGENTS[agentId].color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`ai-agents-chat flex flex-col ${className || ''}`} style={{ width, height }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-secondary">
        <div className="flex items-center space-x-3">
          <div className={`${currentAgent.icon} text-xl`} />
          <div>
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
              {currentAgent.name}
            </h2>
            <p className="text-sm text-bolt-elements-textSecondary">
              {currentAgent.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Model selector */}
          {availableModels.length > 0 && (
            <Dropdown
              trigger={
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <div className="i-ph:brain text-sm" />
                  <span className="text-xs">
                    {availableModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
                  </span>
                  <div className="i-ph:caret-down text-xs" />
                </Button>
              }
            >
              <div className="py-1 max-w-xs">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{model.name}</span>
                      <div className="flex items-center space-x-1 ml-2">
                        {model.isLocal && (
                          <Badge variant="outline" className="text-xs">Local</Badge>
                        )}
                        <Badge 
                          variant={model.status === 'ready' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {model.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {model.type} • {model.parameters}
                    </div>
                  </button>
                ))}
              </div>
            </Dropdown>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={clearChat}
            title="Clear chat"
          >
            <div className="i-ph:trash text-sm" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Agent selector sidebar */}
        <div className="w-64 border-r border-bolt-elements-borderColor bg-bolt-elements-bg-primary">
          <div className="p-3">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-3">
              AI Agents
            </h3>
            <div className="space-y-1">
              {Object.values(AI_AGENTS).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedAgent === agent.id
                      ? 'bg-bolt-elements-bg-tertiary border border-bolt-elements-focus'
                      : 'hover:bg-bolt-elements-bg-secondary'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${agent.icon} text-lg flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                        {agent.name}
                      </h4>
                      <p className="text-xs text-bolt-elements-textSecondary mt-1 line-clamp-2">
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.capabilities.slice(0, 2).map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className={`${currentAgent.icon} text-4xl text-bolt-elements-textSecondary mb-4`} />
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
                  Welcome to {currentAgent.name}
                </h3>
                <p className="text-sm text-bolt-elements-textSecondary mb-6 max-w-md mx-auto">
                  {currentAgent.description}. Try one of these examples to get started:
                </p>
                <div className="space-y-2 max-w-md mx-auto">
                  {currentAgent.examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="w-full text-left p-3 rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-bg-secondary transition-colors"
                    >
                      <span className="text-sm">{example}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-bolt-elements-focus text-white'
                          : 'bg-bolt-elements-bg-secondary'
                      }`}
                    >
                      {message.role === 'assistant' && message.agentId && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`${AI_AGENTS[message.agentId].icon} text-sm`} />
                          <Badge className={getAgentColor(message.agentId)}>
                            {AI_AGENTS[message.agentId].name}
                          </Badge>
                        </div>
                      )}
                      
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bolt-elements-focus"></div>
                          <span className="text-sm text-bolt-elements-textSecondary">
                            Thinking...
                          </span>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />
                      )}
                      
                      {message.error && (
                        <div className="mt-2 text-xs text-red-500">
                          Error: {message.error}
                        </div>
                      )}
                      
                      <div className="text-xs text-bolt-elements-textTertiary mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-bolt-elements-borderColor p-4">
            {selectedCode && (
              <div className="mb-3 p-2 bg-bolt-elements-bg-secondary rounded-lg">
                <div className="text-xs text-bolt-elements-textSecondary mb-1">
                  Selected code:
                </div>
                <pre className="text-xs text-bolt-elements-textPrimary bg-bolt-elements-bg-primary p-2 rounded border overflow-x-auto">
                  {selectedCode.slice(0, 200)}
                  {selectedCode.length > 200 && '...'}
                </pre>
              </div>
            )}

            <div className="flex space-x-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Ask ${currentAgent.name} anything...`}
                className="flex-1 min-h-[40px] max-h-32 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="self-end"
              >
                <div className="i-ph:paper-plane-right text-sm" />
              </Button>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-bolt-elements-textSecondary">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {availableModels.length > 0 && selectedModel && (
                <span>
                  Using: {availableModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentsChat;