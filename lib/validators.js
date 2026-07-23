import { z } from 'zod'

export const searchQuerySchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in search')