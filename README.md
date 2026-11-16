# Keeply

Keeply is a personal link library for saving and organizing useful pages. Save a link with its title and details, then find it later with search, favorites, and archive tools. Keeply is available as a desktop app and as a web app, with Google sign-in.

![Keeply app icon](apps/desktop/build/icon.png)

Open the hosted web app at [keeply-web-khaki.vercel.app](https://keeply-web-khaki.vercel.app/).

## Apps

| App | Path | Description |
| --- | --- | --- |
| Web | `apps/web` | Browser app and browser-based sign-in flow for desktop. |
| API | `apps/api` | Authentication and persistent link storage. |
| Desktop | `apps/desktop` | Electron desktop client for Windows, macOS, and Linux. |

## Run locally

Requirements: Node.js and pnpm (the repository pins the pnpm version in `package.json`).

```bash
pnpm install
```

Configure each app using its `.env.example` file. The desktop app needs `VITE_API_URL` and `VITE_WEB_URL`; the web app needs `VITE_API_URL`. The API needs its database connection and authentication environment variables. Keep secrets in local environment files and deployment settings; do not commit them.

Start the API with the Vercel CLI from `apps/api`, and start the web and desktop apps in separate terminals:

```bash
cd apps/api && vc dev
pnpm --dir apps/web dev
pnpm --dir apps/desktop dev
```

For local browser sign-in, the API and web app must use matching auth URLs and trusted origins. Configure the Google OAuth client's authorized redirect URI to the API auth callback URL used by your deployment, typically `<auth-base-url>/api/auth/callback/google`.

## Build the desktop app

```bash
pnpm --dir apps/desktop build:win
pnpm --dir apps/desktop build:mac
pnpm --dir apps/desktop build:linux
```

Installers and packages are written under `apps/desktop/dist`. Build on the target operating system when possible, especially for macOS signing and notarization.

## Deployment

The web app and API can be deployed independently. Set their production environment variables in the hosting provider, including database credentials and auth secrets. Configure the web app's API proxy/base URL and add the public web and API origins to the auth provider's trusted origins. Set the Google OAuth callback URL to the auth server's callback endpoint. The desktop release must be built with the production API and web URLs configured.

## License

Keeply is licensed under the [MIT License](LICENSE).
