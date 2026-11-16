import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { cn } from 'cn'

function AlertDialog(props: AlertDialogPrimitive.Root.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogContent({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0" />
      <AlertDialogPrimitive.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
        <AlertDialogPrimitive.Popup
          className={cn(
            'w-full max-w-md rounded-xl border bg-popover p-5 text-popover-foreground shadow-xl outline-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95',
            className
          )}
          {...props}
        />
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function AlertDialogCancel({
  children,
  className,
  ...props
}: AlertDialogPrimitive.Close.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Close className={cn('rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted', className)} {...props}>
      {children}
    </AlertDialogPrimitive.Close>
  )
}

export { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle }
