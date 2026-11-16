import { app, shell, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { apiURL, authClient } from './auth'
import { addLinkSchema } from '../renderer/src/lib/schemas/link'
import { z } from 'zod'

const updateLinkSchema = addLinkSchema.partial().extend({ isArchived: z.boolean().optional() })

authClient.setupMain()

app.setName('Keeply')

function assertTrustedRenderer(event: IpcMainInvokeEvent): void {
  const frame = event.senderFrame
  if (!frame || frame !== event.sender.mainFrame) {
    throw new Error('Link requests must come from the main application window.')
  }

  const frameURL = new URL(frame.url)
  if (is.dev) {
    const rendererURL = process.env['ELECTRON_RENDERER_URL']
    if (!rendererURL || frameURL.origin !== new URL(rendererURL).origin) {
      throw new Error('Untrusted renderer origin.')
    }
  } else if (frameURL.protocol !== 'file:') {
    throw new Error('Untrusted renderer origin.')
  }
}

async function requestLinksAPI(
  event: IpcMainInvokeEvent,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path = '',
  body?: unknown
) {
  assertTrustedRenderer(event)
  const cookie = authClient.getCookie()
  if (!cookie) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(new URL(`/api/links${path}`, apiURL), {
    method,
    headers: {
      cookie,
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
        ? result.error
        : `Could not ${method === 'GET' ? 'load' : method === 'DELETE' ? 'remove' : 'save'} link (${response.status}).`
    throw new Error(message)
  }
  return result
}

ipcMain.handle('keeply:links:list', (event) => requestLinksAPI(event, 'GET'))
ipcMain.handle('keeply:links:create', (event, input: unknown) => {
  const parsed = addLinkSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid link details.')
  return requestLinksAPI(event, 'POST', '', parsed.data)
})
ipcMain.handle('keeply:links:update', (event, id: unknown, input: unknown) => {
  const parsedId = z.uuid().safeParse(id)
  if (!parsedId.success) throw new Error('Invalid link ID.')
  const parsedInput = updateLinkSchema.safeParse(input)
  if (!parsedInput.success) throw new Error(parsedInput.error.issues[0]?.message || 'Invalid link details.')
  if (Object.keys(parsedInput.data).length === 0) throw new Error('No link changes were provided.')
  return requestLinksAPI(event, 'PATCH', `/${parsedId.data}`, parsedInput.data)
})
ipcMain.handle('keeply:links:delete', (event, id: unknown) => {
  const parsedId = z.uuid().safeParse(id)
  if (!parsedId.success) throw new Error('Invalid link ID.')
  return requestLinksAPI(event, 'DELETE', `/${parsedId.data}`)
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Keeply',
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.keeply.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
