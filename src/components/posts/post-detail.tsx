"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, Bookmark, Heart, Share2, Flag, Loader2,
  MessageCircle, MoreHorizontal, Pencil, Trash2, MapPin, Lightbulb
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type Post, type Comment } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { apiFetch } from "@/services/api.service"
import { showLoginRequiredToast, showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PostImageGallery } from "./widgets/post-image-gallery"
import { PostComments } from "./widgets/post-comments"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DeletePostDialog } from "./modals/delete-post-dialog"
import { EditPostDialog } from "./modals/edit-post-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { parseUTCDate } from "@/utils/date"

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ""
  const date = parseUTCDate(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 120) return "vừa xong"
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
  return `${Math.floor(diff / 604800)} tuần trước`
}

export function PostDetailView({
  post: initialPost,
  comments: initialComments,
  postId,
}: {
  post?: Post
  comments?: Comment[]
  postId?: string
}) {
  const router = useRouter()
  const { user } = useAuth()

  const [post, setPost] = useState<Post | null>(initialPost || null)
  const [comments, setComments] = useState<Comment[]>(initialComments || [])
  const [loading, setLoading] = useState(!initialPost && !!postId)
  const [liked, setLiked] = useState(post?.liked || false)
  const [saved, setSaved] = useState(post?.isSaved || false)
  const [likesCount, setLikesCount] = useState(post?.likeCount || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isSavingPost, setIsSavingPost] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  // Dialog states for Edit / Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editCaption, setEditCaption] = useState("")
  const [editTip, setEditTip] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const isOwner = user?.id === post?.author?.id

  const showLoginToast = () => {
    showLoginRequiredToast(router)
  }

  // 1. Fetch Post Detail
  useEffect(() => {
    async function fetchPostData() {
      if (!postId || initialPost) return
      try {
        setLoading(true)
        const url = user?.id ? `/api/v1/posts/${postId}?viewerId=${user.id}` : `/api/v1/posts/${postId}`
        const postData = await apiFetch(url)
        setPost(postData)
        setLiked(postData.liked)
        setSaved(postData.isSaved)
        setLikesCount(postData.likeCount)
        setEditCaption(postData.caption || "")
        setEditTip(postData.shootingTip || "")
      } catch (error) {
        console.error("Failed to fetch post:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPostData()
  }, [postId, initialPost, user?.id])

  // 2. Fetch and Poll Comments (Mỗi 10 giây)
  useEffect(() => {
    if (!postId) return

    async function fetchComments() {
      try {
        const commentsData = await apiFetch(`/api/v1/comments/post/${postId}`)
        setComments(commentsData.content || [])
      } catch (err) {
        console.error("Failed to fetch comments", err)
      }
    }
    
    fetchComments()

    const interval = setInterval(fetchComments, 10000)
    return () => clearInterval(interval)
  }, [postId])

  const toggleLike = async () => {
    if (!user) { showLoginToast(); return }
    if (!post || isLiking) return
    setIsLiking(true)
    const prev = liked; const prevCount = likesCount
    setLiked(!prev); setLikesCount(c => prev ? c - 1 : c + 1)
    try {
      const res = await apiFetch(`/api/v1/posts/${post.id}/like?userId=${user.id}`, { method: "POST" })
      if (res && typeof res.totalLikes === "number") setLikesCount(res.totalLikes)
      if (res && typeof res.liked === "boolean") setLiked(res.liked)
    } catch { setLiked(prev); setLikesCount(prevCount) }
    finally { setIsLiking(false) }
  }

  const toggleSave = async () => {
    if (!user) { showLoginToast(); return }
    if (!post || isSavingPost) return
    setIsSavingPost(true)
    const prev = saved; setSaved(!prev)
    try {
      await apiFetch(`/api/v1/saved/${post.id}?userId=${user.id}`, { method: "POST" })
    } catch { setSaved(prev) }
    finally { setIsSavingPost(false) }
  }

  const handleReportClick = () => {
    if (!user) { showLoginToast(); return }
    if (!post) return
    setIsReportModalOpen(true)
  }

  const submitReport = async () => {
    if (!reportReason?.trim() || !post) return
    setIsSubmittingReport(true)
    try {
      await apiFetch(`/api/posts/${post.id}/report`, { method: "POST", body: JSON.stringify({ reason: reportReason }) })
      showSuccessToast("Đã báo cáo", "Quản trị viên sẽ xem xét báo cáo của bạn.")
      setIsReportModalOpen(false)
      setReportReason("")
    } catch {
      showErrorToast("Lỗi", "Gửi báo cáo thất bại. Vui lòng thử lại sau.")
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post?.id || postId}`
      await navigator.clipboard.writeText(url)
      showSuccessToast("Đã sao chép", "Liên kết bài viết đã được lưu vào khay nhớ tạm.")
    } catch (error) {
      showErrorToast("Lỗi", "Không thể chia sẻ liên kết.")
    }
  }

  const handleDelete = async () => {
    if (!post) return
    setIsDeleting(true)
    try {
      await apiFetch(`/api/v1/posts/delete/${post.id}`, { method: "DELETE" })
      showSuccessToast("Đã xoá", "Bài viết của bạn đã được xoá thành công.")
      setIsDeleteDialogOpen(false)
      router.back()
    } catch (error) {
      showErrorToast("Lỗi", "Xoá bài viết thất bại.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async () => {
    if (!post) return
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Không tìm thấy bài viết</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    )
  }

  const displayLocation = post.location?.name || "Địa điểm chưa xác định"
  const locName = post.location?.nameWithType?.trim() ?? ""
  const locProv = post.location?.province?.trim() ?? ""
  const displayAddress = post.location?.address || [locName, locProv].filter(Boolean).join(", ") || ""

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Topbar ─── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Bài viết
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 outline-none"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
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
                  <DropdownMenuItem onClick={handleReportClick} className="cursor-pointer text-rose-500 focus:text-rose-500">
                    <Flag className="mr-2 h-4 w-4" /> Báo cáo vi phạm
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─── Main 2-column layout ─── */}
      <div className="flex h-[calc(100vh-57px)]">

        {/* LEFT: Sticky image gallery */}
        <div className="hidden md:flex md:w-[55%] lg:w-[60%] xl:w-[62%] items-center justify-center bg-slate-950 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
          <PostImageGallery post={post} />
        </div>

        {/* RIGHT: Scrollable info + comments panel */}
        <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[38%] flex flex-col overflow-y-auto border-l border-slate-100">

          {/* Mobile gallery */}
          <div className="md:hidden bg-slate-950">
            <PostImageGallery post={post} />
          </div>

          {/* ── Author row ── */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-1 shrink-0">
                <AvatarImage src={post.author.avatarUrl || "/default-avatar.svg"} />
                <AvatarFallback>{post.author.username?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${post.author.id}`} className="hover:underline">
                <p className="font-bold text-slate-900 text-sm truncate">{post.author.username}</p>
              </Link>
              {displayAddress && (
                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {displayAddress}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 shrink-0 outline-none">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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
                  <DropdownMenuItem onClick={handleReportClick} className="cursor-pointer text-rose-500 focus:text-rose-500">
                    <Flag className="mr-2 h-4 w-4" /> Báo cáo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Caption + Tags + Tip ── */}
          <div className="px-5 py-4 space-y-3 border-b border-slate-100">
            {post.caption && (
              <p className="text-sm text-slate-800 leading-relaxed">{post.caption}</p>
            )}
            {(post.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(post.tags || []).map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {post.shootingTip && (
              <div className="flex gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <Lightbulb className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-600 mb-0.5">Photo Tip</p>
                  <p className="text-xs text-orange-700 leading-relaxed">{post.shootingTip}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Like / Comment / Share / Save counts ── */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
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
                <span>{comments.length}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={toggleSave}
              disabled={isSavingPost}
              className={cn(
                "transition-all active:scale-95",
                saved ? "text-primary" : "text-slate-400 hover:text-primary"
              )}
            >
              <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
            </button>
          </div>

          {/* ── Comments (flex-1 to fill height) ── */}
          <div className="flex-1">
            <PostComments
              postId={post.id}
              comments={comments}
              setComments={setComments}
              showLoginToast={showLoginToast}
            />
          </div>
        </div>
      </div>

      {/* ─── Report modal ─── */}
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
    </div>
  )
}
