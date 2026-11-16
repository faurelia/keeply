import { z } from 'zod'

export const addLinkSchema = z.object({
  url: z.url('Please enter a valid URL.').refine((value) => {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  }, 'URL must use HTTP or HTTPS.'),
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim(),
  isFavorite: z.boolean()
})

export type AddLinkValues = z.infer<typeof addLinkSchema>
