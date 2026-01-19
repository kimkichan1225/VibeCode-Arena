# VibeCode Arena

멀티 AI 에이전트 기반 바이브코딩 웹 플랫폼

![VibeCode Arena](https://img.shields.io/badge/VibeCode-Arena-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## 개요

VibeCode Arena는 자연어로 코딩 요청을 입력하면 6개의 AI 에이전트가 협력하여 코드를 생성하고 검증하는 웹 플랫폼입니다.

### 주요 기능

- **자연어 코딩**: 바이브(감성)를 담아 자연어로 코드 요청
- **멀티 에이전트 협업**: 6개의 전문 AI 에이전트가 병렬로 코드 검토
- **실시간 토론**: 에이전트 간 의견 충돌 시 토론을 통해 합의 도출
- **자동 코드 반영**: 합의된 수정 사항이 코드에 자동 적용
- **프로젝트 모드**: 다중 파일 프로젝트 생성 지원 (React, Vue, Svelte, Vanilla JS)
- **코드 실행**: 브라우저 내에서 JavaScript/React 코드 실시간 실행 및 미리보기
- **파일 탐색기**: 로컬 파일 시스템 탐색 및 파일 선택

### AI 에이전트 구성

| 에이전트 | 역할 | 설명 |
|---------|------|------|
| 🎨 Vibe Agent | 코드 생성 | 사용자 의도를 해석하여 초기 코드 작성 |
| 🔍 Validator Agent | 검증 | 문법 오류, 런타임 오류, 논리 결함 검출 |
| ⚡ Optimizer Agent | 최적화 | 성능 개선, 중복 제거, 리팩토링 제안 |
| 🛡️ Security Agent | 보안 | XSS, Injection 등 보안 취약점 점검 |
| 🎯 UX Agent | 바이브 유지 | 가독성, 네이밍, 바이브 점수 평가 |
| 📝 CodeReviewer Agent | 코드 리뷰 | 종합적인 코드 품질 리뷰 및 피드백 |

## 빠른 시작

### 1. 저장소 클론 및 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd Vibecodding

# Backend 환경 변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일에서 ANTHROPIC_API_KEY 설정
```

### 2. 의존성 설치

```bash
# Backend 의존성 설치
cd backend
npm install

# Frontend 의존성 설치
cd ../frontend
npm install
```

### 3. 개발 서버 실행

**터미널 1 - Backend:**
```bash
cd backend
npm run dev
```

**터미널 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. 접속

브라우저에서 `http://localhost:5173` 접속

## 프로젝트 구조

```
Vibecodding/
├── ARCHITECTURE.md          # 상세 아키텍처 문서
├── README.md
│
├── backend/                 # Node.js + Express 백엔드
│   ├── src/
│   │   ├── agents/
│   │   │   ├── base/           # 에이전트 기본 클래스
│   │   │   ├── implementations/ # 개별 에이전트 구현
│   │   │   │   ├── VibeAgent.ts
│   │   │   │   ├── ValidatorAgent.ts
│   │   │   │   ├── OptimizerAgent.ts
│   │   │   │   ├── SecurityAgent.ts
│   │   │   │   ├── UXAgent.ts
│   │   │   │   └── CodeReviewerAgent.ts
│   │   │   └── prompts/        # 에이전트 프롬프트
│   │   ├── orchestrator/
│   │   │   ├── Orchestrator.ts       # 메인 오케스트레이터
│   │   │   ├── ProjectOrchestrator.ts # 프로젝트 모드 오케스트레이터
│   │   │   ├── ConsensusEngine.ts    # 합의 엔진
│   │   │   ├── DiscussionManager.ts  # 토론 관리자
│   │   │   └── CodeMerger.ts         # 코드 병합
│   │   ├── services/
│   │   │   ├── llm/            # LLM 서비스 (Claude API)
│   │   │   └── file/           # 파일 시스템 서비스
│   │   ├── routes/             # REST API 라우트
│   │   ├── socket/             # WebSocket 핸들러
│   │   ├── config/             # 설정
│   │   └── types/              # TypeScript 타입
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # React + Vite 프론트엔드
    ├── src/
    │   ├── components/
    │   │   ├── layout/         # 레이아웃 (Header, MainLayout, StatusBar)
    │   │   ├── vibe-input/     # 바이브 입력 패널
    │   │   ├── code-editor/    # 코드 에디터
    │   │   │   ├── CodeEditorPanel.tsx
    │   │   │   ├── CodeRunner.tsx    # 코드 실행기
    │   │   │   └── DiffViewer.tsx    # Diff 뷰어
    │   │   ├── agent-panel/    # 에이전트 토론 패널
    │   │   │   ├── AgentDiscussionPanel.tsx
    │   │   │   ├── AgentMessage.tsx
    │   │   │   ├── DiscussionView.tsx
    │   │   │   ├── PhaseIndicator.tsx
    │   │   │   └── ConsensusCard.tsx
    │   │   ├── project-mode/   # 프로젝트 모드
    │   │   │   ├── ProjectModePanel.tsx
    │   │   │   └── ProjectFilesViewer.tsx
    │   │   ├── file-explorer/  # 파일 탐색기
    │   │   │   └── FileExplorer.tsx
    │   │   ├── history/        # 히스토리 패널
    │   │   │   └── HistoryPanel.tsx
    │   │   └── common/         # 공통 컴포넌트
    │   ├── stores/             # Zustand 상태 관리
    │   ├── hooks/              # 커스텀 훅
    │   ├── services/           # Socket 서비스
    │   ├── types/              # TypeScript 타입
    │   └── constants/          # 상수
    ├── package.json
    └── vite.config.ts
```

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Zustand (상태 관리)
- Monaco Editor (코드 에디터)
- Tailwind CSS (스타일링)
- Framer Motion (애니메이션)
- Socket.IO Client (실시간 통신)
- Lucide React (아이콘)

### Backend
- Node.js + Express
- TypeScript
- Socket.IO (실시간 통신)
- Anthropic Claude API (LLM)

## 사용법

### 단일 파일 모드
1. **바이브 입력**: 좌측 패널에서 원하는 기능을 자연어로 설명
2. **톤 선택**: Clean / Fast / Fancy / Hardcore 중 선택
3. **실행**: 실행 버튼 클릭 또는 Ctrl+Enter
4. **결과 확인**:
   - 중앙: 생성된 코드 확인 및 실행
   - 우측: AI 에이전트들의 검토 과정 확인

### 프로젝트 모드
1. **프로젝트 모드 선택**: 상단 탭에서 "프로젝트 모드" 선택
2. **프로젝트 설정**:
   - 프로젝트 이름 입력
   - 프레임워크 선택 (React / Vue / Svelte / Vanilla JS)
   - 테스트/스타일 포함 여부 선택
3. **저장 위치 선택**: 파일 탐색기에서 저장할 경로 선택
4. **프로젝트 생성**: 자연어로 원하는 프로젝트 설명 입력 후 생성

### 코드 실행
- JavaScript 코드: 콘솔에서 결과 확인
- React 컴포넌트: 미리보기 탭에서 렌더링 결과 확인

## 환경 변수

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
PORT=3001
NODE_ENV=development
```

## 개발

### Backend 개발 서버
```bash
cd backend
npm run dev
```

### Frontend 개발 서버
```bash
cd frontend
npm run dev
```

### 빌드
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### 프로덕션 실행
```bash
# Backend
cd backend
npm start
```

## 라이선스

MIT License
