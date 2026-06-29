import { Navigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { problemOf } from '../api/problem';
import { publicVcardUrl, type ProfileResponse } from '../api/profile';
import { usePublicProfile } from '../features/profile/usePublicProfile';

/**
 * Public card at /@username (e.g. /@alice). Anonymous — no auth. The route
 * captures the whole `@handle` segment; non-`@` paths fall back to the app.
 */
export function PublicProfilePage() {
  const { handle } = useParams();
  const username = handle?.startsWith('@') ? handle.slice(1) : undefined;
  const { data, isLoading, isError, error } = usePublicProfile(username);

  // A bare segment without the `@` isn't a card — preserve the app catch-all.
  if (!username) {
    return <Navigate to="/app" replace />;
  }

  if (isLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (isError || !data) {
    const notFound =
      problemOf(error)?.code === 'profile_not_found' ||
      (error instanceof ApiError && error.status === 404);
    return notFound ? (
      <Centered>
        <p className="text-lg font-semibold text-slate-900">@{username}</p>
        <p className="mt-1 text-sm text-slate-500">This card doesn't exist (yet).</p>
      </Centered>
    ) : (
      <Centered>
        <p className="text-sm text-red-600">Couldn't load this card.</p>
      </Centered>
    );
  }

  return <Card profile={data} />;
}

function Card({ profile }: { profile: ProfileResponse }) {
  const links = [...profile.links].sort((a, b) => a.position - b.position);
  return (
    <div className="max-w-md mx-auto mt-20 p-6 text-center">
      {profile.avatar_url && (
        <img
          src={profile.avatar_url}
          alt={profile.display_name ?? profile.username}
          className="h-24 w-24 rounded-full object-cover mx-auto mb-4 border border-slate-200"
        />
      )}
      <h1 className="text-2xl font-bold text-slate-900">{profile.display_name ?? `@${profile.username}`}</h1>
      <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
      {profile.bio && <p className="mt-4 text-slate-700 whitespace-pre-line">{profile.bio}</p>}
      {locationLine(profile) && (
        <p className="mt-3 text-sm text-slate-500">📍 {locationLine(profile)}</p>
      )}
      <a
        href={publicVcardUrl(profile.username)}
        className="mt-6 inline-block w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
      >
        Save contact
      </a>
      {links.length > 0 && (
        <ul className="mt-6 space-y-2">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 px-4 border border-slate-300 rounded-md text-indigo-700 hover:bg-slate-50 transition"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Address, City, Country" — skips any parts the user left blank. */
function locationLine(profile: ProfileResponse): string {
  const loc = profile.location;
  return loc ? [loc.address, loc.city, loc.country].filter(Boolean).join(', ') : '';
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="max-w-md mx-auto mt-20 p-6 text-center text-slate-600">{children}</div>;
}
