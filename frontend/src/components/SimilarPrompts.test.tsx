import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import SimilarPrompts from './SimilarPrompts';
import { renderWithProviders } from '../test/test-utils';
import * as queriesModule from '../api/queries';
import type { SimilarPromptsResponse } from '../types/api';

const FAKE_RESPONSE: SimilarPromptsResponse = {
  query: 'cat',
  items: [
    {
      id: 1,
      prompt: 'a fat orange cat',
      effective_prompt: 'a fat orange cat',
      score: 0.92,
      thumbnail_url: '/thumb1.webp',
    },
    {
      id: 2,
      prompt: 'a black cat sitting',
      effective_prompt: 'a black cat sitting',
      score: 0.81,
      thumbnail_url: '/thumb2.webp',
    },
  ],
};

function mockQuery(response: SimilarPromptsResponse) {
  vi.spyOn(queriesModule, 'useSimilarPrompts').mockReturnValue({
    data: response,
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof queriesModule.useSimilarPrompts>);
}

describe('<SimilarPrompts>', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders nothing when there are no items', () => {
    mockQuery({ query: 'cat', items: [] });
    renderWithProviders(<SimilarPrompts prompt="cat" onPick={vi.fn()} />);
    // Component returns null when items=[]. No buttons or list items should render.
    // (The container check is avoided because ToastProvider always renders its
    // viewport div even when empty, making toBeEmptyDOMElement() unreliable.)
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/similar past prompts/i)).not.toBeInTheDocument();
  });

  it('renders the list of similar prompts', () => {
    mockQuery(FAKE_RESPONSE);
    renderWithProviders(<SimilarPrompts prompt="cat" onPick={vi.fn()} />);
    expect(screen.getByText('a fat orange cat')).toBeInTheDocument();
    expect(screen.getByText('a black cat sitting')).toBeInTheDocument();
  });

  it('shows the similarity percentage badge', () => {
    mockQuery(FAKE_RESPONSE);
    renderWithProviders(<SimilarPrompts prompt="cat" onPick={vi.fn()} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
  });

  it('calls onPick with the correct prompt when an item is clicked', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    mockQuery(FAKE_RESPONSE);
    renderWithProviders(<SimilarPrompts prompt="cat" onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: /a fat orange cat/i }));
    expect(onPick).toHaveBeenCalledOnce();
    expect(onPick).toHaveBeenCalledWith('a fat orange cat');
  });
});
