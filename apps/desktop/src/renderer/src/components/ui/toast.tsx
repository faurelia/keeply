import { Toast } from '@base-ui/react/toast'

export const toastManager = Toast.createToastManager()

export const toast = {
  promise: <Value,>(
    operation: Promise<Value>,
    messages: { loading: string; success: string; error: string | ((error: unknown) => string) }
  ): Promise<Value> =>
    toastManager.promise(operation, {
      loading: { title: messages.loading },
      success: { title: messages.success },
      error: (error) => ({
        title: typeof messages.error === 'function' ? messages.error(error) : messages.error
      })
    })
}

function ToastStack(): React.JSX.Element {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed top-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none">
        {toasts.map((item) => (
          <Toast.Root
            key={item.id}
            toast={item}
            className="rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0"
          >
            <Toast.Content className="flex items-center justify-between gap-4 px-4 py-3">
              <Toast.Title className="text-sm font-medium">{item.title}</Toast.Title>
              <Toast.Close className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">Dismiss</Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <ToastStack />
    </Toast.Provider>
  )
}
