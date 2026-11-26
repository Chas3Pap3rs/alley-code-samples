import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BeforeAfterSlider from './BeforeAfterSlider';
import { CompareGroup } from './CompareGroup';

const images = {
  beforeSrc: '/before.jpg',
  afterSrc: '/after.jpg',
  beforeAlt: 'Countertop before',
  afterAlt: 'Countertop after',
};

function revealStyle() {
  return screen.getByTestId('before-image').parentElement!.style.getPropertyValue('--position');
}

/** jsdom has no layout engine, so give the after image natural dimensions and fire its load event. */
function loadAfterImage(image: HTMLImageElement, width: number, height: number) {
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width });
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: height });
  fireEvent.load(image);
}

describe('BeforeAfterSlider', () => {
  it('exposes an accessible slider with its current value', () => {
    render(<BeforeAfterSlider {...images} />);
    const slider = screen.getByRole('slider', { name: 'Before and after comparison' });

    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '50% of the before image shown');
    expect(screen.getByAltText('Countertop before')).toBeInTheDocument();
    expect(screen.getByAltText('Countertop after')).toBeInTheDocument();
  });

  it('is reachable with Tab and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider {...images} />);
    const slider = screen.getByRole('slider');

    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    expect(revealStyle()).toBe('55%');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '45');
  });

  it('supports Shift+Arrow, PageUp/PageDown, Home, and End', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider {...images} />);
    const slider = screen.getByRole('slider');
    slider.focus();

    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(slider).toHaveAttribute('aria-valuenow', '60');

    await user.keyboard('{PageDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '50');

    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');

    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');

    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
    expect(slider).toHaveAttribute('aria-valuetext', '0% of the before image shown');
  });

  it('respects custom step sizes and a clamped initial position', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider {...images} initialPosition={150} step={1} largeStep={25} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '100');

    slider.focus();
    await user.keyboard('{ArrowLeft}{PageDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '74');
  });

  it('jumps to the pointer position and follows a drag', () => {
    render(<BeforeAfterSlider {...images} />);
    const slider = screen.getByRole('slider');
    const frame = screen.getByTestId('before-image').parentElement!;
    frame.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;

    fireEvent.pointerDown(frame, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 50 });
    expect(slider).toHaveAttribute('aria-valuenow', '25');
    expect(slider).toHaveFocus();

    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 150 });
    expect(slider).toHaveAttribute('aria-valuenow', '75');

    fireEvent.pointerUp(frame, { pointerId: 1 });
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 10 });
    expect(slider).toHaveAttribute('aria-valuenow', '75');
  });

  it('does not jump on touch press, so a vertical swipe can scroll the page', () => {
    render(<BeforeAfterSlider {...images} />);
    const slider = screen.getByRole('slider');
    const frame = screen.getByTestId('before-image').parentElement!;
    frame.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;

    fireEvent.pointerDown(frame, { pointerId: 2, pointerType: 'touch', clientX: 20 });
    expect(slider).toHaveAttribute('aria-valuenow', '50');

    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 40 });
    expect(slider).toHaveAttribute('aria-valuenow', '20');

    fireEvent.pointerCancel(frame, { pointerId: 2 });
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 180 });
    expect(slider).toHaveAttribute('aria-valuenow', '20');
  });

  it('ignores secondary mouse buttons', () => {
    render(<BeforeAfterSlider {...images} />);
    const frame = screen.getByTestId('before-image').parentElement!;
    frame.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;

    fireEvent.pointerDown(frame, { pointerId: 1, pointerType: 'mouse', button: 2, clientX: 20 });
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');
  });

  it('lazy-loads images unless priority is opted in', () => {
    const { rerender } = render(<BeforeAfterSlider {...images} />);
    expect(screen.getByAltText('Countertop after')).toHaveAttribute('loading', 'lazy');

    rerender(<BeforeAfterSlider {...images} priority />);
    expect(screen.getByAltText('Countertop after')).toHaveAttribute('loading', 'eager');
    expect(screen.getByAltText('Countertop before')).toHaveAttribute('fetchpriority', 'high');
  });

  it('sizes itself from the image and shares the tallest height across a CompareGroup', () => {
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    render(
      <CompareGroup>
        <BeforeAfterSlider {...images} afterAlt="Square photo" maxHeight={1000} />
        <BeforeAfterSlider {...images} afterAlt="Wide photo" maxHeight={1000} />
      </CompareGroup>,
    );

    act(() => loadAfterImage(screen.getByAltText('Wide photo') as HTMLImageElement, 1600, 800));
    const frames = screen.getAllByRole('slider').map((slider) => slider.parentElement!);
    expect(frames.map((frame) => frame.style.height)).toEqual(['200px', '200px']);

    act(() => loadAfterImage(screen.getByAltText('Square photo') as HTMLImageElement, 800, 800));
    expect(frames.map((frame) => frame.style.height)).toEqual(['400px', '400px']);

    width.mockRestore();
  });
});
