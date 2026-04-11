import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeedsPage from './FeedsPage';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../components/common/SearchFilterBar', () => ({
  default: ({ onFilterChange }) => (
    <div data-testid="search-filter-bar" onClick={() => onFilterChange({})}>SearchFilterBar</div>
  ),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div />,
  Marker: () => <div />,
  Popup: () => <div />,
}));

describe('FeedsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('renders the community feed header and no reports state', async () => {
    render(
      <MemoryRouter>
        <FeedsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Community Feed/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/No verified reports yet/i)).toBeInTheDocument();
    });
  });
});
