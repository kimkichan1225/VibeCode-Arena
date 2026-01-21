import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { HistoryPanel } from './components/history/HistoryPanel';
import { useSocket } from './hooks/useSocket';
import { useHistoryStore } from './stores/historyStore';

function App() {
  const { loadHistory } = useHistoryStore();

  // Socket 연결 초기화
  useSocket();

  // 히스토리 로드
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <MainLayout />
      <HistoryPanel />
    </>
  );
}

export default App;
