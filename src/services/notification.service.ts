import { apiFetch } from "@/services/api.service"
import type { Notification } from "@/types"

export interface NotificationPage {
  content: Notification[]
  totalElements: number
  totalPages: number
  number: number
}

export async function getNotifications(
  page = 0,
  size = 20
): Promise<NotificationPage> {
  return apiFetch(`/api/v1/notifications?page=${page}&size=${size}`)
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch("/api/v1/notifications/unread-count")
}

export async function markAsRead(notificationId: string): Promise<void> {
  return apiFetch(`/api/v1/notifications/${notificationId}/read`, {
    method: "PUT",
  })
}

export async function markAllAsRead(): Promise<void> {
  return apiFetch("/api/v1/notifications/read-all", { method: "PUT" })
}
