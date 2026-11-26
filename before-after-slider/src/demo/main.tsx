import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BeforeAfterSlider from '../BeforeAfterSlider';
import { CompareGroup } from '../CompareGroup';
import './demo.css';

function Demo() {
  return (
    <main className="demo">
      <h1>Before/after comparison slider</h1>
      <p>
        Drag the handle, click anywhere on an image, or focus the handle and use the arrow keys
        (Shift for larger steps, Home/End for the extremes).
      </p>

      <h2>Single slider (above the fold, so it opts in to priority loading)</h2>
      <BeforeAfterSlider
        priority
        beforeSrc="/images/tub-before.svg"
        afterSrc="/images/tub-after.svg"
        beforeAlt="Stained bathtub before refinishing"
        afterAlt="Bathtub with a clean white finish after refinishing"
      />

      <h2>Grouped row with mixed aspect ratios</h2>
      <p>Both sliders render at the height of the tallest image, so the row stays aligned.</p>
      <CompareGroup>
        <div className="row">
          <BeforeAfterSlider
            label="Bathtub comparison, 4:3 photo"
            beforeSrc="/images/tub-before.svg"
            afterSrc="/images/tub-after.svg"
            beforeAlt="Stained bathtub before refinishing"
            afterAlt="Bathtub after refinishing"
          />
          <BeforeAfterSlider
            label="Bathtub comparison, 16:9 photo"
            beforeSrc="/images/wide-before.svg"
            afterSrc="/images/wide-after.svg"
            beforeAlt="Wide view of a stained bathtub before refinishing"
            afterAlt="Wide view of the bathtub after refinishing"
          />
        </div>
      </CompareGroup>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
