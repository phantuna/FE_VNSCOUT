"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Post, type Comment } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { apiFetch } from "@/services/api.service"
import { showLoginRequiredToast, showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { PostImageGallery } from "./widgets/post-image-gallery"
import { PostComments } from "./widgets/post-comments"
import { PostAuthorHeader } from "./widgets/post-author-header"
import { PostContentInfo } from "./widgets/post-content-info"
import { PostInteractionBar } from "./widgets/post-interaction-bar"
import { DeletePostDialog } from "./modals/delete-post-dialog"
import { EditPostDialog } from "./modals/edit-post-dialog"
import { ReportPostDialog } from "./modals/report-post-dialog"
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
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  
  // Lifted state for syncing image gallery and EXIF data
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

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

  const submitReport = async (reason: string) => {
    if (!reason?.trim() || !post) return
    setIsSubmittingReport(true)
    try {
      await apiFetch(`/api/posts/${post.id}/report`, { method: "POST", body: JSON.stringify({ reason }) })
      showSuccessToast("Đã báo cáo", "Quản trị viên sẽ xem xét báo cáo của bạn.")
      setIsReportModalOpen(false)
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
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Bài viết
          </Button>
        </div>
      </header>

      {/* ─── Main 2-column layout ─── */}
      <div className="flex h-[calc(100vh-57px)]">

        {/* LEFT: Sticky image gallery */}
        <div className="hidden md:flex md:w-[55%] lg:w-[60%] xl:w-[62%] items-center justify-center bg-slate-950 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
          <PostImageGallery 
            post={post} 
            activeIndex={activePhotoIndex} 
            onIndexChange={setActivePhotoIndex} 
          />
        </div>

        {/* RIGHT: Scrollable info + comments panel */}
        <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[38%] flex flex-col overflow-y-auto border-l border-slate-100">

          {/* Mobile gallery */}
          <div className="md:hidden bg-slate-950">
            <PostImageGallery 
              post={post} 
              activeIndex={activePhotoIndex} 
              onIndexChange={setActivePhotoIndex} 
            />
          </div>

          {/* ── Author row ── */}
          <PostAuthorHeader
            author={post.author}
            location={post.location}
            isOwner={isOwner}
            onShare={handleShare}
            onEdit={() => setIsEditDialogOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onReport={handleReportClick}
          />

          {/* ── Caption + Tags + Tip + EXIF ── */}
          <PostContentInfo
            caption={post.caption}
            tags={post.tags}
            shootingTip={post.shootingTip}
            photo={post.photos?.[activePhotoIndex]}
          />

          {/* ── Like / Comment / Share / Save counts ── */}
          <PostInteractionBar
            likesCount={likesCount}
            commentsCount={comments.length}
            liked={liked}
            saved={saved}
            isLiking={isLiking}
            isSavingPost={isSavingPost}
            onToggleLike={toggleLike}
            onToggleSave={toggleSave}
            onShare={handleShare}
          />

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
      <ReportPostDialog
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        onSubmit={submitReport}
        isSubmitting={isSubmittingReport}
      />

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
