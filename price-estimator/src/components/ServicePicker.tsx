import type { Service } from '../estimator';
import { SERVICE_OPTIONS } from '../options';
import styles from '../Estimator.module.css';

interface ServicePickerProps {
  value: Service;
  onChange: (service: Service) => void;
}

/** Native radio buttons styled as cards: arrow-key navigation and screen-reader semantics come free. */
export function ServicePicker({ value, onChange }: ServicePickerProps) {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>Choose a service</legend>
      <div className={styles.cards}>
        {SERVICE_OPTIONS.map((option) => (
          <label key={option.id} className={styles.card}>
            <input
              type="radio"
              name="service"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span className={styles.cardTitle}>{option.label}</span>
            <span className={styles.cardText}>{option.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
