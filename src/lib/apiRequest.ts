import api from './api'
import type { AxiosRequestConfig } from 'axios'
import type { AxiosError } from 'axios'

type NormalizedResponse<T> = {
  ok: boolean
  status: number
  data?: T
  error?: string
}

export async function apiRequest<T = unknown>(config: AxiosRequestConfig): Promise<NormalizedResponse<T>> {
  try {
    const res = await api.request<T>(config)
    return { ok: true, status: res.status, data: res.data }
  } catch (err: unknown) {
    // Better error normalization for Axios errors so callers can surface server messages
    let status = 0
    let errorMsg = 'Unknown error'
    let data: unknown | undefined = undefined

    if ((err as AxiosError).isAxiosError) {
      const axErr = err as AxiosError
      status = axErr.response?.status ?? 0
      data = axErr.response?.data

      // Prefer server-provided message(s) when available
      if (axErr.response && typeof axErr.response.data === 'object') {
        const body = axErr.response.data as any
        if (body.error && typeof body.error === 'string') errorMsg = body.error
        else if (Array.isArray(body.errors) && body.errors.length > 0) {
          // Prefer first server error message
          const first = body.errors[0]
          errorMsg = first.message || JSON.stringify(first)
        } else if (body.message && typeof body.message === 'string') {
          errorMsg = body.message
        } else {
          errorMsg = JSON.stringify(body)
        }
      } else if (axErr.message) {
        errorMsg = axErr.message
      }
    } else if (err instanceof Error) {
      errorMsg = err.message
    }

    return { ok: false, status, data: data as T | undefined, error: errorMsg }
  }
}

export default apiRequest
