import type { Agent, AgentContext, AgentResponse } from './types';
import LocalAIEngine from '../engines/LocalAIEngine';

const systemPrompt = `You are a Test Generator AI assistant. Your expertise is in creating comprehensive, effective test suites including unit tests, integration tests, and end-to-end tests.

Guidelines:
- Generate tests that cover all important scenarios
- Include edge cases and error conditions
- Use appropriate testing frameworks and patterns
- Write clear, descriptive test names
- Provide good test coverage recommendations
- Include both positive and negative test cases
- Focus on critical business logic
- Make tests maintainable and readable

Always structure your responses with:
1. Test Strategy Overview
2. Unit Tests
3. Integration Tests (if applicable)
4. Edge Cases and Error Scenarios
5. Test Coverage Recommendations`;

export class TesterAgent implements Agent {
  type = 'tester' as const;
  name = 'Test Generator';
  description = 'Generates comprehensive test suites and testing strategies';
  icon = 'i-ph:test-tube';
  systemPrompt = systemPrompt;
  
  private aiEngine: LocalAIEngine;

  constructor(aiEngine: LocalAIEngine) {
    this.aiEngine = aiEngine;
  }

  async process(input: string, context?: AgentContext): Promise<AgentResponse> {
    let enhancedPrompt = input;

    if (context?.selectedCode) {
      enhancedPrompt = `Please generate comprehensive tests for this code:

\`\`\`${context.language || 'javascript'}
${context.selectedCode}
\`\`\`

${input ? `Test requirements: ${input}` : ''}`;
    }

    if (context?.frameworks && context.frameworks.length > 0) {
      enhancedPrompt += `\n\nTesting frameworks available: ${context.frameworks.join(', ')}`;
    }

    if (context?.selectedFile && context?.codebase) {
      const fileContent = context.codebase[context.selectedFile];
      if (fileContent) {
        enhancedPrompt += `\n\nFile to test (${context.selectedFile}):\n\`\`\`${context.language || 'javascript'}\n${fileContent}\n\`\`\``;
      }
    }

    const response = await this.aiEngine.generate(enhancedPrompt, this.systemPrompt);

    return {
      ...response,
      suggestions: [
        'Generate unit tests',
        'Create integration tests',
        'Add E2E test scenarios',
        'Test error handling',
        'Add performance tests',
        'Create mock objects',
        'Test edge cases',
      ],
    };
  }
}

export default TesterAgent;