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
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
      <h3 className="text-xl font-black text-slate-900 mb-8">Bình luận ({comments.length})</h3>

      <div className="space-y-6 mb-8">
        {comments.map((comment, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={comment.author.avatarUrl || "/default-avatar.svg"} />
                <AvatarFallback>{comment.author.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{comment.author.username}</span>
                  <span className="text-[10px] text-slate-400" title={comment.createdDate}>{timeAgo(comment.createdDate)}</span>
                </div>
                {editingCommentId === comment.id ? (
                  <div className="pt-2 pb-2">
                    <Input
                      value={editCommentText}
                      onChange={e => setEditCommentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleEditSubmit(comment.id)
                        if (e.key === "Escape") setEditingCommentId(null)
                      }}
                      autoFocus
                      className="text-sm bg-white border-slate-200"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleEditSubmit(comment.id)} className="h-7 text-xs bg-primary text-white">Lưu</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 text-xs">Hủy</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                )}
                <div className="pt-2 flex items-center gap-4">
                  <button onClick={() => setReplyingTo(comment)} className="text-xs font-bold text-primary hover:underline">Trả lời</button>
                  {user && user.id === comment.author.id && (
                    <button 
                      onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }} 
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      Sửa
                    </button>
                  )}
                  {user && (user.id === comment.author.id || user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN")) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-xs font-bold text-rose-500 hover:underline">Xóa</button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
                          </AlertDialogDescription>
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
                                console.error("Lỗi xóa bình luận", err);
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

            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-12 space-y-4">
                {comment.replies.map((reply, rIdx) => (
                  <div key={rIdx} className="flex gap-4 p-3 rounded-3xl bg-slate-50/50 border border-slate-50">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={reply.author.avatarUrl || "/default-avatar.svg"} />
                      <AvatarFallback>{reply.author.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{reply.author.username}</span>
                        <span className="text-[10px] text-slate-400" title={reply.createdDate}>{timeAgo(reply.createdDate)}</span>
                      </div>
                      {editingCommentId === reply.id ? (
                        <div className="pt-2 pb-2">
                          <Input
                            value={editCommentText}
                            onChange={e => setEditCommentText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleEditSubmit(reply.id)
                              if (e.key === "Escape") setEditingCommentId(null)
                            }}
                            autoFocus
                            className="text-sm bg-white border-slate-200"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleEditSubmit(reply.id)} className="h-7 text-xs bg-primary text-white">Lưu</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 text-xs">Hủy</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 leading-relaxed">{reply.content}</p>
                      )}
                      <div className="pt-1 flex items-center gap-4">
                        <button onClick={() => setReplyingTo(comment)} className="text-xs font-bold text-primary hover:underline">Trả lời</button>
                        {user && user.id === reply.author.id && (
                          <button 
                            onClick={() => { setEditingCommentId(reply.id); setEditCommentText(reply.content); }} 
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline"
                          >
                            Sửa
                          </button>
                        )}
                        {user && (user.id === reply.author.id || user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN")) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-xs font-bold text-rose-500 hover:underline">Xóa</button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
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
                                      console.error("Lỗi xóa bình luận", err);
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
        {comments.length === 0 && (
          <p className="text-center py-10 text-slate-400 text-sm italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>

      {replyingTo && (
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <span>Đang trả lời <strong>{replyingTo.author.username}</strong></span>
          <button onClick={() => setReplyingTo(null)} className="font-bold hover:text-rose-500 transition-colors">&times; Hủy</button>
        </div>
      )}

      <div className="flex items-center gap-3 p-2 rounded-full border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src={user?.avatarUrl || "/default-avatar.svg"} />
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
        <Input
          ref={commentInputRef}
          placeholder={replyingTo ? `Trả lời ${replyingTo.author.username}...` : "Thêm bình luận của bạn..."}
          value={commentText}
          onChange={e => {
            if (!user) { showLoginToast(); return }
            setCommentText(e.target.value)
          }}
          onFocus={e => {
            if (!user) { e.target.blur(); showLoginToast() }
          }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="flex-1 border-none bg-transparent text-sm focus-visible:ring-0"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          className={cn("h-10 w-10 rounded-full transition-all shadow-md", commentText.trim() ? "bg-primary scale-100" : "bg-slate-300 scale-95")}
          disabled={!commentText.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
