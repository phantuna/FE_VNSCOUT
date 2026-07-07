"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Search,
  Map,
  PlusSquare,
  Bell,
  MessageCircle,
  User,
  Camera,
  MapPin,
  LogOut,
  AlertCircle,
  ShieldAlert,
  PanelLeftOpen,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { Button } from "@/components/ui/button"
import { CreateLocationDialog } from "@/components/location/modals/create-location-dialog"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/explore", icon: Search, label: "Khám phá" },
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/create", icon: PlusSquare, label: "Đăng bài" },
  { href: "/notifications", icon: Bell, label: "Thông báo" },
  { href: "/messages", icon: MessageCircle, label: "Tin nhắn" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
]

import { useEffect, useState } from "react"
import { apiFetch } from "@/services/api.service"

interface DesktopSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({ isCollapsed: controlledIsCollapsed = false, onToggleCollapse }: DesktopSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const { toast } = useToast()

  const isCollapsed = controlledIsCollapsed && !isHovered

  const isAdmin = user?.roles?.some(r => r.toLowerCase() === "admin" || r.toLowerCase() === "role_admin")
  const dynamicNavItems = [...NAV_ITEMS]
  if (isAdmin) {
    dynamicNavItems.push({ href: "/admin", icon: ShieldAlert, label: "Trung tâm Quản trị" })
  }

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) return;

    apiFetch('/api/v1/notifications/unread-count')
      .then(count => setUnreadCount(count))
      .catch(() => { /* backend unavailable */ });

    const token = localStorage.getItem("token");
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:8081/api/v1/notifications/stream?token=${token}`);

    eventSource.addEventListener("notification", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.unreadCount !== undefined) {
          setUnreadCount(prev => {
            if (data.unreadCount > prev) {
              setTimeout(() => {
                toast({
                  title: "Thông báo mới",
                  description: data.content || "Bạn có một thông báo mới",
                });
              }, 0);
            }
            return data.unreadCount;
          });
        }
        window.dispatchEvent(new CustomEvent('newNotification', { detail: data }));
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    });

    eventSource.onerror = () => {
      console.warn("Mất kết nối SSE (Thời gian thực). Đang tự động kết nối lại...");
    };

    const interval = setInterval(() => {
      apiFetch('/api/v1/notifications/unread-count')
        .then(count => setUnreadCount(count))
        .catch(() => { /* backend unavailable */ });
    }, 300000);

    const handleNotificationRead = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.action === 'clear') {
        setUnreadCount(0);
      } else if (customEvent.detail?.action === 'decrement') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('notificationRead', handleNotificationRead);

    import("@/services/chat.service").then(({ chatService }) => {
      chatService.getMyConversations().then(convs => {
        const total = convs.reduce((sum, c) => sum + c.unreadCount, 0)
        setUnreadChatCount(total)
      }).catch(() => { })
    })

    const handleChatUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUnreadChatCount(customEvent.detail)
    }
    window.addEventListener('chatUnreadUpdate', handleChatUpdate)

    return () => {
      eventSource.close();
      clearInterval(interval);
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('chatUnreadUpdate', handleChatUpdate);
    };
  }, [user]);

  const displayUser = user || { username: "Khách", avatarUrl: "" }

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "hidden md:flex fixed left-0 top-0 z-50 h-screen flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[240px] xl:w-[280px]"
      )}
    >
      <div className="flex items-center justify-between px-4 py-6">
        <Link href="/" className={cn("group/logo flex items-center gap-3 transition-all", isCollapsed && "justify-center w-full")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20 transition-transform group-hover/logo:scale-105 group-hover/logo:rotate-3 duration-300">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-serif text-xl font-bold tracking-tight text-foreground transition-colors group-hover/logo:text-primary">
                VPS
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover/logo:text-muted-foreground/80">
                Vietnam Photo Scout
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
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
              }
            }

            if (item.href === "/admin") {
              return (
                <li key={item.href} className="flex flex-col">
                  <button
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        showLoginRequiredToast(router)
                        router.push("/login")
                        return
                      }
                      setIsAdminMenuOpen(!isAdminMenuOpen)
                    }}
                    className={cn(
                      "group relative flex items-center justify-between rounded-lg py-2.5 text-sm font-medium transition-colors w-full",
                      isCollapsed ? "justify-center px-0" : "px-3",
                      pathname.startsWith("/admin")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          pathname.startsWith("/admin") ? "text-primary" : "group-hover:text-primary"
                        )}
                        strokeWidth={pathname.startsWith("/admin") ? 2.5 : 1.5}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && <ChevronDown className={cn("h-4 w-4 transition-transform", isAdminMenuOpen && "rotate-180")} />}
                  </button>
                  
                  {!isCollapsed && (
                    <div className={cn("overflow-hidden transition-all duration-300", isAdminMenuOpen ? "max-h-[300px] opacity-100 mt-1" : "max-h-0 opacity-0")}>
                      <div className="flex flex-col gap-1 pl-[42px] pr-3 border-l-2 border-primary/20 ml-[22px]">
                         <Link href="/admin?tab=stats" className="text-xs font-medium py-2 text-muted-foreground hover:text-primary transition-colors">Bảng điều khiển</Link>
                         <Link href="/admin?tab=posts" className="text-xs font-medium py-2 text-muted-foreground hover:text-primary transition-colors">Kiểm duyệt bài viết</Link>
                         <Link href="/admin?tab=users" className="text-xs font-medium py-2 text-muted-foreground hover:text-primary transition-colors">Quản lý Tài khoản</Link>
                         <Link href="/admin?tab=locations" className="text-xs font-medium py-2 text-muted-foreground hover:text-primary transition-colors">Quản lý Địa điểm</Link>
                         <Link href="/admin?tab=bannedWords" className="text-xs font-medium py-2 text-muted-foreground hover:text-primary transition-colors">Bộ lọc Từ khóa</Link>
                      </div>
                    </div>
                  )}
                </li>
              )
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {!isCollapsed && <span>{item.label}</span>}

                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className={cn(
                      "flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm",
                      isCollapsed ? "absolute right-[18px] top-1.5 h-3.5 w-3.5 text-[8px]" : "ml-auto h-5 w-5 text-[10px]"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                  {item.href === "/messages" && unreadChatCount > 0 && (
                    <span className={cn(
                      "flex items-center justify-center rounded-full bg-destructive font-bold text-destructive-foreground shadow-sm",
                      isCollapsed ? "absolute right-[18px] top-1.5 h-3.5 w-3.5 text-[8px]" : "ml-auto h-5 w-5 text-[10px]"
                    )}>
                      {unreadChatCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 px-3">
          {!user ? (
            <Button
              onClick={() => {
                showLoginRequiredToast(router)
                router.push("/login")
              }}
              className={cn("w-full gap-3 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none", isCollapsed ? "justify-center px-0" : "justify-start")}
              title={isCollapsed ? "Thêm địa điểm" : undefined}
            >
              <MapPin className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Thêm địa điểm</span>}
            </Button>
          ) : (
            <CreateLocationDialog
              trigger={
                <Button className={cn("w-full gap-3 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none", isCollapsed ? "justify-center px-0" : "justify-start")} title={isCollapsed ? "Thêm địa điểm" : undefined}>
                  <MapPin className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>Thêm địa điểm</span>}
                </Button>
              }
            />
          )}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center" : "justify-between")}>
          <Link
            href="/profile"
            onClick={(e) => {
              if (!user) { e.preventDefault(); router.push("/login") }
            }}
            className={cn("flex flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted", isCollapsed && "justify-center flex-none")}
            title={isCollapsed ? "Trang cá nhân" : undefined}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage
                src={displayUser.avatarUrl || "/default-avatar.svg"}
                alt={displayUser.username}
              />
              <AvatarFallback>
                {displayUser.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayUser.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{displayUser.username}
                </p>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive shrink-0"
              title="Đăng xuất"
              type="button"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div id="persistent-map-container" className="fixed pointer-events-none opacity-0 -z-50" style={{ width: '100vw', height: '100vh', top: '-9999px' }} />
    </aside>
  )
}
