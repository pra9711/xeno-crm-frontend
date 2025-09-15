const parsedThreshold = Number(process.env.NEXT_PUBLIC_LARGE_AUDIENCE_THRESHOLD)
export const LARGE_AUDIENCE_THRESHOLD = Number.isFinite(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : 5000

export const DEFAULT_API_URL = (process.env.NEXT_PUBLIC_API_URL && String(process.env.NEXT_PUBLIC_API_URL).trim()) || 'http://localhost:3001/api'
