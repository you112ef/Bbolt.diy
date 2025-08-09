import type { Agent, AgentContext, AgentResponse } from './types';
import LocalAIEngine from '../engines/LocalAIEngine';

const systemPrompt = `You are a Code Explainer AI assistant. Your role is to analyze code and provide clear, comprehensive explanations that help developers understand what the code does, how it works, and why it's structured that way.

Guidelines:
- Break down complex code into digestible parts
- Explain the purpose and functionality clearly
- Identify design patterns and architectural decisions
- Highlight important concepts and best practices
- Use examples and analogies when helpful
- Be concise but thorough
- Focus on education and understanding

Always structure your responses with:
1. Overview/Purpose
2. Key Components
3. How it Works
4. Important Notes
5. Related Concepts (if applicable)`;

export class ExplainerAgent implements Agent {
  type = 'explainer' as const;
  name = 'Code Explainer';
  description = 'Analyzes and explains code functionality, patterns, and architecture';
  icon = 'i-ph:book-open-text';
  systemPrompt = systemPrompt;
  
  private aiEngine: LocalAIEngine;

  constructor(aiEngine: LocalAIEngine) {
    this.aiEngine = aiEngine;
  }

  async process(input: string, context?: AgentContext): Promise<AgentResponse> {
    let enhancedPrompt = input;

    if (context?.selectedCode) {
      enhancedPrompt = `Please explain this code:

\`\`\`${context.language || 'javascript'}
${context.selectedCode}
\`\`\`

${input ? `Additional context: ${input}` : ''}`;
    }

    if (context?.selectedFile && context?.codebase) {
      const fileContent = context.codebase[context.selectedFile];
      if (fileContent) {
        enhancedPrompt += `\n\nFile: ${context.selectedFile}\n\`\`\`${context.language || 'javascript'}\n${fileContent}\n\`\`\``;
      }
    }

    const response = await this.aiEngine.generate(enhancedPrompt, this.systemPrompt);

    return {
      ...response,
      suggestions: [
        'Explain specific function/component',
        'Break down complex logic',
        'Identify design patterns',
        'Show usage examples',
        'Explain performance implications',
      ],
    };
  }
}

export default ExplainerAgent;