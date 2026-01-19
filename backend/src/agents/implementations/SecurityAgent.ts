import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentInput } from '../base/BaseAgent';
import { LLMService } from '../../services/llm/LLMService';
import { Suggestion, CodeChange, SuggestionType } from '../../types';
import { SECURITY_SYSTEM_PROMPT } from '../prompts';
import { config } from '../../config';

export class SecurityAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    const agentConfig: AgentConfig = {
      type: 'security',
      name: 'Security Agent',
      systemPrompt: SECURITY_SYSTEM_PROMPT,
      temperature: config.agents.temperature.security,
    };
    super(agentConfig, llmService);
  }

  protected buildPrompt(input: AgentInput): string {
    return `다음 코드의 보안 취약점을 분석하세요:

\`\`\`${input.language}
${input.currentCode}
\`\`\`

원본 요청: ${input.originalRequest}

중점 분석 사항:
- 입력 검증
- 인젝션 취약점
- XSS 위험
- 인증/인가 문제
- 데이터 노출

중요: 발견된 모든 취약점에 대해 반드시 구체적인 코드 수정을 fix 필드에 포함해야 합니다.
oldCode에 취약한 코드를, newCode에 안전한 코드를 작성하세요.

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

    const vulnerabilities = json.vulnerabilities || [];

    for (const vuln of vulnerabilities) {
      const suggestionId = uuidv4();
      const type = this.mapVulnType(vuln.type);

      const suggestion: Suggestion = {
        id: suggestionId,
        type,
        description: `[${vuln.category?.toUpperCase() || 'SECURITY'}] ${vuln.description}`,
        targetLines: vuln.line ? { start: vuln.line, end: vuln.line } : undefined,
        priority: this.mapSeverityToPriority(vuln.severity),
      };

      if (vuln.fix) {
        const codeChange: CodeChange = {
          id: uuidv4(),
          type: vuln.fix.action || 'replace',
          startLine: vuln.line || 1,
          endLine: vuln.line || 1,
          oldCode: vuln.fix.oldCode,
          newCode: vuln.fix.newCode,
          reason: `Security fix: ${vuln.description}. Impact if not fixed: ${vuln.impact || 'potential security breach'}`,
          agent: 'security',
        };
        suggestion.codeChange = codeChange;
        codeChanges.push(codeChange);
      }

      suggestions.push(suggestion);
    }

    return {
      analysis: json.analysis || 'Security analysis complete.',
      suggestions,
      codeChanges,
      metadata: {
        riskLevel: json.riskLevel || 'low',
        securePatterns: json.securePatterns || [],
        severity: json.riskLevel,
      },
    };
  }

  private mapVulnType(type: string): SuggestionType {
    const typeMap: Record<string, SuggestionType> = {
      security: 'security',
      input_validation: 'input_validation',
    };
    return typeMap[type] || 'security';
  }

  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' {
    if (severity === 'critical' || severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }
}
