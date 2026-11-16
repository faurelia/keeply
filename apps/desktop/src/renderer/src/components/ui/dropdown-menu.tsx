import { Menu } from '@base-ui/react/menu'
import { cn } from 'cn'

function DropdownMenu(props: Menu.Root.Props): React.JSX.Element {
  return <Menu.Root {...props} />
}

function DropdownMenuTrigger(props: Menu.Trigger.Props): React.JSX.Element {
  return <Menu.Trigger {...props} />
}

function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: Menu.Popup.Props & { align?: Menu.Positioner.Props['align']; sideOffset?: number }): React.JSX.Element {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={sideOffset}>
        <Menu.Popup
          className={cn(
            'z-50 min-w-44 origin-[var(--transform-origin)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[transform,scale,opacity] data-[open]:scale-100 data-[closed]:scale-95 data-[closed]:opacity-0',
            className
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

function DropdownMenuItem({
  className,
  variant = 'default',
  ...props
}: Menu.Item.Props & { variant?: 'default' | 'destructive' }): React.JSX.Element {
  return (
    <Menu.Item
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        variant === 'destructive' && 'text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive',
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: Menu.Separator.Props): React.JSX.Element {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger }
