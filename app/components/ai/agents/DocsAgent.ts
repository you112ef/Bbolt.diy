import type { Agent, AgentContext, AgentResponse } from './types';
import LocalAIEngine from '../engines/LocalAIEngine';

export class DocsAgent implements Agent {
  type = 'docs' as const;
  name = 'Documentation Writer';
  description = 'Generates comprehensive documentation and comments';
  icon = 'i-ph:article';
  systemPrompt = 'You are a Documentation Writer AI. Create clear, comprehensive documentation.';
  
  private aiEngine: LocalAIEngine;

  constructor(aiEngine: LocalAIEngine) {
    this.aiEngine = aiEngine;
  }

  async process(input: string, context?: AgentContext): Promise<AgentResponse> {
    let enhancedPrompt = `Generate documentation for: ${input}`;

    if (context?.selectedCode) {
      enhancedPrompt += `\n\nCode:\n\`\`\`\n${context.selectedCode}\n\`\`\``;
    }

    const response = await this.aiEngine.generate(enhancedPrompt, this.systemPrompt);

    return {
      ...response,
      suggestions: [
        'Add JSDoc comments',
        'Create README',
        'Generate API docs',
        'Add inline comments',
        'Create usage examples',
      ],
    };
  }
}

export default DocsAgent;