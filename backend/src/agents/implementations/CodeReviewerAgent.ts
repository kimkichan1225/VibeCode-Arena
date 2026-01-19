import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange, SuggestionType } from '../../types';
import { config } from '../../config';

// 통합 Code Reviewer 시스템 프롬프트
const CODE_REVIEWER_SYSTEM_PROMPT = `당신은 VibeCode Arena의 통합 Code Reviewer입니다.
하나의 응답으로 코드의 모든 측면을 분석합니다:

1. **검증 (Validation)**: 버그, 오류, 논리적 결함
2. **최적화 (Optimization)**: 성능, 구조 개선
3. **보안 (Security)**: 취약점, 입력 검증
4. **UX/바이브 (Readability)**: 가독성, 네이밍, 톤 일치도

모든 응답은 반드시 한국어로 작성하세요.

출력 형식 (반드시 JSON만 출력):
{
  "summary": "전체 코드 품질 요약 (한국어)",
  "vibeScore": 8,
  "issues": [
    {
      "category": "validation|optimization|security|readability",
      "severity": "critical|high|medium|low",
      "line": 10,
      "description": "문제 설명 (한국어)",
      "fix": {
        "action": "replace|insert|delete",
        "oldCode": "원본 코드",
        "newCode": "수정된 코드"
      }
    }
  ],
  "strengths": ["코드의 장점들 (한국어)"]
}`;

export class CodeReviewerAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'reviewer' as any,
      name: 'Code Reviewer',
      systemPrompt: CODE_REVIEWER_SYSTEM_PROMPT,
      temperature: 0.3,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    const toneDescriptions: Record<string, string> = {
      clean: '깔끔하고 읽기 쉬운',
      fast: '빠르고 효율적인',
      fancy: '모던하고 세련된',
      hardcore: '극한의 최적화된',
    };

    return `다음 코드를 종합적으로 리뷰하세요:

\`\`\`${input.language}
${input.currentCode}
\`\`\`

원본 요청: ${input.originalRequest}
요청된 톤: ${input.tone} (${toneDescriptions[input.tone] || input.tone})

다음 관점에서 분석하세요:
1. 버그/오류가 있는가?
2. 성능을 개선할 수 있는가?
3. 보안 취약점이 있는가?
4. 가독성과 바이브가 요청과 일치하는가?

중요: 발견한 모든 문제에 반드시 구체적인 코드 수정(fix)을 포함하세요.
문제가 없으면 issues를 빈 배열로 반환하세요.

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
      const type = this.mapCategoryToType(issue.category);

      const suggestion: Suggestion = {
        id: suggestionId,
        type,
        description: `[${this.getCategoryLabel(issue.category)}] ${issue.description}`,
        targetLines: issue.line ? { start: issue.line, end: issue.line } : undefined,
        priority: this.mapSeverityToPriority(issue.severity),
      };

      if (issue.fix && issue.fix.newCode) {
        const codeChange: CodeChange = {
          id: uuidv4(),
          type: issue.fix.action || 'replace',
          startLine: issue.line || 1,
          endLine: issue.line || 1,
          oldCode: issue.fix.oldCode,
          newCode: issue.fix.newCode,
          reason: issue.description,
          agent: 'reviewer' as any,
        };
        suggestion.codeChange = codeChange;
        codeChanges.push(codeChange);
      }

      suggestions.push(suggestion);
    }

    const vibeScore = typeof json.vibeScore === 'number' ? json.vibeScore : 7;

    return {
      analysis: json.summary || '코드 리뷰 완료',
      suggestions,
      codeChanges,
      metadata: {
        vibeScore,
        strengths: json.strengths || [],
        issueCount: issues.length,
      },
    };
  }

  private mapCategoryToType(category: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      validation: 'bug_fix',
      optimization: 'performance',
      security: 'security',
      readability: 'readability',
    };
    return typeMap[category] || 'bug_fix';
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      validation: '검증',
      optimization: '최적화',
      security: '보안',
      readability: '가독성',
    };
    return labels[category] || category;
  }

  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' {
    if (severity === 'critical' || severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }
}
