import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DemoNotice from './DemoNotice';

describe('DemoNotice', () => {
  it('discloses that screening times are generated', () => {
    render(<DemoNotice />);

    expect(screen.getByText(/Screening times are generated sample data/)).toBeInTheDocument();
  });

  it('links to the explanation in the repo README', () => {
    render(<DemoNotice />);

    const link = screen.getByRole('link', { name: 'Why?' });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/zaid-karjikar/bookmykino#data-status'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});
