import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import App from './App'; import './style.css'; import './overrides.css'; import './modern-docs.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
