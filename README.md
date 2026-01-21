# VibeCode Arena

멀티 AI 에이전트 기반 바이브코딩 웹 플랫폼

![VibeCode Arena](https://img.shields.io/badge/VibeCode-Arena-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![Deploy](https://img.shields.io/badge/Railway-Deployed-green)

## 라이브 데모

**[https://vibecode-arena-production.up.railway.app/](https://vibecode-arena-production.up.railway.app/)**

## 개요

VibeCode Arena는 자연어로 코딩 요청을 입력하면 2개의 AI 에이전트가 협력하여 코드를 생성하고 검증하는 웹 플랫폼입니다.

### 주요 기능

- **자연어 코딩**: 바이브(감성)를 담아 자연어로 코드 요청
- **멀티 에이전트 협업**: 2개의 전문 AI 에이전트(Vibe + CodeReviewer)가 코드 생성 및 검토
- **실시간 스트리밍**: AI 응답을 실시간으로 스트리밍하여 표시
- **코드 수정 기능**: 생성된 코드를 AI 토론을 통해 추가 수정 가능
- **프로젝트 모드**: 다중 파일 프로젝트 생성 지원 (React, Vue, Svelte, Vanilla JS)
- **React 실시간 미리보기**: 브라우저 내에서 React/TypeScript 코드 실행 및 미리보기
- **버전 관리**: 코드 버전별 비교(Diff) 기능

### AI 에이전트 구성 (최적화됨)

| 에이전트 | 역할 | 설명 |
|---------|------|------|
| 🎨 Vibe Agent | 코드 생성 | 사용자 의도를 해석하여 코드 작성 및 수정 |
| 📝 CodeReviewer Agent | 종합 리뷰 | 버그, 성능, 보안, 가독성 등 통합 검토 |

> 초기 6개 에이전트에서 2개로 최적화하여 응답 속도 개선

## 빠른 시작

### 로컬 개발 환경

#### 1. 저장소 클론 및 환경 설정

```bash
git clone https://github.com/kimkichan1225/VibeCode-Arena.git
cd VibeCode-Arena

# Backend 환경 변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일에서 ANTHROPIC_API_KEY 설정
```

#### 2. 의존성 설치

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

#### 3. 개발 서버 실행

**터미널 1 - Backend:**
```bash
cd backend && npm run dev
```

**터미널 2 - Frontend:**
```bash
cd frontend && npm run dev
```

#### 4. 접속

브라우저에서 `http://localhost:5173` 접속

---

## Railway 배포 가이드

### 단일 서비스 배포 (Frontend + Backend 통합)

1. **GitHub에 코드 푸시**

2. **Railway에서 배포**
   - [Railway](https://railway.app) 접속 → 로그인
   - **New Project** → **Deploy from GitHub repo** 선택
   - 레포지토리 선택

3. **환경변수 설정** (Variables 탭)
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   NODE_ENV=production
   ```

4. **도메인 생성**
   - Settings → Networking → Generate Domain
   - Port: `8080`

5. 배포 완료!

---

## 사용법

### 단일 파일 모드
1. **바이브 입력**: 좌측 패널에서 원하는 기능을 자연어로 설명
2. **톤 선택**: Clean / Fast / Fancy / Hardcore 중 선택
3. **실행**: 실행 버튼 클릭 또는 `Ctrl+Enter`
4. **결과 확인**:
   - 중앙: 생성된 코드 확인
   - 우측: AI 토론 / 미리보기 탭

### 코드 수정 모드
1. 코드 생성 후 **"수정하기"** 버튼 클릭
2. 원하는 수정 사항 입력 (예: "버튼 색상을 파란색으로 변경해줘")
3. **"코드 수정"** 버튼 클릭
4. AI가 기존 코드를 기반으로 수정

### 프로젝트 모드
1. **프로젝트 모드 선택**: 상단 탭에서 "프로젝트" 선택
2. **설정**:
   - 프로젝트 이름 입력
   - 프레임워크 선택 (React / Vue / Svelte / Vanilla JS)
3. **프로젝트 생성**: 원하는 프로젝트 설명 입력 후 생성

### React 미리보기
- React 코드 실행 시 우측 **"미리보기"** 탭에서 렌더링 결과 확인
- TypeScript 코드도 Babel로 자동 변환되어 실행

---

## 프로젝트 구조

```
VibeCode-Arena/
├── railway.json             # Railway 배포 설정
├── package.json             # 루트 스크립트
│
├── backend/                 # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── agents/          # AI 에이전트
│   │   │   ├── implementations/
│   │   │   │   ├── VibeAgent.ts        # 코드 생성/수정
│   │   │   │   └── CodeReviewerAgent.ts # 종합 리뷰
│   │   │   └── prompts/
│   │   ├── orchestrator/    # 오케스트레이션
│   │   │   ├── Orchestrator.ts
│   │   │   ├── ProjectOrchestrator.ts
│   │   │   └── ConsensusEngine.ts
│   │   ├── services/llm/    # Claude API 연동
│   │   ├── socket/          # WebSocket 핸들러
│   │   └── app.ts           # Express 앱 (정적 파일 서빙 포함)
│   └── package.json
│
└── frontend/                # React + Vite + TypeScript
    ├── public/
    │   ├── libs/            # React, ReactDOM, Babel (로컬)
    │   └── react-runner.html # React 실행 환경
    ├── src/
    │   ├── components/
    │   │   ├── code-editor/
    │   │   │   ├── CodeEditorPanel.tsx
    │   │   │   └── CodeRunner.tsx      # 콘솔 + 실행
    │   │   ├── agent-panel/
    │   │   │   └── AgentDiscussionPanel.tsx # 탭: AI토론/미리보기
    │   │   ├── preview/
    │   │   │   └── PreviewPanel.tsx    # React 미리보기
    │   │   └── vibe-input/
    │   │       └── VibeInputPanel.tsx  # 생성/수정 모드
    │   ├── stores/          # Zustand 상태 관리
    │   │   ├── vibeStore.ts    # 수정 모드 포함
    │   │   ├── previewStore.ts # 미리보기 상태
    │   │   └── ...
    │   └── services/
    │       └── socketService.ts
    └── package.json
```

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Zustand (상태 관리)
- Monaco Editor
- Tailwind CSS
- Framer Motion
- Socket.IO Client

### Backend
- Node.js + Express
- TypeScript
- Socket.IO
- Anthropic Claude API (claude-sonnet-4)

### 배포
- Railway (단일 서비스)

---

## 문제 해결 사례

### 1. React 실행 시 무한 로딩 (CDN 차단)

**문제**
- "React 실행" 버튼 클릭 시 무한 로딩
- 콘솔에 "Tracking Prevention blocked access to storage" 에러
- 브라우저 추적 방지 기능이 unpkg.com, cdnjs 등 외부 CDN 차단

**해결책**
- React, ReactDOM, Babel 라이브러리를 로컬에 다운로드
- `frontend/public/libs/` 폴더에 저장
- `react-runner.html`에서 로컬 경로로 로드

**결과**
- CDN 의존성 제거로 안정적인 React 실행
- 브라우저 보안 설정과 무관하게 동작

---

### 2. TypeScript 코드 실행 오류

**문제**
- `Partial is not defined` 에러
- `boolean true is not iterable` 에러
- 수동 정규식으로 TypeScript 타입 제거 시 복잡한 제네릭 처리 실패

**해결책**
- 수동 TypeScript 변환 대신 Babel의 `typescript` 프리셋 사용
- `react-runner.html`에서 Babel 변환 시 `['typescript', 'react']` 프리셋 적용

```javascript
const presets = isTypeScript ? ['typescript', 'react'] : ['react'];
const transformed = Babel.transform(code, { presets });
```

**결과**
- 모든 TypeScript 문법 정상 처리
- 복잡한 제네릭, 인터페이스 등 완벽 지원

---

### 3. 미리보기 UI 분리 요청

**문제**
- 콘솔과 미리보기가 같은 위치에 있어 불편
- 사용자 요청: 콘솔은 하단, 미리보기는 우측 패널

**해결책**
- `previewStore.ts` 생성: 미리보기 상태 공유
- `PreviewPanel.tsx` 생성: 독립적인 미리보기 컴포넌트
- `AgentDiscussionPanel.tsx`: 탭 추가 (AI 토론 / 미리보기)
- `CodeRunner.tsx`: 콘솔만 표시, 미리보기 코드는 store로 전달

**결과**
- 하단: 콘솔 + 실행 버튼
- 우측: AI 토론 탭 / 미리보기 탭
- React 실행 시 자동으로 미리보기 탭 전환

---

### 4. 코드 수정 기능 추가

**문제**
- 한 번 생성된 코드를 수정하려면 처음부터 다시 생성해야 함
- 사용자 요청: 기존 코드를 AI 토론으로 수정

**해결책**
- Backend: `VibeRequest`에 `existingCode`, `isModification` 필드 추가
- Backend: `VibeAgent`가 수정 모드일 때 기존 코드 기반으로 수정
- Frontend: `vibeStore`에 수정 모드 상태 추가
- Frontend: 코드 에디터에 "수정하기" 버튼 추가
- Frontend: 입력 패널이 수정 모드 UI로 전환

**결과**
- "수정하기" 버튼으로 수정 모드 진입
- 기존 코드 유지하면서 원하는 부분만 수정 요청 가능
- AI가 전체 코드 맥락을 이해하고 수정

---

### 5. Railway 단일 서비스 배포

**문제**
- Frontend와 Backend를 별도 서비스로 배포하면 관리 복잡
- CORS 설정, 환경변수 관리 등 이중 작업

**해결책**
- Backend에서 Production 환경일 때 Frontend 정적 파일 서빙
- `app.ts`에 `express.static()` 추가
- 루트에 `railway.json` 생성: 빌드/시작 명령 통합
- Frontend `socketService.ts`: Production에서 같은 origin 사용

**결과**
- 단일 Railway 서비스로 전체 앱 배포
- 환경변수 2개만 설정 (API 키, NODE_ENV)
- 하나의 도메인에서 API + WebSocket + 프론트엔드 모두 동작

---

## 환경 변수

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
PORT=3001
NODE_ENV=development
```

### Production (Railway)
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
NODE_ENV=production
```

---

## 라이선스

MIT License

---

## 링크

- **Live Demo**: [https://vibecode-arena-production.up.railway.app/](https://vibecode-arena-production.up.railway.app/)
- **GitHub**: [https://github.com/kimkichan1225/VibeCode-Arena](https://github.com/kimkichan1225/VibeCode-Arena)
