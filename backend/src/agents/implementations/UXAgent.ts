import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange, SuggestionType } from '../../types';
import { UX_SYSTEM_PROMPT } from '../prompts';
import { config } from '../../config';

export class UXAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'ux',
      name: 'UX Agent',
      systemPrompt: UX_SYSTEM_PROMPT,
      temperature: config.agents.temperature.ux,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    return `다음 코드의 가독성과 "바이브" 일치도를 평가하세요:

\`\`\`${input.language}
${input.currentCode}
\`\`\`

원본 요청: ${input.originalRequest}
요청된 톤: ${input.tone}

톤 설명:
- clean: 읽기 쉽고, 명확하고, 표준 패턴
- fast: 효율적이고, 최소화된, 성능 중심
- fancy: 모던하고, 세련된, 최신 패턴
- hardcore: 고급스럽고, 복잡한, 전문가 수준

코드가 "${input.tone}" 바이브와 얼마나 잘 맞는지 평가하세요.

중요: 가독성이나 네이밍 개선이 필요한 경우, 반드시 구체적인 코드 수정을 suggestion 필드에 포함해야 합니다.
oldCode에 현재 코드를, newCode에 개선된 코드를 작성하세요.

반드시 JSON 형식으로만 출력하세요.`;
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
    const suggestions: Suggestion[] = [];
    const codeChanges: CodeChange[] = [];

    const feedback = json.feedback || [];

    for (const item of feedback) {
      const suggestionId = uuidv4();
      const type = this.mapFeedbackType(item.category);

      const suggestion: Suggestion = {
        id: suggestionId,
        type,
        description: item.description,
        priority: item.severity || 'medium',
      };

      if (item.suggestion) {
        const codeChange: CodeChange = {
          id: uuidv4(),
          type: item.suggestion.action || 'replace',
          startLine: 1,
          endLine: 1,
          oldCode: item.suggestion.oldCode,
          newCode: item.suggestion.newCode,
          reason: `UX improvement: ${item.description}`,
          agent: 'ux',
        };
        suggestion.codeChange = codeChange;
        codeChanges.push(codeChange);
      }

      suggestions.push(suggestion);
    }

    const vibeScore = typeof json.vibeScore === 'number' ? json.vibeScore : 7;

    return {
      analysis: `${json.analysis || 'UX analysis complete.'}\n\nVibe Match: ${json.vibeMatch || 'Good match with requested tone.'}`,
      suggestions,
      codeChanges,
      metadata: {
        vibeScore,
        strengths: json.strengths || [],
      },
    };
  }

  private mapFeedbackType(category: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      readability: 'readability',
      naming: 'naming',
      structure: 'refactoring',
      vibe: 'style',
    };
    return typeMap[category] || 'readability';
  }
}
