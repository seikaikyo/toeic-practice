const BASE_URL = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export function useApi() {
  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    const json: ApiResponse<T> = await res.json()
    if (!json.success) {
      throw new Error(json.error?.message || 'Unknown error')
    }
    return json.data as T
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    const json: ApiResponse<T> = await res.json()
    if (!json.success) {
      throw new Error(json.error?.message || 'Unknown error')
    }
    return json.data as T
  }

  return { get, post }
}
