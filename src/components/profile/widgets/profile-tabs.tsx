import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Grid3X3, Bookmark, Heart, Camera, Loader2, Globe, Users, Lock, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Post } from "@/types"

interface ProfileTabsProps {
  userPosts: Post[]
  savedPosts: Post[]
  isLoadingSaved: boolean
  isOwnProfile?: boolean
}

export function ProfileTabs({
  userPosts,
  savedPosts,
  isLoadingSaved,
  isOwnProfile = false,
}: ProfileTabsProps) {
  const [postFilter, setPostFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE" | "PENDING">("ALL")

  // Loại bỏ hoàn toàn bài bị ẩn do vi phạm (HIDDEN) hoặc đã bị xóa khỏi hồ sơ
  const validPosts = userPosts.filter((p) => p.status !== "HIDDEN" && (p as any).deleted !== 1)

  const privateCount = validPosts.filter((p) => p.visibility === "PRIVATE").length
  const pendingCount = validPosts.filter((p) => p.status === "PENDING_REVIEW").length
  const publicCount = validPosts.filter((p) => p.visibility === "PUBLIC" && p.status === "ACTIVE").length

  const filteredPosts = validPosts.filter((post) => {
    if (postFilter === "ALL") return true
    if (postFilter === "PUBLIC") return post.visibility === "PUBLIC" && post.status === "ACTIVE"
    if (postFilter === "PRIVATE") return post.visibility === "PRIVATE"
    if (postFilter === "PENDING") return post.status === "PENDING_REVIEW"
    return true
  })

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="posts"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="text-xs font-medium">Bài viết ({validPosts.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-xs font-medium">Đã lưu ({savedPosts.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {/* Sub-filter pills for author's own profile */}
          {isOwnProfile && validPosts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-3 border-b border-border overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setPostFilter("ALL")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  postFilter === "ALL"
                    ? "border border-primary bg-primary/10 text-primary font-semibold"
                    : "border border-border bg-white dark:bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                Tất cả ({validPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setPostFilter("PUBLIC")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  postFilter === "PUBLIC"
                    ? "border border-primary bg-primary/10 text-primary font-semibold"
                    : "border border-border bg-white dark:bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Globe className="h-3 w-3" /> Công khai ({publicCount})
              </button>
              {privateCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPostFilter("PRIVATE")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    postFilter === "PRIVATE"
                      ? "border border-primary bg-primary/10 text-primary font-semibold"
                      : "border border-border bg-white dark:bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Lock className="h-3 w-3" /> Riêng tư ({privateCount})
                </button>
              )}
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPostFilter("PENDING")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    postFilter === "PENDING"
                      ? "border border-primary bg-primary/10 text-primary font-semibold"
                      : "border border-border bg-white dark:bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Clock className="h-3 w-3" /> Chờ duyệt ({pendingCount})
                </button>
              )}
            </div>
          )}

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1 lg:grid-cols-4">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={post.photos?.[0]?.imageUrl || "/placeholder.svg"}
                    alt="User post"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Badges for status and visibility */}
                  {post.status === "PENDING_REVIEW" && (
                    <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-md border border-primary/40 bg-white/90 dark:bg-card/90 px-1.5 py-0.5 text-[10px] font-medium text-primary shadow-sm backdrop-blur-sm">
                      <Clock className="h-2.5 w-2.5" /> Chờ duyệt
                    </div>
                  )}
                  {post.visibility === "PRIVATE" && (
                    <div className="absolute top-1.5 right-1.5 z-10 flex items-center rounded-md border border-primary/40 bg-white/90 dark:bg-card/90 p-1 text-primary shadow-sm backdrop-blur-sm" title="Riêng tư">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}
                  {post.visibility === "FOLLOWERS_ONLY" && (
                    <div className="absolute top-1.5 right-1.5 z-10 flex items-center rounded-md border border-primary/40 bg-white/90 dark:bg-card/90 p-1 text-primary shadow-sm backdrop-blur-sm" title="Bạn bè">
                      <Users className="h-3 w-3" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/30 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-card">
                      <Heart className="h-4 w-4 fill-current" />
                      {post.likeCount || 0}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Camera className="h-12 w-12" strokeWidth={1} />
              <p className="mt-3 text-sm">Chưa có bài đăng nào trong mục này</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          {isLoadingSaved ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1 lg:grid-cols-4">
              {savedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group relative aspect-square overflow-hidden rounded-md"
                >
                  <Image
                    src={post.photos?.[0]?.imageUrl || "/placeholder.svg"}
                    alt="Saved post"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 1024px) 33vw, 25vw"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bookmark className="h-12 w-12" strokeWidth={1} />
              <p className="mt-3 text-sm">Chưa lưu bài nào</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
