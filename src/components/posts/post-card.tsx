"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MapPin, Heart, MessageCircle, Bookmark, Share2 } from "lucide-react"
import { type Post } from "@/types"
import { formatRelativeTime } from "@/utils/date"
import { useAuth } from "@/context/AuthContext"
import { toggleLike, toggleSave } from "@/services/post.service"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PostCardProps {
  post: Post
}

export function PostCard({ post: initialPost }: PostCardProps) {
  const [post, setPost] = useState(initialPost)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [isLiking, setIsLiking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLike = async () => {
    if (!user) return toast({ title: "Cần đăng nhập", variant: "destructive" })
    if (isLiking) return
    setIsLiking(true)
    try {
      const { liked, likeCount } = await toggleLike(post.id, user.id)
      setPost(prev => ({ ...prev, liked, likeCount }))
    } catch {
      toast({ title: "Lỗi", description: "Không thể thả tim", variant: "destructive" })
    } finally {
      setIsLiking(false)
    }
  }

  const handleSave = async () => {
    if (!user) return toast({ title: "Cần đăng nhập", variant: "destructive" })
    if (isSaving) return
    setIsSaving(true)
    try {
      await toggleSave(post.id, user.id)
      setPost(prev => ({ ...prev, isSaved: !prev.isSaved }))
    } catch {
      toast({ title: "Lỗi", description: "Không thể lưu bài viết", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const firstImage = post.photos?.[0]?.imageUrl || "/placeholder.jpg"
  const isLongCaption = post.caption && (post.caption.length > 150 || post.caption.split('\n').length > 3)

  return (
    <div className="bg-card sm:border sm:rounded-2xl border-border mb-6 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={post.author.avatarUrl || "/default-avatar.svg"} />
            <AvatarFallback>{post.author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm text-foreground">{post.author.username}</p>
            {post.location && (
              <Link href={`/location/${post.location.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.location.name}
              </Link>
            )}
          </div>
        </Link>
      </div>

      {/* Image */}
      <Link href={`/post/${post.id}`} className="block relative w-full aspect-[4/5] sm:aspect-square bg-muted">
        <Image src={firstImage} alt="Post image" fill className="object-cover" />
      </Link>

      {/* Actions */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`hover:scale-110 transition-transform ${post.liked ? "text-red-500" : "text-foreground"}`}>
            <Heart className={`h-6 w-6 ${post.liked ? "fill-current" : ""}`} />
          </button>
          <Link href={`/post/${post.id}#comments`} className="hover:scale-110 transition-transform text-foreground block">
            <MessageCircle className="h-6 w-6" />
          </Link>
          <button className="hover:scale-110 transition-transform text-foreground hidden sm:block">
            <Share2 className="h-6 w-6" />
          </button>
        </div>
        <button onClick={handleSave} className="hover:scale-110 transition-transform text-foreground">
          <Bookmark className={`h-6 w-6 ${post.isSaved ? "fill-current text-primary" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="font-bold text-sm mb-1">{post.likeCount} lượt thích</p>
        <div className="text-sm">
          <div className={`whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""}`}>
            <span className="inline">{post.caption}</span>
          </div>
          {isLongCaption && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-muted-foreground text-xs mt-1 hover:underline"
            >
              {isExpanded ? "Ẩn bớt" : "Xem thêm"}
            </button>
          )}
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <p className="text-sm text-primary mt-1 flex flex-wrap gap-1">
            {post.tags.map(tag => (
              <span 
                key={tag} 
                onClick={() => router.push(`/?q=${encodeURIComponent(tag)}`)}
                className="cursor-pointer hover:underline"
              >
                #{tag}
              </span>
            ))}
          </p>
        )}

        {(post.commentCount && post.commentCount > 0) ? (
          <Link href={`/post/${post.id}`} className="text-muted-foreground text-sm mt-1 block hover:underline">
            Xem tất cả {post.commentCount} bình luận
          </Link>
        ) : null}
        <p className="text-[10px] text-muted-foreground mt-2 uppercase font-semibold tracking-wider">
          {formatRelativeTime(post.createdDate)}
        </p>
      </div>
    </div>
  )
}
