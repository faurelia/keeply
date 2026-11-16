import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { setupRenderer } from '@better-auth/electron/preload'

// Custom APIs for renderer
const api = {}
const keeply = {
  links: {
    list: () => ipcRenderer.invoke('keeply:links:list'),
    create: (input: { url: string; title: string; description: string; isFavorite: boolean }) =>
      ipcRenderer.invoke('keeply:links:create', input),
    update: (id: string, input: Partial<{ url: string; title: string; description: string; isFavorite: boolean; isArchived: boolean }>) =>
      ipcRenderer.invoke('keeply:links:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('keeply:links:delete', id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('keeply', keeply)
    setupRenderer()
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.keeply = keeply
  setupRenderer()
}
