import { toast } from "@/components/ui/use-toast"

// Dev: dùng relative URL → Next.js proxy route /api/* → http://localhost:8081/api/*
// Prod: gọi thẳng backend (qua nginx)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""


let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const isFormData = options.body instanceof FormData

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  } as Record<string, string>

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  let data
  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            })
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json()
              const newToken = refreshData.result?.token
              if (newToken) {
                localStorage.setItem("token", newToken)
                if (refreshData.result?.refreshToken) {
                  localStorage.setItem("refreshToken", refreshData.result.refreshToken)
                }
                isRefreshing = false
                onRefreshed(newToken)
                headers["Authorization"] = `Bearer ${newToken}`
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                  ...options,
                  headers,
                })
                let retryData
                try { retryData = await retryResponse.json() } catch (_) { retryData = null }
                if (!retryResponse.ok) throw new Error("Retry failed")
                if (retryData && typeof retryData === 'object' && retryData.code === 1000 && 'result' in retryData) {
                  return retryData.result
                }
                return retryData
              }
            } else {
              localStorage.removeItem("token")
              localStorage.removeItem("refreshToken")
              window.location.href = "/login"
            }
          } catch (e) {
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            window.location.href = "/login"
          } finally {
            isRefreshing = false
          }
        } else {
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken: string) => {
              headers["Authorization"] = `Bearer ${newToken}`
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
              })
              let retryData
              try { retryData = await retryResponse.json() } catch (_) { retryData = null }
              resolve(retryData)
            })
          })
        }
      } else {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }

    const error: any = new Error(
      response.status === 429
        ? "⏳ Bạn thao tác quá nhanh! Xin hãy nghỉ tay vài giây nhé."
        : "Hệ thống đang bận, vui lòng thử lại sau"
    )
    error.status = response.status
    error.data = data

    if (typeof window !== "undefined" && response.status === 429) {
      setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Cảnh báo Spam",
          description: error.message,
        })
      }, 0)
    }

    throw error
  }

  if (data && typeof data === 'object' && data.code === 1000 && 'result' in data) {
    return data.result
  }

  return data
}
