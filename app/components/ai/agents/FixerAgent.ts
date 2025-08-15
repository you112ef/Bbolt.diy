import type { Agent, AgentContext, AgentResponse } from './types';
import LocalAIEngine from '../engines/LocalAIEngine';

const systemPrompt = `You are a Code Fixer AI assistant. Your expertise is in identifying, diagnosing, and fixing bugs, errors, and issues in code. You provide practical solutions with working code examples.

Guidelines:
- Identify the root cause of problems
- Provide specific, actionable fixes
- Explain why the issue occurred
- Include working code examples
- Consider edge cases and potential side effects
- Suggest preventive measures
- Focus on reliable, maintainable solutions

Always structure your responses with:
1. Problem Identification
2. Root Cause Analysis
3. Solution with Code
4. Explanation
5. Prevention Tips`;

export class FixerAgent implements Agent {
  type = 'fixer' as const;
  name = 'Code Fixer';
  description = 'Identifies and fixes bugs, errors, and code issues';
  icon = 'i-ph:wrench';
  systemPrompt = systemPrompt;
  
  private aiEngine: LocalAIEngine;

  constructor(aiEngine: LocalAIEngine) {
    this.aiEngine = aiEngine;
  }

  async process(input: string, context?: AgentContext): Promise<AgentResponse> {
    let enhancedPrompt = input;

    if (context?.errorMessage) {
      enhancedPrompt = `I'm getting this error: ${context.errorMessage}

${input ? `Additional details: ${input}` : ''}`;
    }

    if (context?.selectedCode) {
      enhancedPrompt += `\n\nProblematic code:
\`\`\`${context.language || 'javascript'}
${context.selectedCode}
\`\`\``;
    }

    if (context?.selectedFile && context?.codebase) {
      const fileContent = context.codebase[context.selectedFile];
      if (fileContent) {
        enhancedPrompt += `\n\nFull file context (${context.selectedFile}):\n\`\`\`${context.language || 'javascript'}\n${fileContent}\n\`\`\``;
      }
    }

    const response = await this.aiEngine.generate(enhancedPrompt, this.systemPrompt);

    return {
      ...response,
      suggestions: [
        'Fix runtime errors',
        'Resolve type issues',
        'Handle edge cases',
        'Fix memory leaks',
        'Resolve async issues',
        'Fix security vulnerabilities',
      ],
    };
  }
}

export default FixerAgent;