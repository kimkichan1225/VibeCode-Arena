import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange, SuggestionType } from '../../types';
import { OPTIMIZER_SYSTEM_PROMPT } from '../prompts';
import { config } from '../../config';

export class OptimizerAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'optimizer',
      name: 'Optimizer Agent',
      systemPrompt: OPTIMIZER_SYSTEM_PROMPT,
      temperature: config.agents.temperature.optimizer,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    return `다음 코드의 성능과 구조를 분석하세요:

\`\`\`${input.language}
${input.currentCode}
\`\`\`

원본 요청: ${input.originalRequest}
톤: ${input.tone}

참고: 톤이 "clean"이면 성능보다 가독성을 우선시하세요.
톤이 "fast"나 "hardcore"면 적극적인 최적화가 허용됩니다.

중요: 모든 개선 사항에 반드시 구체적인 코드 수정을 suggestion 필드에 포함해야 합니다.
targetLines에 수정할 라인 범위를, oldCode에 원본 코드를, newCode에 최적화된 코드를 작성하세요.

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

    const improvements = json.improvements || [];

    for (const improvement of improvements) {
      const suggestionId = uuidv4();
      const type = this.mapImprovementType(improvement.type);

      const suggestion: Suggestion = {
        id: suggestionId,
        type,
        description: improvement.description,
        targetLines: improvement.suggestion?.targetLines,
        priority: improvement.priority || 'medium',
      };

      if (improvement.suggestion) {
        const codeChange: CodeChange = {
          id: uuidv4(),
          type: improvement.suggestion.action || 'replace',
          startLine: improvement.suggestion.targetLines?.start || 1,
          endLine: improvement.suggestion.targetLines?.end || 1,
          oldCode: improvement.suggestion.oldCode,
          newCode: improvement.suggestion.newCode,
          reason: `${improvement.description} - Impact: ${improvement.impact || 'improved performance'}`,
          agent: 'optimizer',
        };
        suggestion.codeChange = codeChange;
        codeChanges.push(codeChange);
      }

      suggestions.push(suggestion);
    }

    return {
      analysis: json.analysis || 'Optimization analysis complete.',
      suggestions,
      codeChanges,
      metadata: {
        alreadyOptimized: json.alreadyOptimized || [],
      },
    };
  }

  private mapImprovementType(type: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      performance: 'performance',
      refactoring: 'refactoring',
      redundancy: 'refactoring',
    };
    return typeMap[type] || 'performance';
  }
}
