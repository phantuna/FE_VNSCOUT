"use client"

import { useRef } from "react"
import { Send, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type Comment } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/services/api.service"
import { useState, useEffect } from "react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
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
  if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`
  return `${Math.floor(diff / 31536000)} năm trước`
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PostCommentsProps {
  postId: string
  comments: Comment[]
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>
  showLoginToast: () => void
}

export function PostComments({ postId, comments, setComments, showLoginToast }: PostCommentsProps) {
  const { user } = useAuth()
  const [commentText, setCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState("")
  const commentInputRef = useRef<HTMLInputElement>(null)

  const handleEditSubmit = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const response = await apiFetch(`/api/v1/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ content: editCommentText })
      });
      
      setComments(prev => {
        return prev.map(c => {
          if (c.id === commentId) {
            return { ...c, content: response.content, updatedDate: response.updatedDate };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => r.id === commentId ? { ...r, content: response.content, updatedDate: response.updatedDate } : r)
            }
          }
          return c;
        });
      });
      setEditingCommentId(null);
      showSuccessToast("Thành công", "Đã cập nhật bình luận.");
    } catch (err: any) {
      console.error("Lỗi cập nhật bình luận:", err);
      const errorMsg = err.data?.message || err.message || "Không thể cập nhật bình luận.";
      showErrorToast("Lỗi", errorMsg);
    }
  }

  useEffect(() => {
    if (replyingTo && commentInputRef.current) {
      commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      commentInputRef.current.focus()
    }
  }, [replyingTo])

  const handleSubmit = async () => {
    if (!user) { showLoginToast(); return }
    if (!commentText.trim()) return
    try {
      const payload = { postId, content: commentText, parentId: replyingTo ? replyingTo.id : null }
      const response = await apiFetch("/api/v1/comments", { method: "POST", body: JSON.stringify(payload) })
      if (replyingTo) {
        setComments(prev => prev.map(c =>
          c.id === replyingTo.id || c.replies?.some(r => r.id === replyingTo.id)
            ? { ...c, replies: [response, ...(c.replies || [])] }
            : c
        ))
      } else {
        setComments(prev => [response, ...prev])
      }
      setCommentText("")
      setReplyingTo(null)
    } catch (err: any) {
      console.error("Failed to submit comment:", err)
      const errorMsg = err.data?.message || err.message || "Không thể gửi bình luận, vui lòng thử lại sau."
      showErrorToast("Lỗi gửi bình luận", errorMsg)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable comment list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {comments.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
        {comments.map((comment, idx) => (
          <div key={idx} className="space-y-3">
            {/* Root comment */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarImage src={comment.author.avatarUrl || "/default-avatar.svg"} />
                <AvatarFallback>{comment.author.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{comment.author.username}</span>
                  {editingCommentId !== comment.id && (
                    <span className="text-sm text-slate-700 leading-snug break-words">{comment.content}</span>
                  )}
                </div>
                {editingCommentId === comment.id && (
                  <div className="mt-1.5">
                    <Input
                      value={editCommentText}
                      onChange={e => setEditCommentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleEditSubmit(comment.id)
                        if (e.key === "Escape") setEditingCommentId(null)
                      }}
                      autoFocus
                      className="text-sm bg-slate-50 border-slate-200 h-8"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <Button size="sm" onClick={() => handleEditSubmit(comment.id)} className="h-6 text-[11px] bg-primary text-white px-3">Lưu</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-6 text-[11px] px-3">Hủy</Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-slate-400">{timeAgo(comment.createdDate)}</span>
                  <button onClick={() => setReplyingTo(comment)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-800">Trả lời</button>
                  {user && user.id === comment.author.id && (
                    <button
                      onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                    >
                      Sửa
                    </button>
                  )}
                  {user && (user.id === comment.author.id || user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN")) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-[11px] font-semibold text-rose-400 hover:text-rose-600">Xóa</button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
                          <AlertDialogDescription>Bạn có chắc chắn muốn xóa bình luận này không?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/v1/comments/${comment.id}`, { method: "DELETE" });
                                setComments(prev => prev.filter(c => c.id !== comment.id));
                                showSuccessToast("Đã xóa", "Bình luận của bạn đã được xóa.");
                              } catch (err) {
                                showErrorToast("Lỗi", "Không thể xóa bình luận lúc này.");
                              }
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-11 space-y-3 pl-3 border-l-2 border-slate-100">
                {comment.replies.map((reply, rIdx) => (
                  <div key={rIdx} className="flex gap-2.5">
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                      <AvatarImage src={reply.author.avatarUrl || "/default-avatar.svg"} />
                      <AvatarFallback>{reply.author.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{reply.author.username}</span>
                        {editingCommentId !== reply.id && (
                          <span className="text-sm text-slate-700 leading-snug break-words">{reply.content}</span>
                        )}
                      </div>
                      {editingCommentId === reply.id && (
                        <div className="mt-1.5">
                          <Input
                            value={editCommentText}
                            onChange={e => setEditCommentText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleEditSubmit(reply.id)
                              if (e.key === "Escape") setEditingCommentId(null)
                            }}
                            autoFocus
                            className="text-sm bg-slate-50 border-slate-200 h-8"
                          />
                          <div className="flex gap-2 mt-1.5">
                            <Button size="sm" onClick={() => handleEditSubmit(reply.id)} className="h-6 text-[11px] bg-primary text-white px-3">Lưu</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-6 text-[11px] px-3">Hủy</Button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-slate-400">{timeAgo(reply.createdDate)}</span>
                        <button onClick={() => setReplyingTo(comment)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-800">Trả lời</button>
                        {user && user.id === reply.author.id && (
                          <button
                            onClick={() => { setEditingCommentId(reply.id); setEditCommentText(reply.content); }}
                            className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                          >
                            Sửa
                          </button>
                        )}
                        {user && (user.id === reply.author.id || user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN")) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-[11px] font-semibold text-rose-400 hover:text-rose-600">Xóa</button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
                                <AlertDialogDescription>Bạn có chắc chắn muốn xóa bình luận này không?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await apiFetch(`/api/v1/comments/${reply.id}`, { method: "DELETE" });
                                      setComments(prev => prev.map(c =>
                                        c.id === comment.id
                                          ? { ...c, replies: c.replies?.filter(r => r.id !== reply.id) }
                                          : c
                                      ));
                                      showSuccessToast("Đã xóa", "Bình luận của bạn đã được xóa.");
                                    } catch (err) {
                                      showErrorToast("Lỗi", "Không thể xóa bình luận lúc này.");
                                    }
                                  }}
                                  className="bg-rose-500 hover:bg-rose-600 text-white"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticky input at bottom */}
      <div className="border-t border-slate-100 px-4 py-3 bg-white">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 px-3 py-1.5 bg-slate-50 rounded-full">
            <span>Đang trả lời <strong>{replyingTo.author.username}</strong></span>
            <button onClick={() => setReplyingTo(null)} className="font-bold hover:text-rose-500 ml-2">&times;</button>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatarUrl || "/default-avatar.svg"} />
            <AvatarFallback>Me</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Input
              ref={commentInputRef}
              placeholder={replyingTo ? `Trả lời ${replyingTo.author.username}...` : "Thêm bình luận ..."}
              value={commentText}
              onChange={e => {
                if (!user) { showLoginToast(); return }
                setCommentText(e.target.value)
              }}
              onFocus={e => {
                if (!user) { e.target.blur(); showLoginToast() }
              }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="flex-1 border-none bg-transparent text-sm focus-visible:ring-0 h-9 px-0"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              className={cn("h-7 w-7 rounded-full transition-all shrink-0", commentText.trim() ? "bg-primary" : "bg-slate-300")}
              disabled={!commentText.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
