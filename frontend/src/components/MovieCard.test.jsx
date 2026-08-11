import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MovieCard from './MovieCard';

const movie = { id: '1', title: 'Dune', poster_url: 'https://example.com/dune.jpg' };

describe('MovieCard', () => {
  it('renders a poster image when poster_url is set', () => {
    render(<MovieCard movie={movie} onClick={() => {}} />);

    const poster = screen.getByRole('img', { name: 'Dune' });
    expect(poster).toHaveAttribute('src', movie.poster_url);
  });

  it('falls back to the title when there is no poster', () => {
    render(<MovieCard movie={{ ...movie, poster_url: null }} onClick={() => {}} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('Dune').length).toBeGreaterThan(0);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<MovieCard movie={movie} onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
