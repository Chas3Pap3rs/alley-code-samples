import { ALLOWED_FREQUENCIES, FREQUENCY_MULTIPLIERS, type Frequency, type Service } from '../estimator';
import { FREQUENCY_LABELS } from '../options';
import styles from '../Estimator.module.css';

interface FrequencyPickerProps {
  service: Service;
  value: Frequency;
  onChange: (frequency: Frequency) => void;
}

export function FrequencyPicker({ service, value, onChange }: FrequencyPickerProps) {
  const options = ALLOWED_FREQUENCIES[service];

  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>How often?</legend>
      <div className={styles.pills}>
        {options.map((frequency) => {
          const discount = Math.round((1 - FREQUENCY_MULTIPLIERS[frequency]) * 100);
          return (
            <label key={frequency} className={styles.pill}>
              <input
                type="radio"
                name="frequency"
                value={frequency}
                checked={value === frequency}
                onChange={() => onChange(frequency)}
              />
              <span>
                {FREQUENCY_LABELS[frequency]}
                {discount > 0 && <span className={styles.badge}> save {discount}%</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
