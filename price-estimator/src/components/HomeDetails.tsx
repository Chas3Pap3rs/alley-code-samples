import { useId } from 'react';
import { RENTAL_EXTRAS, SQFT_PRICING, formatTierLabel, type Service } from '../estimator';
import styles from '../Estimator.module.css';

const MAX_ROOMS = 20;

interface HomeDetailsProps {
  service: Service;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  onSqftChange: (sqft: number) => void;
  onRoomsChange: (rooms: { bedrooms?: number; bathrooms?: number }) => void;
}

function toRoomCount(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), MAX_ROOMS);
}

export function HomeDetails({ service, sqft, bedrooms, bathrooms, onSqftChange, onRoomsChange }: HomeDetailsProps) {
  const id = useId();
  const showRooms = service === 'rental-turnover'; // Only rentals price by room count.

  return (
    <fieldset className={styles.step}>
      <legend className={styles.legend}>Tell us about your home</legend>

      <div className={styles.field}>
        <label htmlFor={`${id}-sqft`}>Approximate square footage</label>
        <select id={`${id}-sqft`} value={sqft} onChange={(event) => onSqftChange(Number(event.target.value))}>
          {SQFT_PRICING[service].map((tier) => (
            <option key={tier.min} value={tier.min}>
              {formatTierLabel(tier)}
            </option>
          ))}
        </select>
      </div>

      {showRooms && (
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor={`${id}-bedrooms`}>Bedrooms</label>
            <input
              id={`${id}-bedrooms`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_ROOMS}
              value={bedrooms}
              aria-describedby={`${id}-rooms-hint`}
              onChange={(event) => onRoomsChange({ bedrooms: toRoomCount(event.target.value) })}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-bathrooms`}>Bathrooms</label>
            <input
              id={`${id}-bathrooms`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_ROOMS}
              value={bathrooms}
              aria-describedby={`${id}-rooms-hint`}
              onChange={(event) => onRoomsChange({ bathrooms: toRoomCount(event.target.value) })}
            />
          </div>
          <p id={`${id}-rooms-hint`} className={styles.hint}>
            Includes {RENTAL_EXTRAS.includedRooms} bedrooms and {RENTAL_EXTRAS.includedRooms} bathrooms.
          </p>
        </div>
      )}
    </fieldset>
  );
}
