# Keeply Desktop

The desktop client is an Electron app built with React and TypeScript. It uses the Keeply API for account authentication and link storage, and opens a browser for Google sign-in.

## Development

Install the repository dependencies and configure `apps/desktop/.env.local` from `.env.example`:

```bash
pnpm install
cd apps/desktop && pnpm dev
```

Set `VITE_API_URL` to the API origin and `VITE_WEB_URL` to the web app origin. Development defaults to local services; packaged builds default to the Keeply Vercel web origin (`https://keeply-web-khaki.vercel.app`), which proxies API requests. For local development, run the API with `vc dev` from `apps/api` and the web app with `pnpm dev` from `apps/web` first. The Google OAuth client must allow the auth server callback URL, usually `<auth-base-url>/api/auth/callback/google`.

## Package installers

Run the build on the platform you want to package:

```bash
pnpm build:win
pnpm build:mac
pnpm build:linux
```

Output files are created in `dist/`. Set production API and web origins with `VITE_API_URL` and `VITE_WEB_URL` if deploying to different domains. macOS distribution also requires the appropriate signing and notarization setup.
