/// <reference types="vite/client" />

import { createAuthClient } from 'better-auth/client'
import { electronClient } from '@better-auth/electron/client'
import { storage } from '@better-auth/electron/storage'

export const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const webURL = import.meta.env.VITE_WEB_URL || 'http://localhost:5174'

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
