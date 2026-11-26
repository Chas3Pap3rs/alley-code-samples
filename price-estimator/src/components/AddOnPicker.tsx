import { ADD_ON_PRICES, type AddOn } from '../estimator';
import { ADD_ON_LABELS, formatCurrency } from '../options';
import styles from '../Estimator.module.css';

interface AddOnPickerProps {
  value: AddOn[];
  onToggle: (addOn: AddOn) => void;
}

export function AddOnPicker({ value, onToggle }: AddOnPickerProps) {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>Add-ons (optional)</legend>
      <div className={styles.pills}>
        {(Object.keys(ADD_ON_PRICES) as AddOn[]).map((addOn) => (
          <label key={addOn} className={styles.pill}>
            <input type="checkbox" checked={value.includes(addOn)} onChange={() => onToggle(addOn)} />
            <span>
              {ADD_ON_LABELS[addOn]} <span className={styles.price}>+{formatCurrency(ADD_ON_PRICES[addOn])}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
