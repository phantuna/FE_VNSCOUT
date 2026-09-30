/**
 * Điều hướng quay lại an toàn:
 * - Nếu người dùng đã điều hướng từ một trang khác bên trong website: gọi router.back()
 * - Nếu người dùng truy cập trực tiếp từ link chia sẻ bên ngoài (Zalo, Facebook, tab mới,...):
 *   sẽ chuyển hướng về trang fallback (mặc định là Trang chủ '/') thay vì bị thoát hẳn ra ngoài website.
 */
export function safeNavigateBack(router: any, fallbackPath: string = "/") {
  if (typeof window !== "undefined") {
    // 1. Kiểm tra index lịch sử của Next.js App Router (idx > 0 nghĩa là đã có bước chuyển trang nội bộ trong tab này)
    const nextIdx = (window.history.state as any)?.idx
    if (typeof nextIdx === "number" && nextIdx > 0) {
      router.back()
      return
    }

    // 2. Kiểm tra document.referrer cùng domain (trường hợp load trang từ link nội bộ)
    if (
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      router.back()
      return
    }
  }

  // 3. Không có lịch sử nội bộ (truy cập từ link chia sẻ ngoài) -> Về trang chủ an toàn
  if (router?.push) {
    router.push(fallbackPath)
  } else if (typeof window !== "undefined") {
    const basePath = window.location.pathname.startsWith("/vnscout") ? "/vnscout" : ""
    window.location.href = `${basePath}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`
  }
}
