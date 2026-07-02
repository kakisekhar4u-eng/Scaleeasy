import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './shared/i18n/I18nProvider';
import './index.css';

const savedLanguage = (() => {
  try { return localStorage.getItem('scaleeasy_language') || 'en'; } catch { return 'en'; }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider initialLanguage={savedLanguage}>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
