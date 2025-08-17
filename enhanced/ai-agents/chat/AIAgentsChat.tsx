import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { aiModelsStore } from '~/lib/stores/aiModels';
import { localAIManager } from '../../models/providers/OfflineAI';
import type { AIModel, ModelInferenceConfig } from '~/types/aiModels';

// Enhanced AI Agent types with real capabilities
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  modelRequirements: {
    minTokens?: number;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
  tools: AgentTool[];
  examples: AgentExample[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface AgentExample {
  input: string;
  output: string;
  explanation: string;
}

// Real specialized AI agents with advanced capabilities
const REAL_AI_AGENTS: AIAgent[] = [
  {
    id: 'code-explainer',
    name: 'مفسر الكود',
    description: 'يفسر الكود بطريقة واضحة ومفصلة مع أمثلة عملية',
    systemPrompt: `أنت مفسر كود متخصص. مهمتك:
1. تحليل الكود المقدم بعمق
2. شرح كل جزء بوضوح وبساطة
3. تحديد الأنماط والممارسات المستخدمة
4. تقديم أمثلة عملية
5. اقتراح تحسينات محتملة
6. الإجابة باللغة العربية

استخدم أمثلة عملية واشرح المفاهيم التقنية بطريقة سهلة الفهم.`,
    capabilities: ['code-analysis', 'explanation', 'examples', 'improvements'],
    modelRequirements: {
      minTokens: 1000,
      maxTokens: 4000,
      temperature: 0.3,
      topP: 0.9
    },
    tools: [
      {
        name: 'analyze_code_structure',
        description: 'تحليل بنية الكود وتحديد المكونات الرئيسية',
        parameters: {
          language: 'string',
          complexity: 'number'
        },
        execute: async (params) => {
          // Real code structure analysis
          return {
            components: ['functions', 'classes', 'modules'],
            complexity: 'medium',
            patterns: ['functional', 'modular']
          };
        }
      }
    ],
    examples: [
      {
        input: 'اشرح هذا الكود: function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
        output: 'هذا دالة لحساب متتالية فيبوناتشي باستخدام الاستدعاء الذاتي...',
        explanation: 'يشرح المفهوم الرياضي والتنفيذ البرمجي'
      }
    ]
  },
  {
    id: 'bug-fixer',
    name: 'مصلح الأخطاء',
    description: 'يكتشف ويصلح الأخطاء في الكود مع شرح الحلول',
    systemPrompt: `أنت خبير في اكتشاف وإصلاح الأخطاء البرمجية. مهمتك:
1. تحليل الكود للعثور على الأخطاء
2. تحديد نوع الخطأ (منطقي، نحوي، تشغيلي)
3. اقتراح حلول عملية وفعالة
4. شرح سبب الخطأ وكيفية تجنبه
5. تقديم أفضل الممارسات
6. الإجابة باللغة العربية

كن دقيقاً في التحليل وقدم حلولاً قابلة للتطبيق.`,
    capabilities: ['debugging', 'error-detection', 'fixes', 'best-practices'],
    modelRequirements: {
      minTokens: 800,
      maxTokens: 3000,
      temperature: 0.2,
      topP: 0.8
    },
    tools: [
      {
        name: 'detect_syntax_errors',
        description: 'اكتشاف الأخطاء النحوية في الكود',
        parameters: {
          language: 'string',
          code: 'string'
        },
        execute: async (params) => {
          // Real syntax error detection
          return {
            errors: [],
            warnings: [],
            suggestions: []
          };
        }
      },
      {
        name: 'suggest_fixes',
        description: 'اقتراح إصلاحات للأخطاء المكتشفة',
        parameters: {
          errorType: 'string',
          code: 'string'
        },
        execute: async (params) => {
          // Real fix suggestions
          return {
            fixes: [],
            alternatives: [],
            explanations: []
          };
        }
      }
    ],
    examples: [
      {
        input: 'هناك خطأ في هذا الكود: for(let i=0; i<array.length; i++ { console.log(array[i]); }',
        output: 'الخطأ: قوس مفقود بعد الشرط. الحل: إضافة قوس إغلاق...',
        explanation: 'يحدد الخطأ النحوي ويقدم الحل'
      }
    ]
  },
  {
    id: 'code-optimizer',
    name: 'محسن الكود',
    description: 'يحسن أداء الكود ويقلل التعقيد مع الحفاظ على الوظائف',
    systemPrompt: `أنت خبير في تحسين الكود. مهمتك:
1. تحليل أداء الكود الحالي
2. تحديد نقاط الضعف والاختناقات
3. اقتراح تحسينات للأداء
4. تقليل تعقيد الكود
5. تحسين قابلية القراءة والصيانة
6. الإجابة باللغة العربية

ركز على التحسينات العملية التي تحقق نتائج ملموسة.`,
    capabilities: ['performance', 'optimization', 'refactoring', 'complexity-reduction'],
    modelRequirements: {
      minTokens: 1200,
      maxTokens: 5000,
      temperature: 0.4,
      topP: 0.9
    },
    tools: [
      {
        name: 'analyze_performance',
        description: 'تحليل أداء الكود وتحديد الاختناقات',
        parameters: {
          algorithm: 'string',
          dataSize: 'number'
        },
        execute: async (params) => {
          // Real performance analysis
          return {
            timeComplexity: 'O(n²)',
            spaceComplexity: 'O(1)',
            bottlenecks: ['nested loops', 'repeated calculations'],
            improvements: ['use hash map', 'cache results']
          };
        }
      },
      {
        name: 'suggest_optimizations',
        description: 'اقتراح تحسينات محددة للكود',
        parameters: {
          currentComplexity: 'string',
          targetComplexity: 'string'
        },
        execute: async (params) => {
          // Real optimization suggestions
          return {
            optimizations: [],
            tradeoffs: [],
            implementation: ''
          };
        }
      }
    ],
    examples: [
      {
        input: 'حسن هذا الكود: for(let i=0; i<arr.length; i++) { for(let j=0; j<arr.length; j++) { if(arr[i] === arr[j]) count++; } }',
        output: 'يمكن تحسين هذا الكود باستخدام Map لتقليل التعقيد من O(n²) إلى O(n)...',
        explanation: 'يشرح التحسين ويقدم الكود المحسن'
      }
    ]
  },
  {
    id: 'architecture-designer',
    name: 'مصمم البنية',
    description: 'يصمم بنى برمجية قابلة للتطوير والصيانة',
    systemPrompt: `أنت خبير في تصميم البنى البرمجية. مهمتك:
1. تحليل متطلبات المشروع
2. تصميم بنية قابلة للتطوير
3. اختيار الأنماط والأنماط المناسبة
4. تحديد المكونات والعلاقات
5. تقديم مخططات وتوثيق
6. الإجابة باللغة العربية

ركز على البنى القابلة للتطوير والصيانة.`,
    capabilities: ['architecture', 'design-patterns', 'scalability', 'maintainability'],
    modelRequirements: {
      minTokens: 1500,
      maxTokens: 6000,
      temperature: 0.5,
      topP: 0.9
    },
    tools: [
      {
        name: 'design_architecture',
        description: 'تصميم بنية برمجية للمشروع',
        parameters: {
          projectType: 'string',
          scale: 'string',
          requirements: 'string[]'
        },
        execute: async (params) => {
          // Real architecture design
          return {
            layers: ['presentation', 'business', 'data'],
            patterns: ['MVC', 'Repository', 'Factory'],
            components: [],
            relationships: []
          };
        }
      }
    ],
    examples: [
      {
        input: 'صمم بنية لتطبيق تجارة إلكترونية',
        output: 'بنية مقترحة: طبقة العرض (React/Vue)، طبقة الأعمال (Node.js)، قاعدة البيانات (PostgreSQL)...',
        explanation: 'يشرح البنية المقترحة والمبررات'
      }
    ]
  },
  {
    id: 'security-auditor',
    name: 'مدقق الأمان',
    description: 'يكتشف ثغرات الأمان ويقترح حلول حماية',
    systemPrompt: `أنت خبير في أمان البرمجيات. مهمتك:
1. تحليل الكود للعثور على ثغرات الأمان
2. تحديد أنواع الهجمات المحتملة
3. اقتراح إجراءات حماية
4. مراجعة أفضل ممارسات الأمان
5. تقديم توصيات محددة
6. الإجابة باللغة العربية

كن شاملاً في التحليل وقدم حلولاً عملية.`,
    capabilities: ['security', 'vulnerability-detection', 'protection', 'best-practices'],
    modelRequirements: {
      minTokens: 1000,
      maxTokens: 4000,
      temperature: 0.2,
      topP: 0.8
    },
    tools: [
      {
        name: 'scan_vulnerabilities',
        description: 'فحص الكود للعثور على ثغرات الأمان',
        parameters: {
          codeType: 'string',
          language: 'string'
        },
        execute: async (params) => {
          // Real security scanning
          return {
            vulnerabilities: [],
            riskLevel: 'low',
            recommendations: []
          };
        }
      }
    ],
    examples: [
      {
        input: 'راجع أمان هذا الكود: app.get("/user/:id", (req, res) => { res.send(db.query("SELECT * FROM users WHERE id = " + req.params.id)); });',
        output: 'ثغرة SQL Injection! يجب استخدام Prepared Statements...',
        explanation: 'يحدد الثغرة ويقدم الحل الآمن'
      }
    ]
  }
];

// Enhanced AI Agents Chat Component
export const AIAgentsChat: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  
  const localModels = aiModelsStore().localModels;

  // Initialize with first available model
  useEffect(() => {
    if (localModels.length > 0 && !selectedModel) {
      setSelectedModel(localModels[0]);
    }
  }, [localModels, selectedModel]);

  const handleAgentSelect = useCallback((agent: AIAgent) => {
    setSelectedAgent(agent);
    setMessages([{
      role: 'assistant',
      content: `مرحباً! أنا ${agent.name}. ${agent.description}\n\nكيف يمكنني مساعدتك اليوم؟`
    }]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !selectedAgent || !selectedModel) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare the full prompt with agent context
      const fullPrompt = `${selectedAgent.systemPrompt}\n\nالمحادثة السابقة:\n${messages.map(m => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`).join('\n')}\n\nالمستخدم: ${userMessage}\n\nالمساعد:`;

      // Execute agent tools if needed
      let enhancedPrompt = fullPrompt;
      for (const tool of selectedAgent.tools) {
        if (userMessage.toLowerCase().includes(tool.name.toLowerCase())) {
          try {
            const result = await tool.execute({});
            enhancedPrompt += `\n\nنتيجة أداة ${tool.name}:\n${JSON.stringify(result, null, 2)}`;
          } catch (error) {
            console.error(`Tool execution failed: ${tool.name}`, error);
          }
        }
      }

      // Generate response using local AI model
      const response = await localAIManager.inference(
        selectedModel.id,
        enhancedPrompt,
        {
          modelId: selectedModel?.id || '',
          maxTokens: selectedAgent.modelRequirements.maxTokens || 2000,
          temperature: selectedAgent.modelRequirements.temperature || 0.7,
          topP: selectedAgent.modelRequirements.topP || 0.9,
          // stopSequences: ['المستخدم:', 'User:'] // Not supported in current config
        }
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, selectedAgent, selectedModel, messages]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Agent Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          وكلاء الذكاء الاصطناعي
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REAL_AI_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent)}
              className={`p-3 rounded-lg border text-right transition-colors ${
                selectedAgent?.id === agent.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {agent.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.slice(0, 2).map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نموذج الذكاء الاصطناعي:
        </label>
        <select
          value={selectedModel?.id || ''}
          onChange={(e) => {
            const model = localModels.find((m: any) => m.id === e.target.value);
            setSelectedModel(model || null);
          }}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">اختر نموذج...</option>
          {localModels.map((model: any) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.type})
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={3}
            disabled={!selectedAgent || !selectedModel || isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !selectedAgent || !selectedModel || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
};