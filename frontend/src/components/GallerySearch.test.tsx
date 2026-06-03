import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import GallerySearch from './GallerySearch';
import type { GalleryFilters } from '../types/api';

const EMPTY: GalleryFilters = { q: '', size: '', quality: '', background: '' };

describe('<GallerySearch>', () => {
  it('renders the search input and filter dropdowns', () => {
    render(<GallerySearch filters={EMPTY} onChange={vi.fn()} resultCount={0} />);
    expect(screen.getByPlaceholderText(/search by prompt/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/any size/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/any quality/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/any background/i)).toBeInTheDocument();
  });

  it('emits onChange when typing in the search box', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GallerySearch filters={EMPTY} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(/search by prompt/i), 'cat');

    // userEvent.type fires one event per character.
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY, q: 't' });
  });

  it('shows the result count when no filters are active', () => {
    render(<GallerySearch filters={EMPTY} onChange={vi.fn()} resultCount={42} />);
    expect(screen.getByText(/42 total/)).toBeInTheDocument();
  });

  it('shows "matches" wording when a filter is active', () => {
    render(
      <GallerySearch
        filters={{ ...EMPTY, q: 'cat' }}
        onChange={vi.fn()}
        resultCount={3}
      />
    );
    expect(screen.getByText(/3 matches/)).toBeInTheDocument();
  });

  it('clears all filters via the "Clear filters" link', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <GallerySearch
        filters={{ q: 'cat', size: '1024x1024', quality: '', background: '' }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onChange).toHaveBeenCalledWith({ q: '', size: '', quality: '', background: '' });
  });
});
