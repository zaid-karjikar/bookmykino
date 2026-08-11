import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MovieRow from './MovieRow';

const movies = [
  { id: '1', title: 'Dune', poster_url: null },
  { id: '2', title: 'Arrival', poster_url: null },
];

describe('MovieRow', () => {
  it('renders nothing when there are no movies', () => {
    const { container } = render(<MovieRow movies={[]} onMovieClick={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per movie', () => {
    render(<MovieRow movies={movies} onMovieClick={() => {}} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('calls onMovieClick with the movie id when a card is clicked', async () => {
    const onMovieClick = vi.fn();
    const user = userEvent.setup();
    render(<MovieRow movies={movies} onMovieClick={onMovieClick} />);

    await user.click(screen.getByRole('button', { name: /Arrival/ }));

    expect(onMovieClick).toHaveBeenCalledWith('2');
  });
});
