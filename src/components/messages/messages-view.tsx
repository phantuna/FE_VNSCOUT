"use client"

import { MessageCircle, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const CONVERSATIONS: any[] = []

export function MessagesView() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4 px-6 py-3">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="h-9 bg-muted pl-9 text-sm"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4">
        <div className="space-y-1">
          {CONVERSATIONS.length > 0 ? (
            CONVERSATIONS.map((convo) => (
              <div key={convo.userId} className="p-4 border-b border-border">
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border mt-8">
              <MessageCircle className="h-12 w-12 opacity-20 mb-4" strokeWidth={1} />
              <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
              <p className="text-xs mt-1">Kết nối với các Scouter khác để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
