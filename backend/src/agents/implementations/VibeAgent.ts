import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange } from '../../types';
import { getVibeSystemPrompt } from '../prompts';
import { config } from '../../config';

export class VibeAgent extends BaseAgent {
  private generatedCode: string = '';

  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'vibe',
      name: 'Vibe Agent',
      systemPrompt: '', // 톤에 따라 동적으로 설정
      temperature: config.agents.temperature.vibe,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    // 톤에 맞는 시스템 프롬프트 설정
    this.config.systemPrompt = getVibeSystemPrompt(input.tone);

    return `User Request: ${input.originalRequest}

Target Language: ${input.language}
Requested Tone: ${input.tone}

Generate the code following the specified tone and style.
Remember to output ONLY valid JSON format.`;
  }

  protected transformResponse(
    json: any,
    input: AgentInput
  ): {
    analysis: string;
    suggestions: Suggestion[];
    codeChanges: CodeChange[];
    metadata?: Record<string, any>;
  } {
    this.generatedCode = json.code || '';

    return {
      analysis: json.explanation || 'Code generated successfully.',
      suggestions: (json.potentialIssues || []).map((issue: string, index: number) => ({
        id: uuidv4(),
        type: 'style' as const,
        description: issue,
        priority: 'low' as const,
      })),
      codeChanges: [],
      metadata: {
        language: json.language || input.language,
        considerations: json.considerations || [],
        generatedCode: this.generatedCode,
      },
    };
  }

  getGeneratedCode(): string {
    return this.generatedCode;
  }
}
