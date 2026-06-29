import { Navigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { problemOf } from '../api/problem';
import { publicVcardUrl, type Affiliation, type ProfileResponse } from '../api/profile';
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
      problemOf(error)?.code === 'profile_not_found' || (error instanceof ApiError && error.status === 404);
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
  const name = profile.display_name ?? `@${profile.username}`;
  const workplaces = profile.affiliations ?? [];

  return (
    <Page>
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <Avatar url={profile.avatar_url} name={name} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
        <p className="mt-0.5 text-sm text-slate-500">@{profile.username}</p>

        {primaryLocation(profile) && (
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500">
            <span aria-hidden="true">📍</span>
            {primaryLocation(profile)}
          </p>
        )}

        {profile.bio && (
          <p className="mx-auto mt-4 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
            {profile.bio}
          </p>
        )}

        <a
          href={publicVcardUrl(profile.username)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[.99]"
        >
          <span aria-hidden="true">＋</span> Save contact
        </a>

        {links.length > 0 && (
          <ul className="mt-4 space-y-3">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[.99]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {workplaces.length > 0 && (
          <section className="mt-8 text-left">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Where to find me</h2>
            <ul className="mt-3 space-y-3">
              {workplaces.map((a, i) => (
                <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  {roleLine(a) && <p className="text-sm font-semibold text-slate-800">{roleLine(a)}</p>}
                  {a.address && <p className="mt-0.5 text-sm text-slate-600">{a.address}</p>}
                  {a.description && <p className="mt-0.5 text-xs italic text-slate-400">{a.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">Made with Beamcard</p>
    </Page>
  );
}

function Avatar({ url, name }: { url?: string; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md"
      />
    );
  }
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-semibold text-indigo-600 ring-4 ring-white shadow-md">
      {name.replace(/^@/, '').charAt(0).toUpperCase()}
    </div>
  );
}

/** "Role · Organization" for one workplace — skips whichever part is blank. */
function roleLine(affiliation: Affiliation): string {
  return [affiliation.role, affiliation.organization].filter(Boolean).join(' · ');
}

/** "City, Country" — the profile's primary location; skips any blank part. */
function primaryLocation(profile: ProfileResponse): string {
  const loc = profile.location;
  return loc ? [loc.city, loc.country].filter(Boolean).join(', ') : '';
}

/** Soft full-height backdrop that centres the card (mobile-first). */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">{children}</div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Page>
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200/70">
        {children}
      </div>
    </Page>
  );
}
