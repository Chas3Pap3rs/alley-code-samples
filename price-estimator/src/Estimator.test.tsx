import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Estimator, { DEFAULT_INPUT } from './Estimator';

const total = () => screen.getByRole('status');

describe('Estimator', () => {
  it('groups each question in a labelled fieldset with native controls', () => {
    render(<Estimator />);
    const services = screen.getByRole('group', { name: 'Choose a service' });
    expect(within(services).getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('group', { name: 'How often?' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Approximate square footage' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Laundry/ })).toBeInTheDocument();
  });

  it('shows the total in a polite live region', () => {
    render(<Estimator />);
    expect(total()).toHaveAttribute('aria-live', 'polite');
    expect(total()).toHaveTextContent('$150');
  });

  it('updates the total as answers change', async () => {
    const user = userEvent.setup();
    render(<Estimator />);

    await user.selectOptions(screen.getByLabelText('Approximate square footage'), '2000');
    expect(total()).toHaveTextContent('$210');

    await user.click(screen.getByRole('checkbox', { name: /Inside the oven/ }));
    expect(total()).toHaveTextContent('$260');
  });

  it('labels the open-ended tier as "10,000+"', () => {
    render(<Estimator />);
    expect(screen.getByRole('option', { name: '10,000+ sq ft' })).toBeInTheDocument();
  });

  it('snaps the size to a valid tier when the new service has a smaller table', async () => {
    const user = userEvent.setup();
    render(<Estimator />);
    const size = screen.getByLabelText('Approximate square footage');

    await user.selectOptions(size, '10000');
    await user.click(screen.getByRole('radio', { name: /Move in \/ move out/ }));

    expect(size).toHaveValue('5000');
    expect(total()).toHaveTextContent('$850');
  });

  it('switches to an allowed frequency when the service changes', async () => {
    const user = userEvent.setup();
    render(<Estimator />);

    await user.click(screen.getByRole('radio', { name: /Recurring clean/ }));
    const frequency = screen.getByRole('group', { name: 'How often?' });
    expect(within(frequency).getByRole('radio', { name: /Weekly/ })).toBeChecked();
    expect(within(frequency).queryByRole('radio', { name: 'One time' })).not.toBeInTheDocument();
    expect(total()).toHaveTextContent('$120'); // 150 × 0.8
  });

  it('asks for room counts only for rental turnovers', async () => {
    const user = userEvent.setup();
    render(<Estimator />);
    expect(screen.queryByLabelText('Bedrooms')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Rental turnover/ }));
    const bedrooms = screen.getByLabelText('Bedrooms');
    await user.clear(bedrooms);
    await user.type(bedrooms, '4');

    expect(total()).toHaveTextContent('$220'); // 180 base + 2 extra bedrooms × 20
    expect(screen.getByText('Extra rooms')).toBeInTheDocument();
  });

  it('asks for a custom quote instead of showing $0 when the size cannot be priced', () => {
    render(<Estimator initialInput={{ ...DEFAULT_INPUT, service: 'move-out', sqft: 20_000 }} />);
    expect(total()).toHaveTextContent('Custom quote');
    expect(screen.getByText(/quoted individually/)).toBeInTheDocument();
  });
});
