import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContentDashboard from './ContentDashboard';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'ContentManager' }, logout: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({})),
    put: vi.fn(() => Promise.resolve({})),
  },
}));

describe('ContentDashboard', () => {
  beforeAll(() => {
    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the content manager overview and welcome text', async () => {
    render(
      <MemoryRouter>
        <ContentDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/Content Hub/i)).toBeInTheDocument();
    });
  });
});
