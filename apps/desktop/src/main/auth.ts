/// <reference types="vite/client" />

import { createAuthClient } from 'better-auth/client'
import { electronClient } from '@better-auth/electron/client'
import { storage } from '@better-auth/electron/storage'

const productionWebURL = 'https://keeply-web-khaki.vercel.app'
const isLoopbackURL = (url: string): boolean => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url)

const configuredApiURL = import.meta.env.VITE_API_URL
const configuredWebURL = import.meta.env.VITE_WEB_URL

// Do not ship local development endpoints in a packaged build. The production
// web origin proxies /api requests to the API and matches the Google callback URL.
export const apiURL = import.meta.env.PROD && (!configuredApiURL || isLoopbackURL(configuredApiURL))
  ? productionWebURL
  : configuredApiURL || 'http://localhost:3000'
const webURL = import.meta.env.PROD && (!configuredWebURL || isLoopbackURL(configuredWebURL))
  ? productionWebURL
  : configuredWebURL || 'http://localhost:5174'

export const authClient = createAuthClient({
  baseURL: apiURL,
  plugins: [
    electronClient({
      signInURL: `${webURL}/sign-in`,
      protocol: { scheme: 'com.keeply.desktop' },
      storage: storage()
    })
  ]
})
