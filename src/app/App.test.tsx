import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App (Phase 0 skeleton)', () => {
  it('renders the upload button and privacy promise', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /upload a pdf/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never leave your device/i)).toBeInTheDocument();
  });
});
