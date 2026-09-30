"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Award, Camera, MapPin, UserCheck, UserPlus, Loader2, Zap, Settings, ArrowLeft, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { User, Post } from "@/types"
import { chatService } from "@/services/chat.service"
import { shareContent } from "@/utils/share"
import { safeNavigateBack } from "@/utils/navigation"

interface ProfileHeaderProps {
  user: User
  userPosts: Post[]
  isOwnProfile: boolean
  showBackButton: boolean
  following: boolean
  followersCount: number
  followingCount: number
  isLoadingFollow: boolean
  canFollow: boolean
  toggleFollow: () => void
  currentLevel: number
  exp: number
}

export function ProfileHeader({
  user,
  userPosts,
  isOwnProfile,
  showBackButton,
  following,
  followersCount,
  followingCount,
  isLoadingFollow,
  canFollow,
  toggleFollow,
  currentLevel,
  exp,
}: ProfileHeaderProps) {
  const router = useRouter()

  const handleShareProfile = () => {
    shareContent({
      title: `Hồ sơ của ${user.username} | Vietnam Photo Scout`,
      text: user.bio || `Khám phá các tác phẩm ảnh của ${user.username} trên Vietnam Photo Scout!`,
      path: `/profile/${user.id}`,
      customSuccessMsg: "Đã sao chép liên kết hồ sơ vào khay nhớ tạm!",
    })
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={() => safeNavigateBack(router, "/")}
              className="rounded-full p-1.5 text-foreground hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-bold text-foreground">{user.username}</h2>
        </div>
        {isOwnProfile && (
          <Link href="/settings" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Link>
        )}
      </header>

      {/* Profile Info */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex gap-10">
          <Avatar className="h-32 w-32 shrink-0 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
            <AvatarImage src={user.avatarUrl || "/default-avatar.svg"} alt={user.username} />
            <AvatarFallback className="text-3xl">{user.username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
              <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-xs text-primary">
                <Award className="h-3 w-3" />
                {(() => {
                  if (currentLevel === 2) return "Thợ Săn Tập Sự";
                  if (currentLevel === 3) return "Thợ Săn Ảnh";
                  if (currentLevel === 4) return "Bậc Thầy Khám Phá";
                  if (currentLevel === 5) return "Tinh Anh";
                  if (currentLevel >= 6) return "Huyền Thoại";
                  return "Tân Binh";
                })()}
              </Badge>
            </div>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{user.bio}</p>

            {/* Stats */}
            <div className="mt-5 flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{userPosts.length}</span>
                <span className="text-xs text-muted-foreground">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{followersCount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{followingCount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Following</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              {isOwnProfile ? (
                <>
                  <Link href="/settings">
                    <Button variant="outline" className="bg-transparent text-sm" size="sm">
                      Chỉnh sửa hồ sơ
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="bg-transparent text-sm gap-1.5"
                    size="sm"
                    onClick={handleShareProfile}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Chia sẻ hồ sơ
                  </Button>
                </>
              ) : (
                <>
                  {canFollow && (
                    <Button
                      className={cn(
                        "flex items-center gap-2 text-sm transition-all",
                        following
                          ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      size="sm"
                      onClick={toggleFollow}
                      disabled={isLoadingFollow}
                    >
                      {isLoadingFollow ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {following ? "Đang theo dõi" : "Theo dõi"}
                    </Button>
                  )}
                  {canFollow && (
                    <Button
                      variant="outline"
                      className="bg-transparent text-sm"
                      size="sm"
                      onClick={async () => {
                        try {
                          await chatService.getOrCreateConversation(user.id)
                          router.push('/messages')
                        } catch (e) {
                          console.error('Lỗi khi tạo cuộc trò chuyện:', e)
                        }
                      }}
                    >
                      Nhắn tin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="bg-transparent text-sm gap-1.5"
                    size="sm"
                    onClick={handleShareProfile}
                    title="Chia sẻ hồ sơ"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Chia sẻ
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stat Highlights */}
        <div className="mt-6 flex gap-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{userPosts.length} ảnh</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-foreground">
              {new Set(userPosts.map((p) => p.location?.province || p.location?.name)).size} tỉnh thành
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {(() => {
                if (currentLevel === 2) return "Thợ Săn Tập Sự";
                if (currentLevel === 3) return "Thợ Săn Ảnh";
                if (currentLevel === 4) return "Bậc Thầy Khám Phá";
                if (currentLevel === 5) return "Tinh Anh";
                if (currentLevel >= 6) return "Huyền Thoại";
                return "Tân Binh";
              })()}
            </span>
          </div>
        </div>

        {/* Premium Level Banner */}
        {(() => {
          let nextLevelExp = 50; 
          if (currentLevel === 2) nextLevelExp = 200;
          else if (currentLevel === 3) nextLevelExp = 500;
          else if (currentLevel === 4) nextLevelExp = 1500;
          else if (currentLevel === 5) nextLevelExp = 4000;
          else if (currentLevel >= 6) nextLevelExp = exp;
          
          let prevLevelExp = 0;
          if (currentLevel === 2) prevLevelExp = 50;
          else if (currentLevel === 3) prevLevelExp = 200;
          else if (currentLevel === 4) prevLevelExp = 500;
          else if (currentLevel === 5) prevLevelExp = 1500;
          else if (currentLevel >= 6) prevLevelExp = 4000;

          const progressPercent = currentLevel >= 6 ? 100 : Math.min(100, Math.max(0, ((exp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100));

          let title = "Tân Binh";
          let gradient = "from-slate-400 to-slate-500";
          let shadow = "shadow-slate-500/20";
          if (currentLevel === 2) { title = "Thợ Săn Tập Sự"; gradient = "from-green-400 to-emerald-600"; shadow = "shadow-emerald-500/20"; }
          else if (currentLevel === 3) { title = "Thợ Săn Ảnh"; gradient = "from-blue-400 to-indigo-600"; shadow = "shadow-indigo-500/20"; }
          else if (currentLevel === 4) { title = "Bậc Thầy Khám Phá"; gradient = "from-purple-400 to-fuchsia-600"; shadow = "shadow-fuchsia-500/20"; }
          else if (currentLevel === 5) { title = "Tinh Anh"; gradient = "from-rose-400 to-red-600"; shadow = "shadow-red-500/20"; }
          else if (currentLevel >= 6) { title = "Huyền Thoại"; gradient = "from-amber-300 via-yellow-500 to-orange-600"; shadow = "shadow-orange-500/30"; }

          return (
            <div className={`mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-[1px] shadow-lg ${shadow}`}>
              <div className="relative h-full w-full rounded-[15px] bg-card/95 backdrop-blur-xl p-5">
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />
                <div className={`absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr ${gradient} opacity-20 blur-2xl`} />
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-inner shrink-0`}>
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{title}</h3>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">Level {currentLevel} Photo Scout</p>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-muted-foreground">Tiến độ thăng cấp</span>
                      <span className="text-foreground">{currentLevel >= 6 ? "Tối đa" : `${exp} / ${nextLevelExp} EXP`}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50 ring-1 ring-inset ring-border/50">
                      <div className={`h-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out relative`} style={{ width: `${progressPercent}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground/70 font-medium flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {currentLevel >= 6 ? "Đỉnh cao nhiếp ảnh gia!" : "Đăng ảnh chất lượng cao để tăng điểm nhanh hơn"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  )
}
