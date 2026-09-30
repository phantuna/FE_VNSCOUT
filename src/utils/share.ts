import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"

/**
 * Tạo URL chia sẻ tuyệt đối, tự động nhận diện basePath (/vnscout) nếu có
 */
export function getFullShareUrl(path: string): string {
  if (typeof window === "undefined") return path
  const origin = window.location.origin
  const hasBasePath = window.location.pathname.startsWith("/vnscout")
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return hasBasePath ? `${origin}/vnscout${cleanPath}` : `${origin}${cleanPath}`
}

/**
 * Sao chép văn bản vào khay nhớ tạm (hỗ trợ cả Clipboard API và Fallback cho HTTP/trình duyệt cũ)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Thử dùng navigator.clipboard nếu có và ở secure context
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn("navigator.clipboard failed, attempting fallback:", err)
    }
  }

  // 2. Fallback dùng textarea ẩn (hoạt động 100% kể cả HTTP)
  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.top = "0"
    textArea.style.left = "-999999px"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error("Clipboard copy fallback error:", err)
    return false
  }
}

/**
 * Chia sẻ nội dung: Ưu tiên Web Share API (native share sheet trên mobile/máy tính),
 * nếu không hỗ trợ hoặc hủy sẽ tự động fallback sang sao chép liên kết vào khay nhớ tạm.
 */
export async function shareContent({
  title = "Vietnam Photo Scout",
  text,
  path,
  customSuccessMsg = "Liên kết đã được sao chép vào khay nhớ tạm!",
}: {
  title?: string
  text?: string
  path: string
  customSuccessMsg?: string
}): Promise<void> {
  const url = getFullShareUrl(path)

  // 1. Ưu tiên Web Share API nếu trình duyệt hỗ trợ
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text: text || title,
        url,
      })
      return
    } catch (err: any) {
      // Người dùng bấm Hủy (AbortError) -> không làm gì tiếp
      if (err?.name === "AbortError") {
        return
      }
      // Lỗi khác -> chuyển sang fallback copy link bên dưới
    }
  }

  // 2. Fallback: Copy link vào clipboard và hiển thị Toast
  const success = await copyToClipboard(url)
  if (success) {
    showSuccessToast("Đã sao chép liên kết", customSuccessMsg)
  } else {
    showErrorToast("Lỗi", "Không thể sao chép liên kết vào khay nhớ tạm.")
  }
}
