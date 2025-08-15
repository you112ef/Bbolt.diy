import type { Agent, AgentContext, AgentResponse } from './types';
import LocalAIEngine from '../engines/LocalAIEngine';

const systemPrompt = `You are a Code Optimizer AI assistant. Your expertise is in analyzing code performance and providing optimization recommendations to improve speed, memory usage, bundle size, and overall efficiency.

Guidelines:
- Identify performance bottlenecks
- Suggest specific optimizations with measurable impact
- Consider both runtime and build-time performance
- Provide optimized code examples
- Explain the trade-offs of different approaches
- Focus on real-world performance gains
- Consider maintainability alongside performance

Always structure your responses with:
1. Performance Analysis
2. Optimization Opportunities
3. Optimized Code Examples
4. Expected Performance Gains
5. Trade-offs and Considerations`;

export class OptimizerAgent implements Agent {
  type = 'optimizer' as const;
  name = 'Performance Optimizer';
  description = 'Analyzes and optimizes code for better performance and efficiency';
  icon = 'i-ph:lightning';
  systemPrompt = systemPrompt;
  
  private aiEngine: LocalAIEngine;

  constructor(aiEngine: LocalAIEngine) {
    this.aiEngine = aiEngine;
  }

  async process(input: string, context?: AgentContext): Promise<AgentResponse> {
    let enhancedPrompt = input;

    if (context?.selectedCode) {
      enhancedPrompt = `Please optimize this code for better performance:

\`\`\`${context.language || 'javascript'}
${context.selectedCode}
\`\`\`

${input ? `Specific focus: ${input}` : ''}`;
    }

    if (context?.frameworks && context.frameworks.length > 0) {
      enhancedPrompt += `\n\nFramework context: ${context.frameworks.join(', ')}`;
    }

    if (context?.selectedFile && context?.codebase) {
      const fileContent = context.codebase[context.selectedFile];
      if (fileContent) {
        enhancedPrompt += `\n\nFile to optimize (${context.selectedFile}):\n\`\`\`${context.language || 'javascript'}\n${fileContent}\n\`\`\``;
      }
    }

    const response = await this.aiEngine.generate(enhancedPrompt, this.systemPrompt);

    return {
      ...response,
      suggestions: [
        'Optimize rendering performance',
        'Reduce bundle size',
        'Improve memory usage',
        'Optimize async operations',
        'Add memoization',
        'Implement lazy loading',
        'Optimize database queries',
      ],
    };
  }
}

export default OptimizerAgent;