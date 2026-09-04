"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MapPin, Heart, MessageCircle, Bookmark, Share2, Lightbulb } from "lucide-react"
import { type Post } from "@/types"
import { formatRelativeTime } from "@/utils/date"
import { useAuth } from "@/context/AuthContext"
import { toggleLike, toggleSave } from "@/services/post.service"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

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
  const [showTip, setShowTip] = useState(false)

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

      {/* Image / Carousel */}
      {post.photos && post.photos.length > 1 ? (
        <Carousel className="w-full relative group">
          <CarouselContent>
            {post.photos.map((photo, index) => (
              <CarouselItem key={photo.id || index}>
                <Link href={`/post/${post.id}`} className="block relative w-full aspect-[4/5] sm:aspect-square bg-muted">
                  <Image src={photo.imageUrl} alt={`Post image ${index + 1}`} fill className="object-cover" />
                  <div className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-semibold z-10 shadow-sm">
                    {index + 1} / {post.photos.length}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black border-none h-8 w-8 shadow-md" />
            <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black border-none h-8 w-8 shadow-md" />
          </div>
        </Carousel>
      ) : (
        <Link href={`/post/${post.id}`} className="block relative w-full aspect-[4/5] sm:aspect-square bg-muted">
          <Image src={firstImage} alt="Post image" fill className="object-cover" />
        </Link>
      )}

      {/* Actions */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1.5 hover:scale-110 transition-transform ${post.liked ? "text-red-500" : "text-foreground"}`}>
            <Heart className={`h-6 w-6 ${post.liked ? "fill-current" : ""}`} />
            {post.likeCount > 0 && <span className="text-sm font-semibold tabular-nums">{post.likeCount}</span>}
          </button>
          <Link href={`/post/${post.id}#comments`} className="flex items-center gap-1.5 hover:scale-110 transition-transform text-foreground">
            <MessageCircle className="h-6 w-6" />
            {(post.commentCount ?? 0) > 0 && <span className="text-sm font-semibold tabular-nums">{post.commentCount}</span>}
          </Link>
          <button className="hover:scale-110 transition-transform text-foreground hidden sm:block">
            <Share2 className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {post.shootingTip && (
            <button
              onClick={() => setShowTip(v => !v)}
              title="Xem mẹo chụp ảnh"
              className={`hover:scale-110 transition-all ${
                showTip ? "text-orange-500" : "text-muted-foreground hover:text-orange-400"
              }`}
            >
              <Lightbulb className={`h-5 w-5 ${showTip ? "fill-orange-100" : ""}`} />
            </button>
          )}
          <button onClick={handleSave} className="hover:scale-110 transition-transform text-foreground">
            <Bookmark className={`h-6 w-6 ${post.isSaved ? "fill-current text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Shooting Tip Banner */}
      {post.shootingTip && showTip && (
        <div className="mx-4 mb-2 flex gap-2.5 items-start bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 animate-in slide-in-from-top-2 duration-200">
          <Lightbulb className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 leading-relaxed">{post.shootingTip}</p>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4">
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

        <p className="text-[10px] text-muted-foreground mt-2 uppercase font-semibold tracking-wider">
          {formatRelativeTime(post.createdDate)}
        </p>
      </div>
    </div>
  )
}
