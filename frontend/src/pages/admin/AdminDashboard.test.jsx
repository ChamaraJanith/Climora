import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'AdminUser' }, logout: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes('/auth/users')) return Promise.resolve({ data: { users: [] } });
      if (url.includes('/alerts')) return Promise.resolve({ data: { pagination: { totalRecords: 0 } } });
      if (url.includes('/shelters')) return Promise.resolve({ data: { shelters: [] } });
      if (url.includes('/reports/admin/all')) return Promise.resolve({ data: { reports: [] } });
      if (url.includes('/weather/risk')) return Promise.resolve({ data: { risk: 'LOW' } });
      if (url.includes('/reports/stats/last-7-days')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin dashboard overview heading', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dashboard Overview/i })).toBeInTheDocument();
    });
  });
});
