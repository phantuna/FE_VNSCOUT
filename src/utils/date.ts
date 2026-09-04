
export function parseUTCDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date()
  const cleanStr = dateStr.replace(" ", "T")
  if (cleanStr.endsWith("Z") || cleanStr.includes("+") || /[+-]\d{2}:\d{2}$/.test(cleanStr)) {
    return new Date(cleanStr)
  }
  return new Date(cleanStr)
}

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


export function formatTimeOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  return parseUTCDate(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
