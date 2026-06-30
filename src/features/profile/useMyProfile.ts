import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLink,
  deleteAward,
  deleteLink,
  getMyProfile,
  removeAvatar,
  reorderAwards,
  reorderLinks,
  updateAward,
  updateLink,
  updateMyProfile,
  uploadAvatar,
  uploadAward,
  type ProfileResponse,
} from '../../api/profile';
import { useAuthStore } from '../../stores/authStore';

const KEY = ['profile', 'me'];

/** GET /me/profile — the caller's own card (provisions on first call). */
export function useMyProfile() {
  const token = useAuthStore((s) => s.token);
  return useQuery<ProfileResponse>({
    queryKey: KEY,
    queryFn: getMyProfile,
    enabled: Boolean(token),
  });
}

/** Mutations for the owner's card; each refreshes the cached profile on success. */
export function useProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

  return {
    updateProfile: useMutation({ mutationFn: updateMyProfile, onSuccess: invalidate }),
    createLink: useMutation({ mutationFn: createLink, onSuccess: invalidate }),
    updateLink: useMutation({
      mutationFn: (vars: { id: string; label?: string; url?: string }) =>
        updateLink(vars.id, { label: vars.label, url: vars.url }),
      onSuccess: invalidate,
    }),
    deleteLink: useMutation({ mutationFn: (id: string) => deleteLink(id), onSuccess: invalidate }),
    reorderLinks: useMutation({ mutationFn: (ids: string[]) => reorderLinks(ids), onSuccess: invalidate }),
    uploadAvatar: useMutation({ mutationFn: (file: File) => uploadAvatar(file), onSuccess: invalidate }),
    removeAvatar: useMutation({ mutationFn: () => removeAvatar(), onSuccess: invalidate }),
    uploadAward: useMutation({ mutationFn: (file: File) => uploadAward(file), onSuccess: invalidate }),
    updateAward: useMutation({
      mutationFn: (vars: { id: string; description: string }) => updateAward(vars.id, vars.description),
      onSuccess: invalidate,
    }),
    deleteAward: useMutation({ mutationFn: (id: string) => deleteAward(id), onSuccess: invalidate }),
    reorderAwards: useMutation({ mutationFn: (ids: string[]) => reorderAwards(ids), onSuccess: invalidate }),
  };
}
