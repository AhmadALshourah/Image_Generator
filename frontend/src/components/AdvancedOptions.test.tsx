import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AdvancedOptions, { type AdvancedOptionsValues } from './AdvancedOptions';
import { renderWithProviders } from '../test/test-utils';

const DEFAULTS: AdvancedOptionsValues = {
  size: '1024x1024',
  quality: 'auto',
  background: 'auto',
  output_format: 'png',
  force: false,
};

describe('<AdvancedOptions>', () => {
  it('is collapsed by default', () => {
    renderWithProviders(<AdvancedOptions values={DEFAULTS} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/^size$/i)).not.toBeInTheDocument();
  });

  it('expands when the header is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdvancedOptions values={DEFAULTS} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /advanced options/i }));

    expect(screen.getByLabelText(/^size$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^quality$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^background$/i)).toBeInTheDocument();
    // Label key 'formatLabel' translates to "Format" (not "Output format")
    expect(screen.getByLabelText(/^format$/i)).toBeInTheDocument();
  });

  it('emits the new value through onChange when a select changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<AdvancedOptions values={DEFAULTS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /advanced options/i }));
    await user.selectOptions(screen.getByLabelText(/^quality$/i), 'high');

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULTS, quality: 'high' });
  });

  it('toggles the force-regeneration checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<AdvancedOptions values={DEFAULTS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /advanced options/i }));
    await user.click(screen.getByLabelText(/force re-generation/i));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULTS, force: true });
  });
});
