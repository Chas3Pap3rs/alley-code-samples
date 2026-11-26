import { useState } from 'react';
import { AddOnPicker } from './components/AddOnPicker';
import { EstimateSummary } from './components/EstimateSummary';
import { FrequencyPicker } from './components/FrequencyPicker';
import { HomeDetails } from './components/HomeDetails';
import { ServicePicker } from './components/ServicePicker';
import { calculateEstimate, coerceFrequency, snapSqftToTier, type AddOn, type EstimateInput, type Service } from './estimator';
import styles from './Estimator.module.css';

export const DEFAULT_INPUT: EstimateInput = {
  service: 'standard',
  frequency: 'one-time',
  sqft: 1000,
  bedrooms: 2,
  bathrooms: 2,
  addOns: [],
};

/**
 * Instant price estimator. This component only holds the visitor's answers;
 * all pricing lives in `estimator.ts`. The estimate is derived during render
 * rather than synced through an effect, so it can never be stale.
 */
export default function Estimator({ initialInput = DEFAULT_INPUT }: { initialInput?: EstimateInput }) {
  const [input, setInput] = useState(initialInput);
  const estimate = calculateEstimate(input);

  // Switching services can invalidate other answers (a size the new service
  // doesn't price, or a frequency it doesn't offer), so repair them in the
  // same update instead of letting the form reach an invalid state.
  const changeService = (service: Service) =>
    setInput((previous) => ({
      ...previous,
      service,
      sqft: snapSqftToTier(service, previous.sqft),
      frequency: coerceFrequency(service, previous.frequency),
    }));

  const toggleAddOn = (addOn: AddOn) =>
    setInput((previous) => ({
      ...previous,
      addOns: previous.addOns.includes(addOn)
        ? previous.addOns.filter((item) => item !== addOn)
        : [...previous.addOns, addOn],
    }));

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <ServicePicker value={input.service} onChange={changeService} />
        <HomeDetails
          service={input.service}
          sqft={input.sqft}
          bedrooms={input.bedrooms}
          bathrooms={input.bathrooms}
          onSqftChange={(sqft) => setInput((previous) => ({ ...previous, sqft }))}
          onRoomsChange={(rooms) => setInput((previous) => ({ ...previous, ...rooms }))}
        />
        <FrequencyPicker
          service={input.service}
          value={input.frequency}
          onChange={(frequency) => setInput((previous) => ({ ...previous, frequency }))}
        />
        <AddOnPicker value={input.addOns} onToggle={toggleAddOn} />
      </form>

      <EstimateSummary estimate={estimate} showRentalExtras={input.service === 'rental-turnover'} />
    </div>
  );
}
