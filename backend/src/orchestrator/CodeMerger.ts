import { CodeChange, AcceptedChange } from '../types';

export class CodeMerger {
  merge(originalCode: string, acceptedChanges: AcceptedChange[]): string {
    if (acceptedChanges.length === 0) {
      return originalCode;
    }

    const lines = originalCode.split('\n');

    // 라인 번호 역순으로 정렬 (뒤에서부터 적용)
    const sortedChanges = [...acceptedChanges].sort(
      (a, b) => b.change.startLine - a.change.startLine
    );

    for (const accepted of sortedChanges) {
      const change = accepted.change;

      try {
        this.applyChange(lines, change);
      } catch (error) {
        console.error(`Failed to apply change:`, change, error);
        // 실패한 변경은 건너뛰기
      }
    }

    return lines.join('\n');
  }

  private applyChange(lines: string[], change: CodeChange): void {
    const startIdx = Math.max(0, change.startLine - 1);
    const endIdx = Math.min(lines.length, change.endLine);

    switch (change.type) {
      case 'replace':
        // 기존 라인을 새 코드로 교체
        const newLines = change.newCode.split('\n');
        lines.splice(startIdx, endIdx - startIdx, ...newLines);
        break;

      case 'insert':
        // 지정된 라인 이후에 삽입
        const insertLines = change.newCode.split('\n');
        lines.splice(startIdx, 0, ...insertLines);
        break;

      case 'delete':
        // 지정된 라인 범위 삭제
        lines.splice(startIdx, endIdx - startIdx);
        break;
    }
  }

  // 코드 변경 미리보기 생성
  generateDiff(originalCode: string, newCode: string): string {
    const originalLines = originalCode.split('\n');
    const newLines = newCode.split('\n');

    const diff: string[] = [];
    const maxLen = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const original = originalLines[i];
      const updated = newLines[i];

      if (original === undefined) {
        diff.push(`+ ${updated}`);
      } else if (updated === undefined) {
        diff.push(`- ${original}`);
      } else if (original !== updated) {
        diff.push(`- ${original}`);
        diff.push(`+ ${updated}`);
      } else {
        diff.push(`  ${original}`);
      }
    }

    return diff.join('\n');
  }

  // 코드 구문 검증 (기본)
  validateCode(code: string, language: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 기본적인 구문 검사
    if (language === 'typescript' || language === 'javascript') {
      // 괄호 균형 검사
      const brackets: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
      const stack: string[] = [];

      for (const char of code) {
        if (brackets[char]) {
          stack.push(brackets[char]);
        } else if (Object.values(brackets).includes(char)) {
          if (stack.pop() !== char) {
            errors.push(`Unbalanced bracket: ${char}`);
          }
        }
      }

      if (stack.length > 0) {
        errors.push('Unclosed brackets detected');
      }

      // 문자열 리터럴 검사
      const stringMatches = code.match(/(['"`])/g);
      if (stringMatches) {
        const quotes = { "'": 0, '"': 0, '`': 0 };
        for (const quote of stringMatches) {
          quotes[quote as keyof typeof quotes]++;
        }
        for (const [quote, count] of Object.entries(quotes)) {
          if (count % 2 !== 0 && quote !== '`') {
            // 템플릿 리터럴은 여러 줄 가능
            errors.push(`Unmatched ${quote} quote`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
