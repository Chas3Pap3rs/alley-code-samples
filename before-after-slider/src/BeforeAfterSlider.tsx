import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useCompareGroup } from './CompareGroup';
import { clampPosition, fittedHeight, positionFromKey, positionFromPointer } from './sliderMath';
import styles from './BeforeAfterSlider.module.css';

export interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  /** Accessible name for the slider control. */
  label?: string;
  /** Starting reveal position, 0–100. */
  initialPosition?: number;
  /** Tallest the slider may render, in pixels. */
  maxHeight?: number;
  /** Arrow-key increment, in percent. */
  step?: number;
  /** PageUp/PageDown and Shift+Arrow increment, in percent. */
  largeStep?: number;
  /**
   * Load both images eagerly with high fetch priority. Opt in only for a
   * slider that is above the fold; everything else lazy-loads.
   */
  priority?: boolean;
}

/**
 * Before/after image comparison following the WAI-ARIA slider pattern.
 *
 * The "after" image fills the frame and the "before" image is layered on top,
 * revealed with `clip-path: inset()` so dragging never triggers layout. The
 * whole frame is the pointer target and uses pointer capture, so one code path
 * covers mouse, touch, and pen, and a drag keeps tracking outside the frame.
 * The handle is a focusable `role="slider"` with full keyboard support.
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  label = 'Before and after comparison',
  initialPosition = 50,
  maxHeight = 480,
  step = 5,
  largeStep = 10,
  priority = false,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(() => clampPosition(initialPosition));
  const [desiredHeight, setDesiredHeight] = useState<number>();
  const [aspectRatio, setAspectRatio] = useState<number>();

  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);

  const group = useCompareGroup();
  const groupMemberId = useId();

  // Read the "after" image's natural proportions once it has loaded (or
  // immediately, if the browser already had it cached).
  const readAspectRatio = useCallback(() => {
    const image = afterImageRef.current;
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setAspectRatio(image.naturalWidth / image.naturalHeight);
    }
  }, []);

  useEffect(() => {
    if (afterImageRef.current?.complete) readAspectRatio();
  }, [afterSrc, readAspectRatio]);

  // Recompute the fitted height whenever the frame's width changes. A
  // ResizeObserver reacts to layout changes (not just window resizes) and
  // reuses the measured aspect ratio instead of reloading the image.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || aspectRatio === undefined) return;

    const update = () => setDesiredHeight(fittedHeight(frame.clientWidth, aspectRatio, maxHeight));
    update();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [aspectRatio, maxHeight]);

  // Share the height with sibling sliders when rendered inside a CompareGroup,
  // and withdraw it on unmount so the row can shrink again.
  const reportHeight = group?.reportHeight;

  useEffect(() => {
    reportHeight?.(groupMemberId, desiredHeight);
  }, [reportHeight, groupMemberId, desiredHeight]);

  useEffect(() => {
    if (!reportHeight) return;
    return () => reportHeight(groupMemberId, undefined);
  }, [reportHeight, groupMemberId]);

  const moveTo = (clientX: number) => {
    const frame = frameRef.current;
    if (frame) setPosition(positionFromPointer(clientX, frame.getBoundingClientRect()));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); // Prevent text selection and native image dragging.
    isDragging.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    handleRef.current?.focus({ preventScroll: true });
    // A touch might be the start of a vertical scroll (which the browser
    // claims via pointercancel), so only mouse and pen jump on press; touch
    // moves the slider once the finger actually drags sideways.
    if (event.pointerType !== 'touch') moveTo(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) moveTo(event.clientX);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = positionFromKey(event.key, position, { step, largeStep, shiftKey: event.shiftKey });
    if (next === null) return;
    event.preventDefault(); // Stop arrow keys and PageUp/PageDown from scrolling the page.
    setPosition(next);
  };

  const height = group?.height ?? desiredHeight;
  const rounded = Math.round(position);
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      style={{ height, maxHeight, '--position': `${position}%` } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <img
        ref={afterImageRef}
        className={styles.image}
        src={afterSrc}
        alt={afterAlt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        onLoad={readAspectRatio}
      />
      <img
        className={`${styles.image} ${styles.before}`}
        src={beforeSrc}
        alt={beforeAlt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        data-testid="before-image"
      />

      <span className={`${styles.tag} ${styles.tagBefore}`} aria-hidden="true">
        Before
      </span>
      <span className={`${styles.tag} ${styles.tagAfter}`} aria-hidden="true">
        After
      </span>

      <div
        ref={handleRef}
        className={styles.handle}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={`${rounded}% of the before image shown`}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.grip} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      </div>
    </div>
  );
}
