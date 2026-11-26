import { clampPosition, fittedHeight, positionFromKey, positionFromPointer } from './sliderMath';

describe('clampPosition', () => {
  it('keeps values within 0–100', () => {
    expect(clampPosition(-12)).toBe(0);
    expect(clampPosition(42)).toBe(42);
    expect(clampPosition(140)).toBe(100);
  });
});

describe('positionFromPointer', () => {
  const rect = { left: 100, width: 400 };

  it('converts a pointer coordinate into a percentage of the frame', () => {
    expect(positionFromPointer(300, rect)).toBe(50);
    expect(positionFromPointer(200, rect)).toBe(25);
  });

  it('clamps pointers that leave the frame mid-drag', () => {
    expect(positionFromPointer(0, rect)).toBe(0);
    expect(positionFromPointer(900, rect)).toBe(100);
  });

  it('handles a zero-width frame without dividing by zero', () => {
    expect(positionFromPointer(50, { left: 0, width: 0 })).toBe(0);
  });
});

describe('positionFromKey', () => {
  const options = { step: 5, largeStep: 10 };

  it.each([
    ['ArrowRight', 55],
    ['ArrowUp', 55],
    ['ArrowLeft', 45],
    ['ArrowDown', 45],
    ['PageUp', 60],
    ['PageDown', 40],
    ['Home', 0],
    ['End', 100],
  ])('%s moves from 50 to %i', (key, expected) => {
    expect(positionFromKey(key, 50, options)).toBe(expected);
  });

  it('uses the large step when Shift is held', () => {
    expect(positionFromKey('ArrowRight', 50, { ...options, shiftKey: true })).toBe(60);
  });

  it('never steps past the ends', () => {
    expect(positionFromKey('ArrowRight', 98, options)).toBe(100);
    expect(positionFromKey('ArrowLeft', 3, options)).toBe(0);
  });

  it('ignores keys the slider does not own', () => {
    expect(positionFromKey('Tab', 50, options)).toBeNull();
    expect(positionFromKey('a', 50, options)).toBeNull();
  });
});

describe('fittedHeight', () => {
  it('scales the image to the container width', () => {
    expect(fittedHeight(800, 4 / 3, 1000)).toBe(600);
  });

  it('caps the height at the maximum', () => {
    expect(fittedHeight(800, 1, 480)).toBe(480);
  });
});
