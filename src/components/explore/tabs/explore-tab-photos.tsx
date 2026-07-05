import Link from "next/link"
import Image from "next/image"
import { MapPin, TrendingUp, Camera, Heart, MessageCircle, Lightbulb, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Post, type User } from "@/types"
import { parseUTCDate } from "@/utils/date"

interface TagItem {
  id: string
  name: string
  postCount?: number
}

interface ExploreTabPhotosProps {
  posts: Post[]
  validLocationIds: Set<string>
  sortedTrendingTags: TagItem[]
  filteredUsers: User[]
  followingSet: Set<string>
  followLoading: string | null
  handleToggleFollow: (targetUserId: string) => void
  filteredPosts: Post[]
  visibleExplorePostsCount: number
  setVisibleExplorePostsCount: React.Dispatch<React.SetStateAction<number>>
  fetchMorePosts: () => void
  hasMore: boolean
  loadingMore: boolean
  user: User | null
  handleToggleSave: (postId: string) => void
  savedSet: Set<string>
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
}

export function ExploreTabPhotos({
  posts,
  validLocationIds,
  sortedTrendingTags,
  filteredUsers,
  followingSet,
  followLoading,
  handleToggleFollow,
  filteredPosts,
  visibleExplorePostsCount,
  setVisibleExplorePostsCount,
  fetchMorePosts,
  hasMore,
  loadingMore,
  user,
  handleToggleSave,
  savedSet,
  setSearchQuery,
}: ExploreTabPhotosProps) {
  return (
    <>
      {/* Top Row — 3 widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Check-ins */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Check-in gần đây</h3>
          </div>
          <div className="space-y-3">
            {posts
              .filter((post, index, self) => {
                const loc = post.location as any;
                if (!loc || loc.level !== 2) return false;
                if (validLocationIds.size > 0 && !validLocationIds.has(loc.id)) return false;
                const locId = loc.id || loc.name;
                return locId && self.findIndex((p: any) => (p.location?.id || p.location?.name) === locId) === index;
              })
              .slice(0, 5)
              .map((post) => {
              const thumb = post.photos?.[0]?.imageUrl
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {post.location?.coverPhoto || thumb ? (
                      <Image src={post.location?.coverPhoto || thumb || ""} alt={post.location?.name || "Post"} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <MapPin className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {post.location?.name || "Không xác định"}
                    </p>
                    {post.location?.province && (
                      <p className="text-[10px] text-muted-foreground truncate mb-1">
                        {post.location.province} • {post.location?.checkInCount || 0} lượt check-in
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
            {posts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có check-in nào</p>
            )}
          </div>
        </div>

        {/* Trending Tags */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Hashtag nổi bật</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedTrendingTags.length > 0 ? sortedTrendingTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                onClick={() => setSearchQuery(tag.name)}
                className="cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
              >
                #{tag.name}
                {tag.postCount !== undefined && (
                  <span className="ml-1.5 text-muted-foreground">{tag.postCount}</span>
                )}
              </Badge>
            )) : (
              <p className="text-xs text-muted-foreground py-4">Chưa có tag nào</p>
            )}
          </div>
        </div>

        {/* Photographers to Follow */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Nhiếp ảnh gia đáng theo dõi</h3>
          </div>
          <div className="space-y-3">
            {filteredUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link href={`/profile/${u.id}`} className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatarUrl || "/default-avatar.svg"} alt={u.username} />
                    <AvatarFallback className="font-bold">{u.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 overflow-hidden">
                  <Link
                    href={`/profile/${u.id}`}
                    className="block truncate text-sm font-semibold text-foreground hover:underline"
                  >
                    {u.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {(u.followersCount ?? 0).toLocaleString()} followers
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={followingSet.has(u.id) ? "outline" : "default"}
                  onClick={() => handleToggleFollow(u.id)}
                  disabled={followLoading === u.id || u.id === user?.id}
                  className={`shrink-0 text-xs font-semibold h-8 px-4 ${!followingSet.has(u.id) ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
                >
                  {followLoading === u.id ? "..." : followingSet.has(u.id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có người dùng nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Khám phá ảnh
        </h3>
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
          {filteredPosts
            .flatMap((post) =>
              (post.photos || []).map((photo, i) => ({
                post,
                photo,
                keyId: `${post.id}-${i}`,
              }))
            )
            .slice(0, visibleExplorePostsCount)
            .map(({ post, photo, keyId }) => (
              <div
                key={keyId}
                className="break-inside-avoid mb-4 group relative flex flex-col gap-2 rounded-2xl bg-card border border-border/40 p-2 shadow-sm transition-all hover:shadow-xl hover:border-primary/20"
              >
                {/* Image with Hover Overlay */}
                <div className="relative overflow-hidden rounded-xl bg-muted cursor-pointer">
                  <Link href={`/post/${post.id}`}>
                    <img
                      src={photo.imageUrl || "/placeholder.svg"}
                      alt="Explore photo"
                      className="w-full h-auto object-cover rounded-xl transition-all duration-500 group-hover:scale-105 group-hover:brightness-95"
                      loading="lazy"
                    />
                  </Link>

                  {/* Pinterest Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-3">
                    {/* Top Bar (Shooting Tip & Save button) */}
                    <div className="flex justify-between w-full pointer-events-auto">
                      {post.shootingTip ? (
                        <div className="bg-black/50 backdrop-blur-md text-yellow-400 rounded-full p-1.5 h-7 w-7 flex items-center justify-center shadow-md cursor-help" title="Có mẹo chụp ảnh">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                      ) : <div />}
                      
                      {post.author?.id !== user?.id && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleSave(post.id);
                          }}
                          className={cn(
                            "rounded-full px-4 py-2 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer z-30",
                            savedSet.has(post.id)
                              ? "bg-white text-primary hover:bg-white/90"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {savedSet.has(post.id) ? "Đã lưu" : "Lưu"}
                        </button>
                      )}
                    </div>

                    {/* Bottom Bar (Location, Likes & Comments) */}
                    <div className="flex items-center justify-between text-white pointer-events-auto gap-1.5 w-full">
                      {post.location?.name && (
                        <Link
                          href={`/map?location=${post.location.id}`}
                          className="flex-1 min-w-0 flex items-center gap-1 text-[10px] font-bold bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full hover:bg-black/70 transition-all"
                        >
                          <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                          <span className="truncate block">{post.location.name}</span>
                        </Link>
                      )}
                      <div className="shrink-0 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full">
                        <div className="flex items-center gap-1 text-[10px] font-black">
                          <Heart className={cn("h-3 w-3 shrink-0 transition-colors", post.liked ? "fill-red-500 text-red-500" : "text-white")} />
                          <span>{post.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black">
                          <MessageCircle className="h-3 w-3 text-white shrink-0" />
                          <span>{post.commentCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Credits & Caption */}
                <div className="flex items-center gap-2 px-1 py-1">
                  <Link href={`/profile/${post.author?.id}`} className="shrink-0 self-start mt-0.5">
                    <Avatar className="h-6 w-6 border border-border/40 shadow-sm">
                      <AvatarImage src={post.author?.avatarUrl || "/default-avatar.svg"} />
                      <AvatarFallback className="text-[9px] font-bold">
                        {post.author?.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground/80 line-clamp-1 leading-tight hover:underline cursor-pointer">
                      {post.caption || "Góc ảnh đẹp"}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1 overflow-hidden">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <Link 
                            key={idx} 
                            href={`/explore?tag=${tag}`} 
                            className="text-[9px] text-primary/80 bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-sm transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <Link
                        href={`/profile/${post.author?.id}`}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors truncate font-semibold"
                      >
                        by {post.author?.username || "Photographer"}
                      </Link>
                      {post.createdDate && (
                        <span className="text-[9px] text-muted-foreground/70 shrink-0 ml-2">
                          {parseUTCDate(post.createdDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {filteredPosts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Camera className="h-12 w-12 mb-3" strokeWidth={1} />
              <p className="text-sm">Chưa có ảnh nào</p>
            </div>
          )}
        </div>
        
        {hasMore && (
          <div className="flex justify-center pt-8 pb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setVisibleExplorePostsCount(prev => prev + 20)
                fetchMorePosts()
              }}
              disabled={loadingMore}
              className="rounded-full px-8 bg-card"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Xem thêm ảnh
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
