import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostInteractionBarProps {
  likesCount: number
  commentsCount: number
  liked: boolean
  saved: boolean
  isLiking: boolean
  isSavingPost: boolean
  onToggleLike: () => void
  onToggleSave: () => void
  onShare: () => void
}

export function PostInteractionBar({
  likesCount,
  commentsCount,
  liked,
  saved,
  isLiking,
  isSavingPost,
  onToggleLike,
  onToggleSave,
  onShare
}: PostInteractionBarProps) {
  return (
    <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleLike}
          disabled={isLiking}
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-95",
            liked ? "text-rose-500" : "text-slate-500 hover:text-rose-400"
          )}
        >
          <Heart className={cn("h-5 w-5 transition-all", liked && "fill-current scale-110")} />
          <span>{likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span>{commentsCount}</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
      <button
        onClick={onToggleSave}
        disabled={isSavingPost}
        className={cn(
          "transition-all active:scale-95",
          saved ? "text-primary" : "text-slate-400 hover:text-primary"
        )}
      >
        <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
      </button>
    </div>
  )
}
