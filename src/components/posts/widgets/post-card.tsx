"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  MoreHorizontal,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Flag,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { apiFetch } from "@/services/api.service"
import { useToast } from "@/hooks/use-toast"
import { showLoginRequiredToast, showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useRouter } from "next/navigation"
import type { Post } from "@/types"
import { parseUTCDate } from "@/utils/date"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ImageCarousel } from "./image-carousel"
import { DeletePostDialog } from "../modals/delete-post-dialog"
import { EditPostDialog } from "../modals/edit-post-dialog"

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ""
  const date = parseUTCDate(dateStr)
  if (isNaN(date.getTime())) return ""
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 120) return "vừa xong"
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
  if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`
  return `${Math.floor(diff / 31536000)} năm trước`
}

interface PostCardProps {
  post: Post
}



export function PostCard({ post: initialPost }: PostCardProps) {
  const [post, setPost] = useState(initialPost)
  const [isDeleted, setIsDeleted] = useState(false)

  const caption = post.caption || ""
  const imageUrls = post.photos?.map(p => p.imageUrl) || []
  const displayLikes = post.likeCount ?? 0
  const displayDate = post.createdDate || ""
  const displayTip = post.shootingTip || ""

  const [liked, setLiked] = useState(post.liked ?? false)
  const [saved, setSaved] = useState(post.isSaved ?? false)
  const [likesCount, setLikesCount] = useState(displayLikes)
  const [showTip, setShowTip] = useState(false)
  const [isLoadingLike, setIsLoadingLike] = useState(false)

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editCaption, setEditCaption] = useState(caption)
  const [editTip, setEditTip] = useState(displayTip)
  const [isEditing, setIsEditing] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const { user } = useAuth()
  const router = useRouter()
  const isOwner = user?.id === post.author.id

  const toggleLike = async () => {
    if (!user) {
      showLoginRequiredToast(router)
      return
    }

    if (isLoadingLike) return
    setIsLoadingLike(true)

    const previousLiked = liked
    const previousCount = likesCount

    setLiked(!previousLiked)
    setLikesCount(prev => previousLiked ? prev - 1 : prev + 1)

    try {
      const response = await apiFetch(`/api/v1/posts/${post.id}/like?userId=${user.id}`, {
        method: "POST"
      })
      if (response && typeof response.totalLikes === 'number') setLikesCount(response.totalLikes)
      if (response && typeof response.liked === 'boolean') setLiked(response.liked)
    } catch (error: any) {
      setLiked(previousLiked)
      setLikesCount(previousCount)
      showErrorToast("Lỗi", "Không thể thực hiện thao tác. Vui lòng thử lại.")
    } finally {
      setIsLoadingLike(false)
    }
  }

  const toggleSave = async () => {
    if (!user) { showLoginRequiredToast(router); return }
    const previousSaved = saved
    setSaved(!previousSaved)
    try {
      await apiFetch(`/api/v1/saved/${post.id}?userId=${user.id}`, { method: "POST" })
      showSuccessToast(
        !previousSaved ? "Đã lưu" : "Đã bỏ lưu",
        !previousSaved ? "Bài viết đã được lưu vào profile của bạn" : "Đã xóa khỏi danh sách lưu"
      )
    } catch (error) {
      setSaved(previousSaved)
      showErrorToast("Lỗi", "Không thể thực hiện thao tác.")
    }
  }

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)
      showSuccessToast("Đã sao chép", "Liên kết bài viết đã được lưu vào khay nhớ tạm.")
    } catch (error) {
      showErrorToast("Lỗi", "Không thể chia sẻ liên kết.")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiFetch(`/api/v1/posts/delete/${post.id}`, { method: "DELETE" })
      showSuccessToast("Đã xoá", "Bài viết của bạn đã được xoá thành công.")
      setIsDeleted(true)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      showErrorToast("Lỗi", "Xoá bài viết thất bại.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async () => {
    setIsEditing(true)
    try {
      const res = await apiFetch(`/api/v1/posts/updated/${post.id}`, {
        method: "PUT",
        body: JSON.stringify({
          caption: editCaption,
          shootingTip: editTip,
          tags: post.tags || []
        })
      })
      setPost(res)
      showSuccessToast("Thành công", "Bài viết đã được cập nhật.")
      setIsEditDialogOpen(false)
    } catch (error) {
      showErrorToast("Lỗi", "Cập nhật bài viết thất bại.")
    } finally {
      setIsEditing(false)
    }
  }

  const submitReport = async () => {
    if (!reportReason?.trim() || !post) return
    setIsSubmittingReport(true)
    try {
      await apiFetch(`/api/posts/${post.id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason })
      })
      showSuccessToast("Đã báo cáo", "Quản trị viên sẽ xem xét báo cáo của bạn.")
      setIsReportModalOpen(false)
      setReportReason("")
    } catch {
      showErrorToast("Lỗi", "Gửi báo cáo thất bại. Vui lòng thử lại sau.")
    } finally {
      setIsSubmittingReport(false)
    }
  }

  if (isDeleted) return null

  return (
    <article className="border-b border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.author.avatarUrl || "/default-avatar.svg"}
              alt={post.author.username}
            />
            <AvatarFallback>
              {post.author.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link
            href={`/profile/${post.author.id}`}
            className="text-sm font-semibold text-foreground hover:underline flex items-center gap-2"
          >
            {post.author.username}
            {post.author.levelTitle && (
              <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-sm">
                {post.author.levelTitle}
              </span>
            )}
          </Link>
          {post.location && (
            <Link
              href={`/map?location=${post.location.id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <MapPin className="h-3 w-3" />
              {post.location.name}
            </Link>
          )}
        </div>

        {/* Dropdown Menu for Edit/Delete */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground outline-none"
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" /> Sửa bài viết
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Xoá bài viết
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50">
                <Flag className="mr-2 h-4 w-4" /> Báo cáo vi phạm
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-5 pb-3 pt-1">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {caption}
        </p>
        {post.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal text-muted-foreground"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {imageUrls.length > 0 && <ImageCarousel images={imageUrls} postId={post.id} />}

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0 hover:bg-transparent"
            onClick={toggleLike}
            disabled={isLoadingLike}
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-all",
                liked ? "fill-red-500 text-red-500" : "text-foreground"
              )}
            />
            <span className="text-sm font-medium text-foreground">
              {likesCount.toLocaleString()}
            </span>
          </Button>
          <Link
            href={`/post/${post.id}`}
            className="group flex items-center gap-1.5 text-foreground transition-colors"
          >
            <MessageCircle className="h-6 w-6 group-hover:text-primary" />
            <span className="text-sm font-medium">{post.commentCount ?? 0}</span>
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="text-foreground transition-colors hover:text-primary"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {displayTip && (
            <button
              type="button"
              onClick={() => setShowTip((s) => !s)}
              className={cn(
                "rounded-full p-1.5 transition-colors",
                showTip
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-label="Photo tip"
            >
              <Lightbulb className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleSave}
            className="transition-colors"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <Bookmark
              className={cn(
                "h-6 w-6 transition-all",
                saved ? "fill-primary text-primary" : "text-foreground"
              )}
            />
          </button>
        </div>
      </div>

      {/* Photo Tip */}
      {showTip && displayTip && (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-xl bg-primary/5 p-4 border border-primary/10 shadow-inner">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Lightbulb className="h-4 w-4 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">
              {post.location?.locationType === "SERVICE" ? "Đánh giá trải nghiệm" : "Mẹo chụp ảnh"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80 font-medium italic">
              "{displayTip}"
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pb-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground" title={displayDate}>
          {timeAgo(displayDate)}
        </p>
      </div>

      <DeletePostDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <EditPostDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onConfirm={handleEdit}
        isEditing={isEditing}
        caption={editCaption}
        setCaption={setEditCaption}
        tip={editTip}
        setTip={setEditTip}
      />

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Flag className="h-5 w-5 text-rose-500" />
              Báo cáo bài viết
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-3">
              Vui lòng cho chúng tôi biết lý do bạn báo cáo bài viết này (Ví dụ: Spam, nội dung nhạy cảm, vi phạm bản quyền...)
            </p>
            <Textarea
              placeholder="Nhập lý do báo cáo..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[120px] resize-none focus-visible:ring-rose-500"
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Hủy</Button>
            <Button
              variant="default"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={submitReport}
              disabled={isSubmittingReport || !reportReason.trim()}
            >
              {isSubmittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}

