// 바이브 톤 타입
export type VibeTone = 'clean' | 'fast' | 'fancy' | 'hardcore';

// 에이전트 타입
export type AgentType = 'vibe' | 'validator' | 'optimizer' | 'security' | 'ux' | 'reviewer';

// 처리 단계
export type Phase =
  | 'idle'
  | 'generation'
  | 'review'
  | 'discussion'
  | 'consensus'
  | 'merging'
  | 'complete'
  | 'error';

// 바이브 요청
export interface VibeRequest {
  sessionId: string;
  prompt: string;
  tone: VibeTone;
  language: string;
}

// 에이전트 메시지
export interface AgentMessage {
  id: string;
  agent: AgentType;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  suggestions?: Suggestion[];
  codeChanges?: CodeChange[];
  metadata?: {
    vibeScore?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    confidence?: number;
  };
}

// 제안
export interface Suggestion {
  id: string;
  type: string;
  description: string;
  targetLines?: { start: number; end: number };
  codeChange?: CodeChange;
  priority: 'low' | 'medium' | 'high';
}

// 코드 변경
export interface CodeChange {
  id: string;
  type: 'insert' | 'replace' | 'delete';
  startLine: number;
  endLine: number;
  oldCode?: string;
  newCode: string;
  reason: string;
  agent: AgentType;
}

// 합의 결과
export interface ConsensusResult {
  accepted: AcceptedChange[];
  rejected: RejectedChange[];
  vibeScore: number;
  summary: string;
}

export interface AcceptedChange {
  change: CodeChange;
  supporters: AgentType[];
  score: number;
}

export interface RejectedChange {
  suggestion: Suggestion;
  reason: string;
  score: number;
}

// 오케스트레이터 결과
export interface OrchestratorResult {
  success: boolean;
  finalCode: string;
  codeVersions: string[];
  consensus: ConsensusResult;
  agentMessages: AgentMessage[];
  metrics: {
    totalTime: number;
    discussionRounds: number;
    changesApplied: number;
    changesRejected: number;
    vibeScore: number;
  };
}

// 에이전트 설정
export interface AgentConfig {
  type: AgentType;
  name: string;
  nameKo: string;
  role: string;
  color: string;
  bgColor: string;
  icon: string;
}

// 에이전트 반응 타입
export type ReactionType = 'agree' | 'disagree' | 'partial' | 'counter';

// 에이전트 반응
export interface AgentReaction {
  from: AgentType;
  to: AgentType;
  type: ReactionType;
  content: string;
  alternative?: string;
  timestamp?: number;
}

// 토론 라운드
export interface DiscussionRound {
  round: number;
  reactions: AgentReaction[];
  conflictCount: number;
  resolvedCount: number;
  timestamp: number;
}

// 토론 상태
export interface DiscussionState {
  isActive: boolean;
  currentRound: number;
  totalConflicts: number;
  resolvedConflicts: number;
  rounds: DiscussionRound[];
  reactions: AgentReaction[];
}

// ========== 프로젝트 모드 타입 ==========

// 생성 모드
export type GenerationMode = 'single' | 'project';

// 프로젝트 파일 타입
export type ProjectFileType = 'component' | 'style' | 'test' | 'util' | 'config' | 'other';

// 프로젝트 파일
export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  language: string;
  type: ProjectFileType;
}

// 프로젝트 요청
export interface ProjectRequest {
  sessionId: string;
  prompt: string;
  tone: VibeTone;
  language: string;
  mode: 'project';
  projectName: string;
  basePath: string;
  includeTests: boolean;
  includeStyles: boolean;
  framework?: 'react' | 'vue' | 'svelte' | 'vanilla';
  existingFiles?: ProjectFile[];
}

// 프로젝트 결과
export interface ProjectResult {
  success: boolean;
  projectName: string;
  files: ProjectFile[];
  createdPaths: string[];
  agentMessages: AgentMessage[];
  metrics: {
    totalTime: number;
    filesGenerated: number;
    vibeScore: number;
  };
}

// 파일 정보
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
  modifiedAt?: number;
}
