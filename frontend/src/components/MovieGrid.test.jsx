import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MovieGrid from './MovieGrid';

const movies = [
  { id: '1', title: 'Dune', poster_url: null },
  { id: '2', title: 'Arrival', poster_url: null },
];

describe('MovieGrid', () => {
  it('renders a card per movie', () => {
    render(<MovieGrid movies={movies} onMovieClick={() => {}} page={0} totalPages={1} onPageChange={() => {}} />);

    expect(screen.getAllByRole('button', { name: /Dune|Arrival/ })).toHaveLength(2);
  });

  it('calls onMovieClick with the movie id when a card is clicked', async () => {
    const onMovieClick = vi.fn();
    const user = userEvent.setup();
    render(
      <MovieGrid movies={movies} onMovieClick={onMovieClick} page={0} totalPages={1} onPageChange={() => {}} />
    );

    await user.click(screen.getByRole('button', { name: 'Dune' }));

    expect(onMovieClick).toHaveBeenCalledWith('1');
  });

  it('hides pagination when there is only one page', () => {
    render(<MovieGrid movies={movies} onMovieClick={() => {}} page={0} totalPages={1} onPageChange={() => {}} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders one dot per page and marks the current page as active', () => {
    render(<MovieGrid movies={movies} onMovieClick={() => {}} page={1} totalPages={3} onPageChange={() => {}} />);

    const dots = screen.getAllByRole('button', { name: /^Page \d$/ });
    expect(dots).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange with the zero-based page index', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<MovieGrid movies={movies} onMovieClick={() => {}} page={0} totalPages={2} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
