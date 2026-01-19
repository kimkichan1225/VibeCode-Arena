# VibeCode Arena - 시스템 아키텍처 설계서

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [전체 아키텍처](#2-전체-아키텍처)
3. [프론트엔드 구조](#3-프론트엔드-구조)
4. [백엔드 구조](#4-백엔드-구조)
5. [에이전트 오케스트레이션](#5-에이전트-오케스트레이션)
6. [UI/UX 설계](#6-uiux-설계)
7. [MVP 로드맵](#7-mvp-로드맵)

---

## 1. 시스템 개요

### 1.1 VibeCode Arena란?
멀티 AI 에이전트 기반 바이브코딩 웹사이트. 사용자가 자연어로 코딩 요청을 입력하면 여러 AI 에이전트가 서로 대화하며 검증, 최적화, 보안, UX 점검을 자동으로 수행한다.

### 1.2 핵심 기능
- 자연어(바이브) 기반 코드 생성
- 5개 AI 에이전트의 병렬 검토
- 에이전트 간 실시간 토론 및 합의
- 합의된 수정사항 자동 코드 반영

### 1.3 에이전트 구성

| 에이전트 | 역할 | 중점 영역 |
|---------|------|----------|
| Vibe Agent | 코드 생성 | 사용자 의도 해석, 초기 코드 작성 |
| Validator Agent | 검증 | 문법 오류, 런타임 오류, 논리 결함 |
| Optimizer Agent | 최적화 | 성능 개선, 중복 제거, 리팩토링 |
| Security Agent | 보안 | XSS, Injection, 인증/인가 취약점 |
| UX Agent | 바이브 유지 | 가독성, 네이밍, 바이브 점수 평가 |

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React SPA)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │ Vibe Input   │  │  Monaco Editor   │  │    Agent Discussion Panel     │ │
│  │ Panel        │  │  (Code Display)  │  │    (Real-time Chat Log)       │ │
│  └──────────────┘  └──────────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (Socket.IO)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Node.js/Express)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Session Manager │  │ WebSocket Hub   │  │   Request Validator         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT ORCHESTRATOR (핵심 엔진)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Orchestration Controller                        │   │
│   │   - 에이전트 실행 순서 제어                                            │   │
│   │   - 토론 라운드 관리                                                   │   │
│   │   - 합의 판정 로직                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│   ┌─────────────┐  ┌─────────────────────────────────┐  ┌─────────────┐    │
│   │    Phase 1   │  │            Phase 2              │  │   Phase 3   │    │
│   │  Generation  │  │     Parallel Review             │  │  Consensus  │    │
│   └─────────────┘  └─────────────────────────────────┘  └─────────────┘    │
│          │                         │                              │          │
│          ▼                         ▼                              ▼          │
│   ┌─────────────┐    ┌───────┬───────┬───────┬───────┐  ┌─────────────┐    │
│   │ Vibe Agent  │    │Valid- │Optim- │Secur- │  UX   │  │  Consensus  │    │
│   │             │    │ator   │izer   │ity    │ Agent │  │   Engine    │    │
│   └─────────────┘    └───────┴───────┴───────┴───────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌───────────┐  ┌─────────────┐  ┌───────────┐
             │  OpenAI   │  │  Anthropic  │  │  Local    │
             │  API      │  │  API        │  │  LLM      │
             └───────────┘  └─────────────┘  └───────────┘
```

### 2.1 핵심 설계 원칙

1. **이벤트 기반 스트리밍**: 모든 에이전트 발언은 실시간 스트리밍
2. **에이전트 독립성**: 각 에이전트는 독립된 프롬프트와 컨텍스트 보유
3. **토론 메모리**: 세션별 토론 히스토리 유지, 에이전트가 이전 발언 참조

---

## 3. 프론트엔드 구조

### 3.1 폴더 구조

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── StatusBar.tsx
│   │   │
│   │   ├── vibe-input/
│   │   │   ├── VibeInputPanel.tsx
│   │   │   ├── VibeTextArea.tsx
│   │   │   ├── ToneSelector.tsx
│   │   │   └── ExecuteButton.tsx
│   │   │
│   │   ├── code-editor/
│   │   │   ├── CodeEditorPanel.tsx
│   │   │   └── MonacoWrapper.tsx
│   │   │
│   │   ├── agent-panel/
│   │   │   ├── AgentDiscussionPanel.tsx
│   │   │   ├── AgentMessage.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   └── ConsensusCard.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Badge.tsx
│   │
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useVibeSession.ts
│   │
│   ├── stores/
│   │   ├── vibeStore.ts
│   │   ├── codeStore.ts
│   │   └── agentStore.ts
│   │
│   ├── services/
│   │   └── socketService.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── constants/
│       └── agents.ts
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### 3.2 기술 스택

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor
- **Animation**: Framer Motion
- **WebSocket**: Socket.IO Client

---

## 4. 백엔드 구조

### 4.1 폴더 구조

```
backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   └── index.ts
│   │
│   ├── socket/
│   │   ├── socketHandler.ts
│   │   └── sessionManager.ts
│   │
│   ├── agents/
│   │   ├── base/
│   │   │   └── BaseAgent.ts
│   │   │
│   │   ├── implementations/
│   │   │   ├── VibeAgent.ts
│   │   │   ├── ValidatorAgent.ts
│   │   │   ├── OptimizerAgent.ts
│   │   │   ├── SecurityAgent.ts
│   │   │   └── UXAgent.ts
│   │   │
│   │   └── prompts/
│   │       └── index.ts
│   │
│   ├── orchestrator/
│   │   ├── Orchestrator.ts
│   │   ├── ConsensusEngine.ts
│   │   └── CodeMerger.ts
│   │
│   ├── services/
│   │   └── llm/
│   │       ├── LLMService.ts
│   │       └── OpenAIService.ts
│   │
│   └── types/
│       └── index.ts
│
├── package.json
├── tsconfig.json
└── .env
```

### 4.2 기술 스택

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **AI SDK**: OpenAI SDK

---

## 5. 에이전트 오케스트레이션

### 5.1 실행 흐름

```
PHASE 1: GENERATION (코드 생성)
├── Vibe Agent가 사용자 요청 해석
├── 초기 코드 생성
└── 코드를 클라이언트에 전송

PHASE 2: PARALLEL REVIEW (병렬 검토)
├── 4개 에이전트 동시 실행
│   ├── Validator: 오류 검증
│   ├── Optimizer: 성능 분석
│   ├── Security: 보안 점검
│   └── UX: 가독성/바이브 평가
└── 각 에이전트 결과 실시간 스트리밍

PHASE 3: DISCUSSION (토론)
├── 충돌 감지 (같은 코드 영역에 대한 상충 제안)
├── 최대 3라운드 토론
│   ├── 에이전트 A → B 의견 반응
│   └── 에이전트 B → A 응답
└── 합의 도달 여부 확인

PHASE 4: CONSENSUS (합의)
├── 모든 제안에 대해 지지도 계산
├── 에이전트별 가중치 적용
├── 임계값(0.6) 이상인 제안 채택
└── 채택/미채택 사유 기록

PHASE 5: MERGE (코드 병합)
├── 채택된 변경사항 순차 적용
├── 구문 검증
└── 최종 코드 전송

PHASE 6: COMPLETE (완료)
└── 결과 요약 및 바이브 점수 표시
```

### 5.2 충돌 해결 규칙

1. **같은 라인 수정 충돌**: 지지자 수가 많은 제안 선택
2. **철학적 충돌** (성능 vs 가독성): 토론 후 합의, 불가시 바이브 톤에 따라 결정
3. **보안 관련 제안**: Security Agent에게 1.5배 가중치

### 5.3 에이전트별 가중치 매트릭스

| 제안 유형 | Validator | Optimizer | Security | UX |
|----------|-----------|-----------|----------|-----|
| bug_fix | 1.5 | 0.8 | 1.0 | 0.5 |
| performance | 0.8 | 1.5 | 0.5 | 0.4 |
| security | 1.2 | 0.5 | 1.5 | 0.6 |
| readability | 0.5 | 0.6 | 0.6 | 1.5 |

---

## 6. UI/UX 설계

### 6.1 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VibeCode Arena                                         [Dark Mode] [Settings]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │ VIBE INPUT  │ │ CODE EDITOR                 │ │ AI DISCUSSION           │ │
│ │             │ │                             │ │                         │ │
│ │ [텍스트입력]│ │  1│ function login() {     │ │ [Phase Indicator]       │ │
│ │             │ │  2│   // code here         │ │                         │ │
│ │ [톤 선택]   │ │  3│ }                      │ │ [Agent Messages]        │ │
│ │ ○ Clean     │ │                             │ │ ├─ Vibe Agent           │ │
│ │ ● Fast      │ │                             │ │ ├─ Validator            │ │
│ │ ○ Fancy     │ │                             │ │ ├─ Optimizer            │ │
│ │ ○ Hardcore  │ │                             │ │ └─ Security             │ │
│ │             │ │                             │ │                         │ │
│ │ [▶ EXECUTE] │ │                             │ │ [Consensus Card]        │ │
│ └─────────────┘ └─────────────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: ✓ 완료 | 변경 3건 | 바이브 점수: 8/10                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 에이전트 색상 테마

```css
--vibe-agent: #a855f7;      /* Purple - 창조적 */
--validator-agent: #3b82f6;  /* Blue - 분석적 */
--optimizer-agent: #eab308;  /* Yellow - 최적화 */
--security-agent: #ef4444;   /* Red - 경고 */
--ux-agent: #22c55e;         /* Green - 사용자 친화 */
```

---

## 7. MVP 로드맵

### v0.1 - Core Flow (2주)
- [x] 3단 레이아웃
- [x] 바이브 입력 + 톤 선택
- [x] Vibe Agent + Validator Agent
- [x] 순차 실행 오케스트레이터
- [x] 기본 Socket.IO 연동

### v0.2 - Full Agents (2주)
- [ ] Optimizer/Security/UX Agent
- [ ] 병렬 실행
- [ ] 실시간 스트리밍
- [ ] 에이전트 아바타/색상

### v0.3 - Discussion System (2주)
- [ ] 충돌 감지
- [ ] 에이전트 반응 시스템
- [ ] 토론 라운드 관리
- [ ] 합의 엔진

### v1.0 - Production Ready (2주)
- [ ] 자동 코드 병합
- [ ] 코드 버전 비교
- [ ] 언어 선택 확장
- [ ] 에러 핸들링 강화

---

## 부록: Socket 이벤트 명세

### Client → Server
| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| `vibe:request` | `{ prompt, tone, language }` | 바이브 코딩 요청 |

### Server → Client
| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| `session:init` | `{ sessionId }` | 세션 초기화 |
| `phase:change` | `{ phase, message }` | 단계 변경 |
| `agent:message:start` | `{ agent, messageId }` | 에이전트 발언 시작 |
| `agent:message:chunk` | `{ messageId, chunk }` | 스트리밍 청크 |
| `agent:message:end` | `{ messageId }` | 에이전트 발언 완료 |
| `code:update` | `{ code, version }` | 코드 업데이트 |
| `consensus:result` | `{ accepted, rejected }` | 합의 결과 |
| `process:complete` | `{ finalCode, metrics }` | 처리 완료 |
