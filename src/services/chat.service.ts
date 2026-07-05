import { apiFetch } from "./api.service"
import { ChatMessage, Conversation } from "@/types"

export const chatService = {
  async getMyConversations(): Promise<Conversation[]> {
    return apiFetch("/chat/conversations", { method: "GET" })
  },

  async getOrCreateConversation(receiverId: string): Promise<Conversation> {
    return apiFetch(`/chat/conversations/${receiverId}`, { method: "POST" })
  },

  async getMessages(
    conversationId: string,
    page: number = 0,
    size: number = 20
  ): Promise<{ content: ChatMessage[]; totalPages: number; last: boolean }> {
    return apiFetch(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`, {
      method: "GET",
    })
  },

  async markAsRead(conversationId: string): Promise<void> {
    return apiFetch(`/chat/conversations/${conversationId}/read`, { method: "PUT" })
  },

  async getMutualFollowUserIds(userId: string): Promise<string[]> {
    return apiFetch(`/api/v1/follow/mutual?userId=${userId}`, { method: "GET" })
  },
}
