/**
 * Parse a date string from the backend safely.
 *
 * Backend (Spring Boot) is configured with Asia/Ho_Chi_Minh timezone,
 * so all datetime strings are already in Vietnam time (UTC+7).
 * e.g. "2026-07-02 16:48:27" means 16:48 Vietnam time.
 *
 * JavaScript's new Date("2026-07-02T16:48:27") without Z treats
 * it as LOCAL time — which is correct for users in Vietnam.
 */
export function parseUTCDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date()
  const cleanStr = dateStr.replace(" ", "T")
  // Already has explicit timezone — use as-is
  if (cleanStr.endsWith("Z") || cleanStr.includes("+") || /[+-]\d{2}:\d{2}$/.test(cleanStr)) {
    return new Date(cleanStr)
  }
  // Backend returns Vietnam time — parse as local time (no Z suffix)
  return new Date(cleanStr)
}

/**
 * Format a backend timestamp as relative time in Vietnamese.
 * e.g. "3 phút trước", "2 giờ trước", "5 ngày trước"
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = parseUTCDate(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 10) return "Vừa xong"
  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

/**
 * Format a backend timestamp as a short time string (HH:mm) in local Vietnam time.
 */
export function formatTimeOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  return parseUTCDate(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
