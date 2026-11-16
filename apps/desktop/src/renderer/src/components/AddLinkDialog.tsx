import { useEffect, useState, type FormEvent } from 'react'

import { addLinkSchema, type AddLinkValues } from '@/lib/schemas/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveLink: (values: AddLinkValues) => Promise<void>
  initialValues?: AddLinkValues
  mode?: 'add' | 'edit'
}

const initialValues: AddLinkValues = {
  url: '',
  title: '',
  description: '',
  isFavorite: false
}

function AddLinkDialog({
  open,
  onOpenChange,
  onSaveLink,
  initialValues: suppliedValues,
  mode = 'add'
}: AddLinkDialogProps): React.JSX.Element {
  const [values, setValues] = useState<AddLinkValues>(suppliedValues ?? initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof AddLinkValues, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) return
    setValues(suppliedValues ?? initialValues)
    setErrors({})
    setSubmitError('')
  }, [open, suppliedValues?.url, suppliedValues?.title, suppliedValues?.description, suppliedValues?.isFavorite])

  const updateField = <K extends keyof AddLinkValues>(field: K, value: AddLinkValues[K]): void => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleOpenChange = (nextOpen: boolean): void => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setValues(initialValues)
      setErrors({})
      setSubmitError('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const result = addLinkSchema.safeParse(values)

    if (!result.success) {
      const nextErrors: typeof errors = {}

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AddLinkValues
        nextErrors[field] ??= issue.message
      }

      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setSubmitError('')
    try {
      await onSaveLink(result.data)
      handleOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this link.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit link' : 'Add a link'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update the details for this saved link.' : 'Save a website to your personal link library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="link-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://example.com"
              value={values.url}
              onChange={(event) => updateField('url', event.target.value)}
              aria-invalid={!!errors.url}
            />
            {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="link-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="link-title"
              placeholder="Website title"
              value={values.title}
              onChange={(event) => updateField('title', event.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="link-description" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="link-description"
              placeholder="Add some notes about this link..."
              rows={3}
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isFavorite}
              onCheckedChange={(checked) => updateField('isFavorite', checked)}
            />
            Add to favorites
          </label>

          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddLinkDialog
