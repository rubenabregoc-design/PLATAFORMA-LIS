import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GlobalErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Automatic legacy storage flush on build update
if (typeof window !== 'undefined') {
  const currentBuild = 'lis-build-v5-fresh';
  if (localStorage.getItem('lis_build_version') !== currentBuild) {
    console.info('🧹 LIS-CORE: Flushing legacy browser cache & IndexedDB...');
    localStorage.clear();
    localStorage.setItem('lis_build_version', currentBuild);
    try {
      indexedDB.deleteDatabase('lisIndexedDb');
      indexedDB.deleteDatabase('lis-storage');
      indexedDB.deleteDatabase('lis-storage-v4');
    } catch {}
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
