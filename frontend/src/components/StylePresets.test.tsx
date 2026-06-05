import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import StylePresets from './StylePresets';
import { renderWithProviders } from '../test/test-utils';

describe('<StylePresets>', () => {
  it('renders all 8 preset chips', () => {
    renderWithProviders(<StylePresets onApply={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(8);
    expect(screen.getByRole('button', { name: /photorealistic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anime/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /studio ghibli/i })).toBeInTheDocument();
  });

  it('calls onApply with the correct suffix when a chip is clicked', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(<StylePresets onApply={onApply} />);

    await user.click(screen.getByRole('button', { name: /anime/i }));

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0]).toContain('anime style');
  });

  it('calls onApply with a different suffix for each preset', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(<StylePresets onApply={onApply} />);

    await user.click(screen.getByRole('button', { name: /pixel art/i }));
    expect(onApply.mock.calls[0][0]).toContain('pixel art');

    await user.click(screen.getByRole('button', { name: /cinematic/i }));
    expect(onApply.mock.calls[1][0]).toContain('cinematic');
  });

  it('disables all chips when disabled prop is true', () => {
    renderWithProviders(<StylePresets onApply={vi.fn()} disabled />);
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });

  it('chips are enabled by default', () => {
    renderWithProviders(<StylePresets onApply={vi.fn()} />);
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).not.toBeDisabled();
    }
  });
});
