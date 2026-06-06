import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App (landing)', () => {
  it('renders the file picker and privacy promise when idle', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /choose a pdf/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never leave your device/i)).toBeInTheDocument();
  });
});
