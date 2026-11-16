# @keeply/desktop

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Browser sign-in configuration

Copy `.env.example` to `.env.local` and set `VITE_API_URL` to the Keeply API URL and
`VITE_WEB_URL` to the web app URL. The web app also needs `VITE_API_URL` set to that API URL.
Set `WEB_APP_URL` on the API to the web app's public origin so CORS and Better Auth trust it.
The Google OAuth client must allow the Better Auth callback at
`<BETTER_AUTH_URL>/api/auth/callback/google`.

For local development, run the API on port 3000 and the web app on port 5174 before starting
the desktop app.

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
