import { Workbench } from './firehose/Workbench';
import LogViewer from './log-viewer/components/LogViewer';

export default function App() {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      font: '14px/1.5 system-ui, sans-serif', 
      padding: '24px', 
      color: '#1f2937', 
      background: '#f9fafb', 
      overflow: 'hidden',
      height: `calc(100vh - 48px)`
    }}>
      <header style={{ marginBottom: 24, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, fontWeight: 600 }}>
          Realtime Log Stream Viewer
        </h1>
        <p style={{ color: '#6b7280', maxWidth: 800, margin: 0 }}>
          A production-grade log viewer with deduplication, filtering, search, and virtualized rendering.
          Use the Workbench (bottom-right) to control the stream while testing.
        </p>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <LogViewer autoConnect={false} defaultCapacity={10000} />
      </div>

      <Workbench />
    </div>
  );
}
