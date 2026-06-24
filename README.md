# beamcard-web-app

> React frontend for Beamcard. Currently exposes the **/signup** flow against
> [user-service](https://github.com/brazuca-eg/user-service). Will grow into
> the full creator UI as backend stories ship.

**Status:** 🚧 BC-1 only — signup form working end-to-end against user-service.

---

## Stack

| Concern | Pick |
|---|---|
| Build | Vite |
| Language | TypeScript |
| UI | React 19 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Client state | Zustand (not used yet) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 4 |
| Testing | Vitest + Testing Library |

## Project layout

```
src/
├── api/
│   ├── client.ts           ← fetch wrapper, ApiError class
│   └── auth.ts             ← signup() + DTO types (mirrors backend)
├── features/auth/
│   ├── schema.ts           ← Zod schema mirroring backend validation
│   ├── SignupForm.tsx      ← form component
│   └── SignupForm.test.tsx
├── pages/
│   └── SignupPage.tsx
├── test/
│   └── setup.ts            ← Vitest global setup (jest-dom matchers)
├── index.css               ← Tailwind import
└── main.tsx                ← QueryClient + Router + entry
```

## Prerequisites

- **Node.js 22+** (LTS recommended; tested on Node 25 too)
- **user-service** running on `http://localhost:8070` ([instructions](https://github.com/brazuca-eg/user-service))

## Local development

```bash
npm install                 # one-time
npm run dev                 # Vite dev server on http://localhost:5173
```

Open <http://localhost:5173> → redirected to `/signup` → fill the form → submit.

The dev server proxies nothing — the React app calls `http://localhost:8070`
directly, so CORS has to be enabled on the backend (it is, in `user-rest`).

### Configuration

| Env var | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8070` | user-service base URL. Override via `.env.local` for staging. |

## Tests

```bash
npm run test                # watch mode
npm run test:run            # one-shot (for CI)
```

The `SignupForm` test covers:
- Client-side validation (empty submit shows per-field errors)
- Happy-path submission calls the API and invokes `onSuccess`
- 409 `email_taken` → email field error
- 409 `username_taken` → username field error

## Production build

```bash
npm run build               # outputs to dist/
npm run preview             # serves the built bundle on :4173
```

## Backlog (next features as backend stories land)

| Backend story | Frontend addition |
|---|---|
| BC-2 login | `/login` route, store JWT, route guard |
| BC-3 `GET /auth/me` | Hydrate "current user" on app start |
| BC-5 username availability | Async validator on signup form |
| BC-6 refresh tokens | Silent refresh interceptor in `api/client.ts` |
| BC-9 Google sign-in | "Sign in with Google" button on `/signup` and `/login` |
