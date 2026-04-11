import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShelterDashboard from './ShelterDashboard';

vi.mock('axios', () => ({
  get: vi.fn(() => Promise.resolve({ data: [] })),
  delete: vi.fn(() => Promise.resolve({})),
  post: vi.fn(() => Promise.resolve({})),
  put: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'ShelterUser' } }),
}));

describe('ShelterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the shelter management header and add shelter button', async () => {
    render(
      <MemoryRouter>
        <ShelterDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Shelter Management/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add Shelter/i })).toBeInTheDocument();
  });
});
