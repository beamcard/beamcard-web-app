import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MyProfilePage } from './MyProfilePage';
import {
  createLink,
  deleteLink,
  getMyProfile,
  reorderLinks,
  updateLink,
  updateMyProfile,
  uploadAvatar,
  type ProfileResponse,
} from '../api/profile';
import { useAuthStore } from '../stores/authStore';

vi.mock('../api/profile', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  createLink: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
  reorderLinks: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  AVATAR_CONTENT_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  AVATAR_MAX_BYTES: 2 * 1024 * 1024,
}));

const getMyProfileMock = vi.mocked(getMyProfile);
const createLinkMock = vi.mocked(createLink);
const uploadAvatarMock = vi.mocked(uploadAvatar);

const PROFILE: ProfileResponse = {
  id: 'p1',
  username: 'alice',
  display_name: 'Alice',
  bio: 'Guide',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  links: [{ id: 'l1', label: 'Website', url: 'https://alice.example', type: 'GENERIC', position: 0 }],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MyProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MyProfilePage', () => {
  beforeEach(() => {
    vi.mocked(getMyProfile).mockReset();
    vi.mocked(updateMyProfile).mockReset();
    vi.mocked(createLink).mockReset();
    vi.mocked(updateLink).mockReset();
    vi.mocked(deleteLink).mockReset();
    vi.mocked(reorderLinks).mockReset();
    vi.mocked(uploadAvatar).mockReset();
    useAuthStore.getState().setToken('test-token');
  });

  it('loads the profile and shows existing links', async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    renderPage();

    expect(await screen.findByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
  });

  it('uploads a selected avatar image', async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    uploadAvatarMock.mockResolvedValue({ ...PROFILE, avatar_url: 'http://minio/beamcard-avatars/a.png' });
    renderPage();
    await screen.findByDisplayValue('Alice');

    const file = new File([new Uint8Array([1, 2, 3])], 'me.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => expect(uploadAvatarMock).toHaveBeenCalledWith(file));
  });

  it('rejects an oversized or wrong-type avatar before uploading', async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    renderPage();
    await screen.findByDisplayValue('Alice');

    const pdf = new File([new Uint8Array([1])], 'doc.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Bypass the input's accept filter so the component's own guard runs.
    await userEvent.upload(input, pdf, { applyAccept: false });

    expect(await screen.findByText(/PNG, JPEG, or WebP/i)).toBeInTheDocument();
    expect(uploadAvatarMock).not.toHaveBeenCalled();
  });

  it('creates a link from the add form', async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    createLinkMock.mockResolvedValue({
      id: 'l2',
      label: 'Insta',
      url: 'https://instagram.com/alice',
      type: 'INSTAGRAM',
      position: 1,
    });
    renderPage();
    await screen.findByDisplayValue('Alice');

    // Typed link: pick the platform, no separate label — it's derived.
    await userEvent.selectOptions(screen.getByLabelText('Link type'), 'INSTAGRAM');
    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Instagram link'), 'https://instagram.com/alice');
    await userEvent.click(screen.getByRole('button', { name: /add link/i }));

    await waitFor(() =>
      // TanStack Query 5 passes a second context arg to the mutationFn.
      expect(createLinkMock).toHaveBeenCalledWith(
        { label: 'Instagram', url: 'https://instagram.com/alice', type: 'INSTAGRAM' },
        expect.anything(),
      ),
    );
  });
});
