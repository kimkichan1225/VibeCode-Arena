import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange, SuggestionType } from '../../types';
import { VALIDATOR_SYSTEM_PROMPT } from '../prompts';
import { config } from '../../config';

export class ValidatorAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'validator',
      name: 'Validator Agent',
      systemPrompt: VALIDATOR_SYSTEM_PROMPT,
      temperature: config.agents.temperature.validator,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    return `다음 코드에서 버그, 오류, 논리적 결함을 분석하세요:

\`\`\`${input.language}
${input.currentCode}
\`\`\`

원본 요청: ${input.originalRequest}
톤: ${input.tone}

중요: 발견한 모든 문제에 대해 반드시 구체적인 코드 수정을 suggestion 필드에 포함해야 합니다.
oldCode에는 현재 문제가 있는 코드를, newCode에는 수정된 코드를 작성하세요.

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

    const issues = json.issues || [];

    for (const issue of issues) {
      const suggestionId = uuidv4();
      const type = this.mapIssueType(issue.type);

      const suggestion: Suggestion = {
        id: suggestionId,
        type,
        description: issue.description,
        targetLines: issue.line ? { start: issue.line, end: issue.line } : undefined,
        priority: this.mapSeverityToPriority(issue.severity),
      };

      if (issue.suggestion) {
        const codeChange: CodeChange = {
          id: uuidv4(),
          type: issue.suggestion.action || 'replace',
          startLine: issue.line || 1,
          endLine: issue.line || 1,
          oldCode: issue.suggestion.oldCode,
          newCode: issue.suggestion.newCode,
          reason: issue.description,
          agent: 'validator',
        };
        suggestion.codeChange = codeChange;
        codeChanges.push(codeChange);
      }

      suggestions.push(suggestion);
    }

    return {
      analysis: json.analysis || 'Validation complete.',
      suggestions,
      codeChanges,
      metadata: {
        passedChecks: json.passedChecks || [],
        severity: this.getOverallSeverity(issues),
      },
    };
  }

  private mapIssueType(type: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      bug_fix: 'bug_fix',
      error_handling: 'error_handling',
      type_safety: 'type_safety',
      logic_flaw: 'bug_fix',
    };
    return typeMap[type] || 'bug_fix';
  }

  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' {
    if (severity === 'critical' || severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  private getOverallSeverity(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.some((i) => i.severity === 'critical')) return 'critical';
    if (issues.some((i) => i.severity === 'high')) return 'high';
    if (issues.some((i) => i.severity === 'medium')) return 'medium';
    return 'low';
  }
}
