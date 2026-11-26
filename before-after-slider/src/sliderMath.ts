/**
 * Pure helpers for the comparison slider. Kept separate from the component so
 * the interaction rules can be unit-tested without rendering anything.
 */

export const MIN_POSITION = 0;
export const MAX_POSITION = 100;

/** Clamp a reveal position to the 0–100 range. */
export function clampPosition(value: number): number {
  return Math.min(MAX_POSITION, Math.max(MIN_POSITION, value));
}

/**
 * Convert a pointer's horizontal coordinate into a reveal percentage relative
 * to the slider's bounding box. Pointers outside the box clamp to the edges.
 */
export function positionFromPointer(clientX: number, rect: Pick<DOMRect, 'left' | 'width'>): number {
  if (rect.width <= 0) return MIN_POSITION;
  return clampPosition(((clientX - rect.left) / rect.width) * 100);
}

/**
 * Resolve the next position for a keyboard interaction, following the WAI-ARIA
 * slider pattern. Returns `null` for keys the slider does not handle so the
 * caller can let the browser keep its default behavior (e.g. Tab).
 */
export function positionFromKey(
  key: string,
  current: number,
  { step, largeStep, shiftKey = false }: { step: number; largeStep: number; shiftKey?: boolean },
): number | null {
  const increment = shiftKey ? largeStep : step;

  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clampPosition(current + increment);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampPosition(current - increment);
    case 'PageUp':
      return clampPosition(current + largeStep);
    case 'PageDown':
      return clampPosition(current - largeStep);
    case 'Home':
      return MIN_POSITION;
    case 'End':
      return MAX_POSITION;
    default:
      return null;
  }
}

/**
 * Height a slider should render at: the image's natural height when scaled to
 * the container width, capped at `maxHeight`.
 */
export function fittedHeight(containerWidth: number, aspectRatio: number, maxHeight: number): number {
  if (containerWidth <= 0 || aspectRatio <= 0) return maxHeight;
  return Math.min(containerWidth / aspectRatio, maxHeight);
}
