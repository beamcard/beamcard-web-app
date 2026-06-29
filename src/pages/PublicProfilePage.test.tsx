import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicProfilePage } from './PublicProfilePage';
import { getPublicProfile, type ProfileResponse } from '../api/profile';
import { ApiError } from '../api/client';

vi.mock('../api/profile', () => ({
  getPublicProfile: vi.fn(),
  publicVcardUrl: (u: string) => `http://localhost:8080/profiles/@${u}/vcard`,
}));

const getPublicProfileMock = vi.mocked(getPublicProfile);

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:handle" element={<PublicProfilePage />} />
          <Route path="/app" element={<div>App home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PublicProfilePage', () => {
  beforeEach(() => {
    getPublicProfileMock.mockReset();
  });

  it('renders the card for an existing username', async () => {
    const profile: ProfileResponse = {
      id: 'uuid',
      username: 'alice',
      display_name: 'Alice Guide',
      bio: 'Mountain guide',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      links: [
        { id: 'l1', label: 'My site', url: 'https://alice.example', type: 'GENERIC', position: 0 },
      ],
    };
    getPublicProfileMock.mockResolvedValue(profile);

    renderAt('/@alice');

    expect(await screen.findByText('Alice Guide')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('Mountain guide')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'My site' });
    expect(link).toHaveAttribute('href', 'https://alice.example');
    const saveContact = screen.getByRole('link', { name: /save contact/i });
    expect(saveContact).toHaveAttribute('href', 'http://localhost:8080/profiles/@alice/vcard');
    expect(getPublicProfileMock).toHaveBeenCalledWith('alice');
  });

  it('shows the location line when the profile has one', async () => {
    getPublicProfileMock.mockResolvedValue({
      id: 'uuid',
      username: 'alice',
      display_name: 'Alice Guide',
      location: { country: 'Austria', city: 'Vienna', address: 'Stephansplatz 1' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      links: [],
    });

    renderAt('/@alice');

    expect(await screen.findByText(/Stephansplatz 1, Vienna, Austria/)).toBeInTheDocument();
  });

  it('shows a not-found state on 404 profile_not_found', async () => {
    getPublicProfileMock.mockRejectedValue(
      new ApiError(404, 'Not Found', { code: 'profile_not_found' }),
    );

    renderAt('/@ghost');

    expect(await screen.findByText(/doesn't exist/i)).toBeInTheDocument();
  });

  it('redirects bare (non-@) paths to the app', async () => {
    renderAt('/random');

    expect(await screen.findByText('App home')).toBeInTheDocument();
    expect(getPublicProfileMock).not.toHaveBeenCalled();
  });
});
