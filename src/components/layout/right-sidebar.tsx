"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { TrendingUp, MapPin, Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/services/api.service"
import { useAuth } from "@/context/AuthContext"

interface SuggestedUser {
  id: string
  username: string
  avatarUrl?: string
  level?: string
  followersCount?: number
}

interface TagItem {
  id: string
  name: string
  count?: number
}

interface RecentPost {
  id: string
  author?: { username?: string; avatarUrl?: string }
  location?: { id?: string; name?: string; province?: string; postCount?: number; checkInCount?: number }
  photos?: { imageUrl: string }[]
  images?: string[]
  dynamicCheckInCount?: number
}

export function RightSidebar() {
  const { user: currentUser } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [usersData, tagsData, postsData] = await Promise.allSettled([
          apiFetch("/users/getall?size=50"),
          apiFetch("/api/tags/getall?size=50"),
          apiFetch("/api/v1/posts/getAll?size=50"),
        ])

        if (usersData.status === "fulfilled" && usersData.value) {
          const arr = usersData.value.content || usersData.value || []
          if (Array.isArray(arr)) {
            setSuggestedUsers(
              arr
                .filter((u: SuggestedUser) => u.id !== currentUser?.id)
                .sort((a: any, b: any) => (b.followersCount || 0) - (a.followersCount || 0))
                .slice(0, 5)
            )
          }
        }
        let fallbackTags: TagItem[] = []
        if (tagsData.status === "fulfilled" && tagsData.value) {
          const arr = tagsData.value.content || tagsData.value || []
          if (Array.isArray(arr)) {
            fallbackTags = arr.slice(0, 10).map((t: any) => ({ ...t, count: 0 }))
            setTags(fallbackTags)
          }
        }
        if (postsData.status === "fulfilled" && postsData.value) {
          const arr = postsData.value.content || postsData.value || []
          if (Array.isArray(arr)) {
            const tagCounts: Record<string, number> = {}
            arr.forEach((post: any) => {
              if (Array.isArray(post.tags)) {
                post.tags.forEach((t: string) => {
                  const cleaned = t.trim()
                  if (cleaned) tagCounts[cleaned] = (tagCounts[cleaned] || 0) + 1
                })
              }
            })
            const trendingTags = Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([name, count]) => ({ id: name, name, count }))

            if (trendingTags.length > 0) setTags(trendingTags)
            else setTags(fallbackTags)

            const locMap = new Map<string, { count: number, latestPost: any }>();
            for (const p of arr) {
              const loc = p.location as any;
              if (loc && loc.level === 2 && loc.deleted !== 1 && !loc.isHidden) {
                const locId = loc.id || loc.name;
                if (!locMap.has(locId)) {
                  locMap.set(locId, { count: 1, latestPost: p });
                } else {
                  locMap.get(locId)!.count++;
                }
              }
            }
            const topLocations = Array.from(locMap.values())
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map(item => ({
                ...item.latestPost,
                dynamicCheckInCount: item.count
              }));
            setRecentPosts(topLocations);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [currentUser?.id])

  return (
    <aside className="hidden w-[300px] shrink-0 xl:block col-span-4">
      <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto pb-8 space-y-8 hide-scrollbar">

        {currentUser && (
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={currentUser.avatarUrl || "/default-avatar.svg"} alt={currentUser.username} />
              <AvatarFallback className="font-bold text-lg">
                {currentUser.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-foreground">{currentUser.username}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                {currentUser.level || "Explorer"}
              </p>
            </div>
            <Link
              href="/profile"
              className="ml-auto text-xs font-bold text-primary hover:underline shrink-0"
            >
              Hồ sơ
            </Link>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Camera className="h-3.5 w-3.5 text-primary" />
              Nhiếp ảnh gia đáng theo dõi
            </h3>
          </div>

          {loading ? (
            <div className="flex py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors -mx-2 group">
                  <Link href={`/profile/${user.id}`}>
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src={user.avatarUrl || "/default-avatar.svg"} alt={user.username} />
                      <AvatarFallback className="text-sm font-bold">
                        {user.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 overflow-hidden">
                    <Link
                      href={`/profile/${user.id}`}
                      className="block truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors"
                    >
                      {user.username}
                    </Link>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {user.followersCount || 0} followers
                    </p>
                  </div>
                  <Button className="h-7 px-4 text-[11px] font-bold shrink-0 bg-primary text-white hover:bg-primary/90 rounded-full">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có người dùng nào</p>
          )}
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Hashtag thịnh hành
          </h3>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/explore?tag=${tag.name}`}
                  className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border/50 hover:border-primary shadow-sm group"
                >
                  <span>#{tag.name}</span>
                  {tag.count !== undefined && tag.count > 0 && (
                    <span className="text-muted-foreground text-[11px] font-medium opacity-70 group-hover:text-primary-foreground/80">{tag.count}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có hashtag nào</p>
          )}
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Top 5 Địa Điểm Hot
          </h3>
          {recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => {
                const thumb = post.photos?.[0]?.imageUrl || post.images?.[0]
                const locCount = post.dynamicCheckInCount || post.location?.postCount || post.location?.checkInCount || 0
                return (
                  <Link
                    key={post.id}
                    href={`/location/${post.location?.id || ''}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted group -mx-2"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={post.location?.name || "Check-in"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col justify-center gap-0.5">
                      <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {post.location?.name || "Địa điểm không xác định"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground font-medium">
                        {post.location?.province || "Việt Nam"} • {locCount} lượt check-in
                      </p>

                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="text-[10px] leading-relaxed text-muted-foreground border-t border-border pt-6">
          <p className="font-bold text-primary/60">Vietnam Photo Scout · VPS</p>
          <p className="mt-1">Khám phá và chia sẻ những khoảnh khắc đẹp khắp Việt Nam.</p>
          <p className="mt-3">© 2026 VPS Team</p>
        </div>
      </div>
    </aside>
  )
}
