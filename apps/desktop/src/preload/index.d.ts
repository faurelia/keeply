import { ElectronAPI } from '@electron-toolkit/preload'
import type { authClient } from '../main/auth'
import type { AddLinkValues } from '../renderer/src/lib/schemas/link'

type SavedLink = Omit<AddLinkValues, 'description'> & {
  description: string | null
  isArchived: boolean
  id: string
  createdAt: string
  updatedAt: string
}

declare global {
  type Bridges = typeof authClient.$Infer.Bridges
  interface Window extends Bridges {
    electron: ElectronAPI
    api: unknown
    keeply: {
      links: {
        list: () => Promise<{ links: SavedLink[] }>
        create: (input: AddLinkValues) => Promise<{ link: SavedLink }>
        update: (id: string, input: Partial<AddLinkValues> & { isArchived?: boolean }) => Promise<{ link: SavedLink }>
        delete: (id: string) => Promise<{ success: true }>
      }
    }
  }
}
