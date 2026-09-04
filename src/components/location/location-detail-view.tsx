"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, MapPin, Sun, Clock, Loader2, AlertCircle, Building2, Camera, Tag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/posts/widgets/post-card"
import { LocationPostForm } from "@/components/posts/modals/location-post-form"
import { apiFetch } from "@/services/api.service"
import { type Location, type Post } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { useRouter } from "next/navigation"
import { calculateSolarTimes } from "@/lib/solar-calculator"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface LocationDetailViewProps {
  id: string
}

export function LocationDetailView({ id }: LocationDetailViewProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [location, setLocation] = useState<Location | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostForm, setShowPostForm] = useState(false)
  const [visiblePostsCount, setVisiblePostsCount] = useState(10)

  const solarTimes = useMemo(() => {
    if (!location?.latitude || !location?.longitude) return null
    return calculateSolarTimes(Number(location.latitude), Number(location.longitude))
  }, [location?.latitude, location?.longitude])

  const currentHour = useMemo(() => new Date().getHours(), [])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        let locData = null
        let allPosts = []

        try {
          locData = await apiFetch(`/api/locations/${id}`)
        } catch (e: any) {
          console.error("Failed to fetch location:", e.data || e)
        }

        try {
          const postsRes = await apiFetch(user ? `/api/v1/posts/location/${id}?size=50&viewerId=${user.id}` : `/api/v1/posts/location/${id}?size=50`)
          allPosts = postsRes?.content || postsRes || []
        } catch (e: any) {
          console.error("Failed to fetch location posts:", e.data || e)
        }
        setLocation(locData)


        setPosts(Array.isArray(allPosts) ? allPosts : [])
      } catch (error) {
        console.error("Failed to fetch location data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Địa điểm không tìm thấy</h1>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Quay lại
          </Link>
        </div>
      </div>
    )
  }

  const previewImage = posts[0]?.photos?.[0]?.imageUrl || location.coverPhoto

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 font-bold text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex border-primary/20 text-primary bg-primary/5">
              Discovery
            </Badge>
            <h2 className="text-sm font-black text-slate-900">Chi tiết địa điểm</h2>
          </div>
          <div className="w-20" /> {/* Spacer to center the title */}
        </div>
      </header>

      {/* Cover Image & Location Info */}
      <div className="relative h-96 w-full overflow-hidden bg-muted">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={location.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-400 to-orange-600">
            <MapPin className="h-24 w-24 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Location Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-4xl font-bold text-white">{location.name}</h1>
          <p className="mt-1 text-white/90">{location.address || location.nameWithType}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Location Stats */}
        <div className={`mb-8 grid gap-4 sm:grid-cols-2 ${(!location.locationType || location.locationType === "SPOT") ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Tỉnh/Thành phố</span>
            </div>
            <p className="mt-2 font-semibold text-foreground">{location.province || "Việt Nam"}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span className="text-sm">Danh mục</span>
            </div>
            <div className="mt-2 flex items-center">
              <Badge variant="outline" className={`w-fit flex items-center gap-1.5 py-1 px-2.5 ${location.locationType === "SERVICE" ? "bg-orange-500/10 text-orange-600 border-orange-200/50" : "bg-primary/10 text-primary border-primary/20"}`}>
                {location.locationType === "SERVICE" ? (
                  <>
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="font-bold text-xs whitespace-nowrap">{location.category || "Dịch vụ"}</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    <span className="font-bold text-xs whitespace-nowrap">{location.category || "Điểm chụp"}</span>
                  </>
                )}
              </Badge>
            </div>
          </div>

          {(!location.locationType || location.locationType === "SPOT") && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sun className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Giờ vàng {currentHour < 12 ? "Sáng" : "Chiều"}</span>
              </div>
              <p className="mt-2 font-semibold text-foreground text-sm truncate">
                {solarTimes ? (currentHour < 12 ? `${solarTimes.sunrise} SA` : `${solarTimes.sunset} CH`) : "Đang cập nhật"}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Bài viết</span>
            </div>
            <p className="mt-2 font-semibold text-foreground">{posts.length}</p>
          </div>
        </div>

        {/* Post Button & Dialog Workspace */}
        <div className="mb-8 rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={user?.avatarUrl || "/default-avatar.svg"} />
              <AvatarFallback className="font-bold">{user?.username?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <Dialog open={showPostForm} onOpenChange={(open) => {
              if (open && !user) {
                showLoginRequiredToast(router)
                router.push("/login")
                return
              }
              setShowPostForm(open)
            }}>
              <DialogTrigger asChild>
                <button
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault()
                      showLoginRequiredToast(router)
                      router.push("/login")
                    }
                  }}
                  className="flex-1 rounded-full border border-border/80 bg-muted/65 hover:bg-muted px-5 py-3.5 text-left text-xs sm:text-sm text-muted-foreground font-medium transition-all duration-200 shadow-inner hover:scale-[1.005] active:scale-[0.995]"
                >
                  Bạn đang ở {location.name}? Hãy chia sẻ ảnh đẹp, mẹo chụp hay cảnh báo...
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border border-border/40 bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200 scrollbar-hide">
                {/* Visually hidden title and description for screen reader accessibility compliance */}
                <DialogHeader className="sr-only">
                  <DialogTitle>Đăng bài viết tại {location.name}</DialogTitle>
                  <DialogDescription>
                    Chia sẻ hình ảnh, thông số EXIF, hashtags và kinh nghiệm săn ảnh tại địa danh {location.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6 md:p-8">
                  <LocationPostForm
                    locationId={location.id}
                    locationName={location.name}
                    locationType={location.locationType}
                    onClose={() => setShowPostForm(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Posts Feed */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-foreground">Bài viết tại {location.name}</h2>

          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.slice(0, visiblePostsCount).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {visiblePostsCount < posts.length && (
                <div className="flex justify-center pt-4 pb-8">
                  <Button
                    variant="outline"
                    onClick={() => setVisiblePostsCount(prev => prev + 10)}
                    className="rounded-full px-8 bg-card"
                  >
                    Xem thêm bài viết
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">Chưa có bài viết nào</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hãy là người đầu tiên chia sẻ tại địa điểm này
                </p>
                <Button
                  onClick={() => setShowPostForm(true)}
                  className="mt-4"
                >
                  Đăng bài viết
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
