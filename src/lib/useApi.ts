import { useCallback, useMemo } from 'react'
import api from './api'
import type { AxiosRequestConfig } from 'axios'

type NormalizedResponse<T> = {
  ok: boolean
  status: number
  data?: T
  error?: string
}

// Shared in-flight map to deduplicate identical GET requests across components
const inFlightRequests = new Map<string, Promise<NormalizedResponse<unknown>>>()

function makeKey(config: AxiosRequestConfig) {
  try {
    const { method = 'get', url = '', params, data } = config as any
    return `${String(method).toUpperCase()}::${String(url)}::${JSON.stringify(params ?? {})}::${JSON.stringify(data ?? {})}`
  } catch (e) {
    return `${String(config.method ?? 'get')}::${String(config.url ?? '')}`
  }
}

export default function useApi() {
  // memoize the request function so the returned client object is stable
  const request = useCallback(async function request<T = unknown>(config: AxiosRequestConfig): Promise<NormalizedResponse<T>> {
    const key = makeKey(config)

    // Only dedupe GET requests (or when method is not provided)
    const method = (config.method ?? 'get').toString().toLowerCase()
    const shouldDedup = method === 'get'

    if (shouldDedup && inFlightRequests.has(key)) {
      return inFlightRequests.get(key)! as Promise<NormalizedResponse<T>>
    }

    const exec = (async (): Promise<NormalizedResponse<T>> => {
      const maxAttempts = 3
      let attempt = 0
      const baseDelay = 500 // ms
      while (true) {
        try {
          const res = await api.request<T>(config)
          return { ok: true, status: res.status, data: res.data }
        } catch (err: unknown) {
          const e = err as any
          const status = e?.response?.status ?? 0
          const serverData = e?.response?.data
          const message = serverData?.error ?? e?.message ?? 'Unknown error'

          // Retry on 429 (rate limit) for idempotent GET requests
          if (status === 429 && attempt < maxAttempts - 1 && method === 'get') {
            const jitter = Math.random() * 200
            const delay = baseDelay * Math.pow(2, attempt) + jitter
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, delay))
            attempt += 1
            continue
          }

          return { ok: false, status, error: message, data: serverData }
        }
      }
    })()

    if (shouldDedup) inFlightRequests.set(key, exec as Promise<NormalizedResponse<unknown>>)

    try {
      const result = await exec
      return result as NormalizedResponse<T>
    } finally {
      if (shouldDedup) inFlightRequests.delete(key)
    }
  }, [])

  return useMemo(() => ({ request }), [request])
}
