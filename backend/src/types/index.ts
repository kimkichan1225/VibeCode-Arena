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
  existingCode?: string; // 수정 모드: 기존 코드
  isModification?: boolean; // 수정 모드 여부
}

// 에이전트 메시지
export interface AgentMessage {
  id: string;
  agent: AgentType;
  content: string;
  timestamp: number;
  suggestions?: Suggestion[];
  codeChanges?: CodeChange[];
  metadata?: {
    vibeScore?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    confidence?: number;
    // 프로젝트 모드 메타데이터
    filesGenerated?: number;
    structure?: string;
    dependencies?: string[];
    fileIssues?: any[];
    strengths?: string[];
    [key: string]: any; // 추가 메타데이터 허용
  };
}

// 제안
export interface Suggestion {
  id: string;
  type: SuggestionType;
  description: string;
  targetLines?: { start: number; end: number };
  codeChange?: CodeChange;
  priority: 'low' | 'medium' | 'high';
}

export type SuggestionType =
  | 'bug_fix'
  | 'error_handling'
  | 'type_safety'
  | 'performance'
  | 'security'
  | 'input_validation'
  | 'readability'
  | 'naming'
  | 'refactoring'
  | 'style';

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

// 에이전트 반응
export interface AgentReaction {
  from: AgentType;
  to: AgentType;
  type: 'agree' | 'disagree' | 'partial' | 'counter';
  content: string;
  alternative?: CodeChange;
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

// 세션 데이터
export interface SessionData {
  id: string;
  request: VibeRequest;
  currentCode: string;
  codeVersions: string[];
  agentMessages: AgentMessage[];
  phase: Phase;
  createdAt: number;
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

// 에이전트 출력
export interface AgentOutput {
  agent: AgentType;
  analysis: string;
  suggestions: Suggestion[];
  codeChanges: CodeChange[];
  metadata: {
    confidence: number;
    processingTime: number;
    vibeScore?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    generatedCode?: string; // Vibe Agent용
    strengths?: string[]; // Reviewer용
    issueCount?: number; // Reviewer용
    [key: string]: any; // 추가 메타데이터 허용
  };
}

// Socket 이벤트 타입
export interface ServerToClientEvents {
  'session:init': (data: { sessionId: string }) => void;
  'phase:change': (data: { phase: Phase; message: string }) => void;
  'agent:message:start': (data: { agent: AgentType; messageId: string }) => void;
  'agent:message:chunk': (data: { messageId: string; chunk: string }) => void;
  'agent:message:end': (data: { messageId: string; content: string; metadata?: any }) => void;
  'code:update': (data: { code: string; version: number; changes?: CodeChange[] }) => void;
  'consensus:result': (data: ConsensusResult) => void;
  'discussion:round:start': (data: { round: number; conflictCount: number }) => void;
  'discussion:reaction': (data: { reaction: AgentReaction }) => void;
  'discussion:round:end': (data: { round: number; resolvedCount: number }) => void;
  'process:complete': (data: OrchestratorResult) => void;
  'error': (data: { message: string; phase?: Phase }) => void;
}

export interface ClientToServerEvents {
  'vibe:request': (data: VibeRequest) => void;
  'project:request': (data: ProjectRequest) => void;
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
  existingFiles?: ProjectFile[]; // 기존 파일 컨텍스트
}

// 프로젝트 결과
export interface ProjectResult {
  success: boolean;
  projectName: string;
  files: ProjectFile[];
  createdPaths: string[];
  consensus: ConsensusResult;
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

// 프로젝트 Socket 이벤트
export interface ProjectServerToClientEvents extends ServerToClientEvents {
  'project:file:start': (data: { fileName: string; fileType: ProjectFileType }) => void;
  'project:file:chunk': (data: { fileName: string; chunk: string }) => void;
  'project:file:end': (data: { file: ProjectFile }) => void;
  'project:complete': (data: ProjectResult) => void;
}
