"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu, Camera, Home, Search, Map, PlusSquare,
  Bell, MessageCircle, User, ShieldAlert, LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/context/AuthContext"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiFetch } from "@/services/api.service"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/explore", icon: Search, label: "Khám phá" },
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/create", icon: PlusSquare, label: "Đăng bài" },
  { href: "/notifications", icon: Bell, label: "Thông báo" },
  { href: "/messages", icon: MessageCircle, label: "Tin nhắn" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
]

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const isAdmin = user?.roles?.some(r => r.toLowerCase() === "admin" || r.toLowerCase() === "role_admin")
  const dynamicNavItems = [...NAV_ITEMS]
  if (isAdmin) {
    dynamicNavItems.push({ href: "/admin", icon: ShieldAlert, label: "Trung tâm Quản trị" })
  }

  useEffect(() => {
    if (!user) return;
    apiFetch('/api/v1/notifications/unread-count')
      .then(count => setUnreadCount(count))
      .catch(() => { });

    import("@/services/chat.service").then(({ chatService }) => {
      chatService.getMyConversations().then(convs => {
        const total = convs.reduce((sum, c) => sum + c.unreadCount, 0)
        setUnreadChatCount(total)
      }).catch(() => { })
    })

    const handleNotificationRead = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.action === 'clear') {
        setUnreadCount(0);
      } else if (customEvent.detail?.action === 'decrement') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleChatUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUnreadChatCount(customEvent.detail)
    }

    const handleSseChatUpdate = () => {
      import("@/services/chat.service").then(({ chatService }) => {
        chatService.getMyConversations().then(convs => {
          const total = convs.reduce((sum, c) => sum + c.unreadCount, 0)
          setUnreadChatCount(total)
        }).catch(() => { })
      })
    }

    window.addEventListener('notificationRead', handleNotificationRead);
    window.addEventListener('chatUnreadUpdate', handleChatUpdate);
    window.addEventListener('sseChatUpdate', handleSseChatUpdate);

    return () => {
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('chatUnreadUpdate', handleChatUpdate);
      window.removeEventListener('sseChatUpdate', handleSseChatUpdate);
    };
  }, [user]);

  const displayUser = user || { username: "Khách", avatarUrl: "" }

  return (
    <header className="md:hidden sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Camera className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-serif text-lg font-bold">VPS</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 relative">
            <Menu className="h-6 w-6" />
            {(unreadCount > 0 || unreadChatCount > 0) && (
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
          <SheetHeader className="p-4 border-b border-border text-left">
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-serif text-xl font-bold tracking-tight text-foreground">
                  VPS
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Vietnam Photo Scout
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {dynamicNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/" || pathname.startsWith("/location/") || pathname.startsWith("/post/")
                    : item.href === "/profile"
                      ? pathname.startsWith("/profile") || pathname.startsWith("/settings")
                      : pathname.startsWith(item.href)
                const Icon = item.icon
                const requiresAuth = ["/create", "/notifications", "/messages", "/profile", "/admin"].includes(item.href)

                const handleNavClick = (e: React.MouseEvent) => {
                  if (requiresAuth && !user) {
                    e.preventDefault()
                    showLoginRequiredToast(router)
                    router.push("/login")
                    setOpen(false)
                    return
                  }
                  setOpen(false) // Close sheet on navigation
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Icon
                        className={cn("h-5 w-5", isActive ? "text-primary" : "group-hover:text-primary")}
                        strokeWidth={isActive ? 2.5 : 1.5}
                      />
                      <span>{item.label}</span>

                      {/* Badges */}
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                      {item.href === "/messages" && unreadChatCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {unreadChatCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Profile Bottom */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                onClick={(e) => {
                  if (!user) { e.preventDefault(); router.push("/login") }
                  setOpen(false)
                }}
                className="flex flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={displayUser.avatarUrl || "/default-avatar.svg"} />
                  <AvatarFallback>{displayUser.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayUser.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{displayUser.username}
                  </p>
                </div>
              </Link>
              {user && (
                <button
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
