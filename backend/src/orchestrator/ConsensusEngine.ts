import { v4 as uuidv4 } from 'uuid';
import {
  AgentType,
  AgentOutput,
  Suggestion,
  CodeChange,
  ConsensusResult,
  AcceptedChange,
  RejectedChange,
} from '../types';
import { config } from '../config';

// 에이전트별 제안 유형에 대한 가중치
const AGENT_WEIGHTS: Record<AgentType, Record<string, number>> = {
  vibe: {
    style: 1.0,
    readability: 0.8,
    naming: 0.7,
  },
  reviewer: {
    // 통합 리뷰어 - 모든 유형에 균형 잡힌 가중치
    bug_fix: 1.5,
    error_handling: 1.3,
    type_safety: 1.2,
    performance: 1.3,
    security: 1.5,
    input_validation: 1.4,
    readability: 1.3,
    naming: 1.2,
    refactoring: 1.2,
    style: 1.0,
  },
  // 레거시 에이전트 (하위 호환성)
  validator: {
    bug_fix: 1.5,
    error_handling: 1.3,
    type_safety: 1.2,
    performance: 0.8,
    style: 0.5,
  },
  optimizer: {
    performance: 1.5,
    refactoring: 1.3,
    bug_fix: 0.8,
    style: 0.6,
  },
  security: {
    security: 1.5,
    input_validation: 1.4,
    error_handling: 1.2,
    performance: 0.5,
  },
  ux: {
    readability: 1.5,
    naming: 1.3,
    style: 1.2,
    performance: 0.4,
  },
};

export class ConsensusEngine {
  private threshold: number;

  constructor(threshold?: number) {
    this.threshold = threshold ?? config.orchestrator.consensusThreshold;
  }

  buildConsensus(
    outputs: AgentOutput[],
    discussionHistory?: string
  ): ConsensusResult {
    // 모든 제안 수집
    const allSuggestions = this.collectSuggestions(outputs);
    const acceptedChanges: AcceptedChange[] = [];
    const rejectedChanges: RejectedChange[] = [];

    for (const suggestion of allSuggestions) {
      const evaluation = this.evaluateSuggestion(suggestion, outputs);

      if (evaluation.score >= this.threshold && suggestion.codeChange) {
        acceptedChanges.push({
          change: suggestion.codeChange,
          supporters: evaluation.supporters,
          score: evaluation.score,
        });
      } else if (evaluation.score < this.threshold) {
        rejectedChanges.push({
          suggestion,
          reason: evaluation.reason,
          score: evaluation.score,
        });
      }
    }

    // 충돌하는 변경 해결
    const resolvedChanges = this.resolveConflicts(acceptedChanges);

    // 바이브 점수 가져오기 (reviewer 또는 ux에서)
    const reviewOutput = outputs.find((o) => o.agent === 'reviewer' || o.agent === 'ux');
    const vibeScore = reviewOutput?.metadata?.vibeScore ?? 7;

    return {
      accepted: resolvedChanges,
      rejected: rejectedChanges,
      vibeScore,
      summary: this.generateSummary(resolvedChanges, rejectedChanges),
    };
  }

  private collectSuggestions(outputs: AgentOutput[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    for (const output of outputs) {
      for (const suggestion of output.suggestions) {
        suggestions.push({
          ...suggestion,
          id: suggestion.id || uuidv4(),
        });
      }
    }

    return suggestions;
  }

  private evaluateSuggestion(
    suggestion: Suggestion,
    outputs: AgentOutput[]
  ): { score: number; supporters: AgentType[]; reason: string } {
    let score = 0;
    const supporters: AgentType[] = [];
    const reasons: string[] = [];

    // 제안을 한 에이전트 찾기
    const sourceAgent = outputs.find((o) =>
      o.suggestions.some((s) => s.id === suggestion.id)
    )?.agent;

    if (sourceAgent) {
      // 제안 에이전트에게 기본 가중치
      const weight = AGENT_WEIGHTS[sourceAgent]?.[suggestion.type] ?? 1.0;
      score += weight;
      supporters.push(sourceAgent);
    }

    // 우선순위에 따른 추가 점수
    if (suggestion.priority === 'high') {
      score += 0.3;
    } else if (suggestion.priority === 'medium') {
      score += 0.1;
    }

    // 정규화 (0-1 범위)
    const maxPossibleScore = 2.0;
    const normalizedScore = Math.min(score / maxPossibleScore, 1.0);

    return {
      score: normalizedScore,
      supporters,
      reason:
        normalizedScore >= this.threshold
          ? `Accepted with score ${normalizedScore.toFixed(2)}`
          : `Rejected: score ${normalizedScore.toFixed(2)} below threshold ${this.threshold}`,
    };
  }

  private resolveConflicts(changes: AcceptedChange[]): AcceptedChange[] {
    // 라인 범위별 그룹화
    const lineGroups = new Map<string, AcceptedChange[]>();

    for (const change of changes) {
      const key = `${change.change.startLine}-${change.change.endLine}`;
      if (!lineGroups.has(key)) {
        lineGroups.set(key, []);
      }
      lineGroups.get(key)!.push(change);
    }

    const resolved: AcceptedChange[] = [];

    for (const [_, group] of lineGroups) {
      if (group.length === 1) {
        resolved.push(group[0]);
      } else {
        // 점수가 가장 높은 변경 선택
        const best = group.reduce((a, b) => (a.score > b.score ? a : b));
        resolved.push(best);
      }
    }

    return resolved;
  }

  private generateSummary(
    accepted: AcceptedChange[],
    rejected: RejectedChange[]
  ): string {
    const parts: string[] = [];

    if (accepted.length > 0) {
      parts.push(`${accepted.length}건의 변경 사항이 채택되었습니다.`);
      const agents = [...new Set(accepted.map((a) => a.change.agent))];
      parts.push(`참여 에이전트: ${agents.join(', ')}`);
    } else {
      parts.push('채택된 변경 사항이 없습니다.');
    }

    if (rejected.length > 0) {
      parts.push(`${rejected.length}건의 제안이 미채택되었습니다.`);
    }

    return parts.join(' ');
  }
}
