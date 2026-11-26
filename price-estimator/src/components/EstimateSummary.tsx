import { useId } from 'react';
import type { Estimate } from '../estimator';
import { formatCurrency } from '../options';
import styles from '../Estimator.module.css';

interface EstimateSummaryProps {
  estimate: Estimate;
  showRentalExtras: boolean;
}

export function EstimateSummary({ estimate, showRentalExtras }: EstimateSummaryProps) {
  const headingId = useId();

  return (
    <aside className={styles.summary} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.summaryHeading}>
        Your estimate
      </h2>

      {/* Announces the new total politely whenever an answer changes. */}
      <output className={styles.total} aria-live="polite">
        {estimate.ok ? formatCurrency(estimate.total) : 'Custom quote'}
      </output>

      {estimate.ok ? (
        <dl className={styles.breakdown}>
          <div>
            <dt>Base price</dt>
            <dd>{formatCurrency(estimate.base)}</dd>
          </div>
          {showRentalExtras && (
            <div>
              <dt>Extra rooms</dt>
              <dd>{formatCurrency(estimate.rentalExtras)}</dd>
            </div>
          )}
          <div>
            <dt>Add-ons</dt>
            <dd>{formatCurrency(estimate.addOnsTotal)}</dd>
          </div>
          {estimate.frequencyMultiplier < 1 && (
            <div>
              <dt>Recurring discount</dt>
              <dd>−{Math.round((1 - estimate.frequencyMultiplier) * 100)}%</dd>
            </div>
          )}
        </dl>
      ) : (
        <p>Homes this size are quoted individually. Contact us and we&apos;ll put together a custom price.</p>
      )}

      <p className={styles.fineprint}>
        This is an estimate. The final price is confirmed after we review your booking details.
      </p>
    </aside>
  );
}
