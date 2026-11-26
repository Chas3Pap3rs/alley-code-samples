import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Estimator from '../Estimator';
import './demo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="demo">
      <h1>How much does a house cleaning cost?</h1>
      <p>Answer a few questions to see an instant estimate. No contact details required.</p>
      <Estimator />
    </main>
  </StrictMode>,
);
