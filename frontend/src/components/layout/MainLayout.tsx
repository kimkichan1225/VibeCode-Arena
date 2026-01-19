import React from 'react';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { VibeInputPanel } from '../vibe-input/VibeInputPanel';
import { CodeEditorPanel } from '../code-editor/CodeEditorPanel';
import { AgentDiscussionPanel } from '../agent-panel/AgentDiscussionPanel';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* 좌측: 바이브 입력 */}
        <div className="w-[280px] min-w-[250px] border-r border-gray-800">
          <VibeInputPanel />
        </div>

        {/* 중앙: 코드 에디터 */}
        <div className="flex-1 min-w-0">
          <CodeEditorPanel />
        </div>

        {/* 우측: AI 토론 */}
        <div className="w-[380px] min-w-[320px] border-l border-gray-800">
          <AgentDiscussionPanel />
        </div>
      </main>

      <StatusBar />
    </div>
  );
};
