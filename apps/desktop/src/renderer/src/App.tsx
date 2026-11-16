import { useCallback, useEffect, useState } from 'react'
import {
  Archive,
  Bookmark,
  ChevronDown,
  Command,
  LogOut,
  Link2,
  Moon,
  Pencil,
  MoreHorizontal,
  MonitorCog,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Sun
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import AddLinkDialog from '@/components/AddLinkDialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import type { AddLinkValues } from '@/lib/schemas/link'

type Page = 'All Links' | 'Favorites' | 'Archived'
type SavedLink = Omit<AddLinkValues, 'description'> & {
  description: string | null
  isArchived: boolean
  id: string
  createdAt: string
  updatedAt: string
}

const navigation = [
  { label: 'All Links', icon: Link2 },
  { label: 'Favorites', icon: Star },
  { label: 'Archived', icon: Archive }
] as const

function App(): React.JSX.Element {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [activePage, setActivePage] = useState<Page>('All Links')
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = window.localStorage.getItem('keeply:theme')
    return savedTheme ? savedTheme === 'dark' : document.documentElement.classList.contains('dark')
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)

  const [links, setLinks] = useState<SavedLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState('')
  const [hasCachedLinks, setHasCachedLinks] = useState(false)
  const [linksReloadKey, setLinksReloadKey] = useState(0)
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null)
  const [pendingLinkAction, setPendingLinkAction] = useState<string | null>(null)
  const [deleteLinkCandidate, setDeleteLinkCandidate] = useState<SavedLink | null>(null)

  const setAndCacheLinks = useCallback((nextLinks: SavedLink[]): void => {
    setLinks(nextLinks)
    if (!user?.id) return

    try {
      window.localStorage.setItem(`keeply:links:${user.id}`, JSON.stringify(nextLinks))
    } catch {
      // Keep the app usable if local storage is unavailable or full.
    }
  }, [user?.id])

  useEffect(() => {
    let mounted = true
    window
      .getUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser)
          setAuthLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setAuthLoading(false)
      })

    const unsubscribeAuthenticated = window.onAuthenticated((authenticatedUser) => {
      setUser(authenticatedUser)
      setAuthError('')
    })
    const unsubscribeUpdated = window.onUserUpdated((updatedUser) => setUser(updatedUser))
    const unsubscribeError = window.onAuthError((error) => setAuthError(error.message))

    return () => {
      mounted = false
      unsubscribeAuthenticated()
      unsubscribeUpdated()
      unsubscribeError()
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem('keeply:theme', isDark ? 'dark' : 'light')
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }, [isDark])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLinks([])
      setLinksError('')
      setHasCachedLinks(false)
      setLinksLoading(false)
      return
    }

    let active = true
    setLinksError('')
    let hasCache = false
    try {
      const cached = window.localStorage.getItem(`keeply:links:${user.id}`)
      if (cached) {
        const parsed: unknown = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.every((link) =>
          link && typeof link.id === 'string' && typeof link.title === 'string' && typeof link.url === 'string'
        )) {
          hasCache = true
          setLinks(parsed as SavedLink[])
        }
      }
    } catch {
      // Ignore invalid cache data and load from the API.
    }
    setHasCachedLinks(hasCache)
    setLinksLoading(!hasCache)
    if (!hasCache) setLinks([])

    window.keeply.links
      .list()
      .then(({ links: savedLinks }) => {
        if (active) {
          setAndCacheLinks(savedLinks)
          setHasCachedLinks(false)
        }
      })
      .catch((error: Error) => {
        if (active) setLinksError(error.message || 'Could not load your saved links.')
      })
      .finally(() => {
        if (active) setLinksLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, user?.id, linksReloadKey, setAndCacheLinks])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your account…
      </div>
    )
  }

  if (!user) {
    return (
      <main className="flex h-screen items-center justify-center bg-background p-6 text-foreground">
        <section className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bookmark className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Keeply</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in securely with Google in your browser.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setAuthError('')
              window.requestAuth().catch((error: Error) => setAuthError(error.message))
            }}
          >
            Continue in browser
          </Button>
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => setShowCodeEntry((show) => !show)}
          >
            {showCodeEntry ? 'Hide code entry' : 'Having trouble opening the app?'}
          </Button>
          {showCodeEntry && (
            <div className="space-y-3 text-left">
              <p className="text-xs text-muted-foreground">
                Copy the full sign-in token from the browser page and paste it here.
              </p>
              <Input
                value={authorizationCode}
                onChange={(event) => setAuthorizationCode(event.target.value.trim())}
                placeholder="Paste sign-in token"
                maxLength={256}
                autoComplete="one-time-code"
              />
              <Button
                className="w-full"
                disabled={!authorizationCode.trim()}
                onClick={() => {
                  setAuthError('')
                  window
                    .authenticate({ token: authorizationCode.trim() })
                    .catch((error: Error) => setAuthError(error.message))
                }}
              >
                Complete sign-in
              </Button>
            </div>
          )}
          {authError && (
            <p role="alert" className="text-sm text-destructive">
              {authError}
            </p>
          )}
        </section>
      </main>
    )
  }

  const toggleTheme = (): void => {
    setIsDark((current) => !current)
  }

  const handleSignOut = (): void => {
    window.signOut()
      .then(() => {
        setUser(null)
        setLinks([])
      })
      .catch((error: Error) => setAuthError(error.message || 'Could not sign out.'))
  }

  const handleSaveLink = async (values: AddLinkValues): Promise<void> => {
    const isEditing = Boolean(editingLink)
    const operation = editingLink
      ? window.keeply.links.update(editingLink.id, values)
      : window.keeply.links.create(values)
    const { link } = await toast.promise(operation, {
      loading: isEditing ? 'Updating link...' : 'Adding link...',
      success: isEditing ? 'Updated successfully' : 'Added successfully',
      error: (error) => error instanceof Error ? error.message : 'Could not save this link.'
    })

    setAndCacheLinks(isEditing
      ? links.map((currentLink) => (currentLink.id === link.id ? link : currentLink))
      : [link, ...links])
  }

  const handleToggleFavorite = async (link: SavedLink): Promise<void> => {
    setPendingLinkAction(link.id)
    try {
      const { link: updatedLink } = await toast.promise(
        window.keeply.links.update(link.id, { isFavorite: !link.isFavorite }),
        {
          loading: link.isFavorite ? 'Removing favorite...' : 'Adding favorite...',
          success: 'Favorite updated',
          error: (error) => error instanceof Error ? error.message : 'Could not update favorite.'
        }
      )
      setAndCacheLinks(
        links.map((currentLink) =>
          currentLink.id === updatedLink.id ? updatedLink : currentLink
        )
      )
    } catch {
      // The toast reports the failed request.
    } finally {
      setPendingLinkAction(null)
    }
  }

  const handleToggleArchived = async (link: SavedLink): Promise<void> => {
    setPendingLinkAction(link.id)
    try {
      const isArchiving = !link.isArchived
      const { link: updatedLink } = await toast.promise(
        window.keeply.links.update(link.id, { isArchived: isArchiving }),
        {
          loading: isArchiving ? 'Moving to archive...' : 'Restoring link...',
          success: isArchiving ? 'Moved to Archived' : 'Restored to library',
          error: (error) => error instanceof Error ? error.message : 'Could not update archive.'
        }
      )
      setAndCacheLinks(links.map((currentLink) => currentLink.id === updatedLink.id ? updatedLink : currentLink))
    } catch {
      // The toast reports the failed request.
    } finally {
      setPendingLinkAction(null)
    }
  }

  const handleDeleteLink = async (): Promise<void> => {
    if (!deleteLinkCandidate) return
    const link = deleteLinkCandidate
    setPendingLinkAction(link.id)
    try {
      await toast.promise(window.keeply.links.delete(link.id), {
        loading: 'Deleting link...',
        success: 'Deleted successfully',
        error: (error) => error instanceof Error ? error.message : 'Could not delete link.'
      })
      setAndCacheLinks(links.filter((currentLink) => currentLink.id !== link.id))
      setDeleteLinkCandidate(null)
    } catch {
      // The toast reports the failed request and leaves the confirmation open.
    } finally {
      setPendingLinkAction(null)
    }
  }

  const pageLinks =
    activePage === 'Favorites'
      ? links.filter((link) => link.isFavorite && !link.isArchived)
      : activePage === 'Archived'
        ? links.filter((link) => link.isArchived)
        : links.filter((link) => !link.isArchived)
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
  const visibleLinks = normalizedQuery
    ? pageLinks.filter((link) =>
        [link.title, link.url, link.description ?? ''].some((field) =>
          field.toLocaleLowerCase().includes(normalizedQuery)
        )
      )
    : pageLinks

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Bookmark className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Keeply</span>
        </div>

        <Separator />

        <div className="flex-1 space-y-6 overflow-y-auto p-3">
          <div className="space-y-1">
            <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground">
              LIBRARY
            </p>

            {navigation.map(({ label, icon: Icon }) => (
              <Button
                key={label}
                variant={activePage === label ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => setActivePage(label)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground">
              PREFERENCES
            </p>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="size-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="p-3">
          <Separator className="mb-3" />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open account menu"
              className="flex h-10 w-full items-center gap-3 rounded-md px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {(user.name || user.email).slice(0, 1).toLocaleUpperCase()}
              </div>
              <span className="flex-1 truncate text-left">{user.name || user.email}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium">{user.name || 'Keeply account'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">{activePage}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden w-64 sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search links"
                placeholder="Search links..."
                className="h-9 pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Button className="gap-2" onClick={() => setIsAddLinkOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add link</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{activePage}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activePage === 'All Links' && 'Manage all your saved links in one place.'}
                {activePage === 'Favorites' && 'Quick access to your favorite links.'}
                {activePage === 'Archived' && 'Links you have archived.'}
              </p>
            </div>

            {linksError && hasCachedLinks && (
              <div role="status" className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                <span>Showing saved links. Could not refresh: {linksError}</span>
                <Button variant="outline" size="sm" onClick={() => setLinksReloadKey((key) => key + 1)}>
                  Retry
                </Button>
              </div>
            )}

            {linksError && !hasCachedLinks ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-card p-5 text-sm"
              >
                <p>{linksError}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setLinksReloadKey((key) => key + 1)}
                >
                  Try again
                </Button>
              </div>
            ) : linksLoading ? (
              <div className="flex min-h-80 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
                Loading your saved links…
              </div>
            ) : visibleLinks.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleLinks.map((link) => (
                  <div key={link.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${link.title}`}
                        className="group/link flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                      <div
                        aria-hidden="true"
                        className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted/70"
                      >
                        <Star
                          className={
                            link.isFavorite
                              ? 'size-6 fill-amber-400 text-amber-500'
                              : 'size-6 text-muted-foreground/70'
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="min-w-0 pt-1 font-medium group-hover/link:underline">{link.title}</h3>
                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">{link.url}</p>
                        {link.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        )}
                      </div>
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`More actions for ${link.title}`}
                          render={<Button variant="ghost" size="icon-sm" disabled={pendingLinkAction !== null} />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void handleToggleFavorite(link)}>
                            <Star className={link.isFavorite ? 'fill-current text-amber-500' : ''} />
                            {link.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingLink(link)
                            setIsAddLinkOpen(true)
                          }}>
                            <Pencil />
                            Edit Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void handleToggleArchived(link)}>
                            <Archive />
                            {link.isArchived ? 'Restore from Archive' : 'Move to Archived'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteLinkCandidate(link)}>
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
                  <Link2 className="size-5 text-muted-foreground" />
                </div>

                {normalizedQuery ? (
                  <>
                    <h3 className="font-medium">No matching links</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Try another title, URL, or description.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium">No links yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Your saved links will appear here. Start building your personal library by adding
                      your first link.
                    </p>
                    <Button className="mt-5 gap-2" onClick={() => setIsAddLinkOpen(true)}>
                      <Plus className="size-4" />
                      Add your first link
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Status bar */}
        <footer className="flex h-9 shrink-0 items-center justify-between border-t px-6 text-xs text-muted-foreground">
          <span>Keeply</span>
          <span className="flex items-center gap-1.5">
            <Command className="size-3" />
            Your personal link library
          </span>
        </footer>
      </div>
      <AddLinkDialog
        open={isAddLinkOpen}
        onOpenChange={(open) => {
          setIsAddLinkOpen(open)
          if (!open) setEditingLink(null)
        }}
        onSaveLink={handleSaveLink}
        mode={editingLink ? 'edit' : 'add'}
        initialValues={
          editingLink
            ? {
                url: editingLink.url,
                title: editingLink.title,
                description: editingLink.description ?? '',
                isFavorite: editingLink.isFavorite
              }
            : undefined
        }
      />
      <AlertDialog
        open={deleteLinkCandidate !== null}
        onOpenChange={(open) => {
          if (!open && pendingLinkAction === null) setDeleteLinkCandidate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLinkCandidate
                ? `“${deleteLinkCandidate.title}” will be permanently deleted from your library.`
                : 'This link will be permanently deleted from your library.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingLinkAction !== null}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pendingLinkAction !== null}
              onClick={() => void handleDeleteLink()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your Keeply account and app appearance.</DialogDescription>
          </DialogHeader>
          <section className="space-y-1 rounded-lg border p-3">
            <h3 className="text-sm font-medium">Account</h3>
            <p className="text-sm text-muted-foreground">{user.name || 'Keeply account'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </section>
          <section className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <h3 className="text-sm font-medium">Appearance</h3>
              <p className="text-xs text-muted-foreground">Choose the app color theme.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={toggleTheme}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {isDark ? 'Light' : 'Dark'}
            </Button>
          </section>
          <section className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <h3 className="text-sm font-medium">Library</h3>
              <p className="text-xs text-muted-foreground">Refresh saved links from your account.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              setLinksReloadKey((key) => key + 1)
              setIsSettingsOpen(false)
            }}>
              <MonitorCog className="size-4" />
              Refresh
            </Button>
          </section>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
