import { AgentConfig, AgentType } from '../types';

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  vibe: {
    type: 'vibe',
    name: 'Vibe Agent',
    nameKo: '바이브 에이전트',
    role: '코드 생성',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: '🎨',
  },
  reviewer: {
    type: 'reviewer',
    name: 'Code Reviewer',
    nameKo: '통합 리뷰어',
    role: '종합 코드 검토',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    icon: '📋',
  },
  // 레거시 에이전트 (하위 호환성)
  validator: {
    type: 'validator',
    name: 'Validator Agent',
    nameKo: '검증 에이전트',
    role: '오류 검증',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: '🔍',
  },
  optimizer: {
    type: 'optimizer',
    name: 'Optimizer Agent',
    nameKo: '최적화 에이전트',
    role: '성능 최적화',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    icon: '⚡',
  },
  security: {
    type: 'security',
    name: 'Security Agent',
    nameKo: '보안 에이전트',
    role: '보안 점검',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: '🛡️',
  },
  ux: {
    type: 'ux',
    name: 'UX Agent',
    nameKo: 'UX 에이전트',
    role: '가독성/바이브',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    icon: '🎯',
  },
};

export const PHASE_LABELS: Record<string, { label: string; description: string }> = {
  idle: { label: '대기', description: '요청을 기다리는 중...' },
  generation: { label: '생성', description: 'Vibe Agent가 코드를 생성하고 있습니다' },
  review: { label: '검토', description: 'Code Reviewer가 코드를 종합 분석하고 있습니다' },
  discussion: { label: '토론', description: '에이전트들이 의견을 조율하고 있습니다' }, // 레거시
  consensus: { label: '정리', description: '리뷰 결과를 정리하고 있습니다' },
  merging: { label: '적용', description: '개선 사항을 적용하고 있습니다' },
  complete: { label: '완료', description: '모든 처리가 완료되었습니다' },
  error: { label: '오류', description: '처리 중 오류가 발생했습니다' },
};

export const TONE_OPTIONS = [
  {
    value: 'clean' as const,
    label: 'Clean',
    description: '깔끔하고 읽기 쉬운 코드',
    icon: '✨',
  },
  {
    value: 'fast' as const,
    label: 'Fast',
    description: '빠르고 효율적인 코드',
    icon: '🚀',
  },
  {
    value: 'fancy' as const,
    label: 'Fancy',
    description: '모던하고 세련된 코드',
    icon: '💎',
  },
  {
    value: 'hardcore' as const,
    label: 'Hardcore',
    description: '극한의 최적화 코드',
    icon: '🔥',
  },
];

export const LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
];
