import { useState } from "react"
import { Loader2, Search, Info, RotateCcw, EyeOff, Image as ImageIcon, Calendar, CheckCircle, Ban, ArrowUpRight, Eye, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { parseUTCDate } from "@/utils/date"
import { EmptyState } from "../widgets/admin-empty-state"
import type { ReportResponse } from "@/types"

interface AdminTabPostsProps {
  tabLoading: boolean
  filteredPosts: any[]
  postQuery: string
  setPostQuery: (q: string) => void
  postsPage: number
  setPostsPage: (page: number | ((p: number) => number)) => void
  postsTotalPages: number
  postsPendingMode?: boolean
  setPostsPendingMode?: (val: boolean) => void
  viewPostReports: (id: string) => void
  togglePostDeletion: (id: string, deleted: boolean) => void
  reports: ReportResponse[]
  pendingReportsCount: number
  fetchAdminData: () => Promise<void>
  handleDismiss: (id: string) => Promise<void>
  handleResolve: (id: string) => Promise<void>
  handleBanUser: (userId: string | undefined, reportId?: string) => void
  handleApprovePost?: (postId: string) => void
  handleRejectPost?: (postId: string) => void
}

export function AdminTabPosts({
  tabLoading,
  filteredPosts,
  postQuery,
  setPostQuery,
  postsPage,
  setPostsPage,
  postsTotalPages,
  postsPendingMode = false,
  setPostsPendingMode,
  viewPostReports,
  togglePostDeletion,
  reports,
  pendingReportsCount,
  fetchAdminData,
  handleDismiss,
  handleResolve,
  handleBanUser,
  handleApprovePost,
  handleRejectPost
}: AdminTabPostsProps) {
  const [previewPost, setPreviewPost] = useState<any | null>(null)

  return (
    <div className="animate-in fade-in-50 duration-200">
      {tabLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <div className="space-y-8">

          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={postsPendingMode ? "default" : "outline"}
              onClick={() => {
                if (setPostsPendingMode) {
                  setPostsPendingMode(true)
                  setPostsPage(0)
                }
              }}
              className={postsPendingMode ? "bg-amber-500 hover:bg-amber-600 shadow-sm" : ""}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Đang chờ duyệt
            </Button>
            <Button
              variant={!postsPendingMode ? "default" : "outline"}
              onClick={() => {
                if (setPostsPendingMode) {
                  setPostsPendingMode(false)
                  setPostsPage(0)
                }
              }}
            >
              Tất cả bài viết
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">{postsPendingMode ? "Bài viết Chờ Duyệt" : "Tất cả Bài viết"} ({filteredPosts.length})</h2>
                <p className="text-slate-400 text-[11px] font-bold mt-0.5">Quản lý toàn bộ nội dung được cộng đồng đăng tải. Cấp quyền ẩn hoặc khôi phục hiển thị.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bài viết, tác giả..."
                  value={postQuery}
                  onChange={(e) => setPostQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-4">Ảnh & Caption</th>
                    <th className="p-4">Tác giả</th>
                    <th className="p-4">Địa điểm</th>
                    <th className="p-4">Đánh giá</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState 
                          icon={<ImageIcon className="w-8 h-8" />} 
                          iconWrapperClass="bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100"
                          title="Không có bài viết nào" 
                          description="Không tìm thấy bài viết phù hợp. Thử từ khóa khác." 
                          compact 
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map(post => (
                      <tr key={post.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                            {post.photos && post.photos.length > 0 ? (
                              <img src={post.photos[0].imageUrl} alt="post" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-300"><ImageIcon className="h-4 w-4" /></div>
                            )}
                          </div>
                          <div className="max-w-[240px] truncate">
                            <p className="text-slate-800 font-extrabold truncate">{post.caption || "(Không có caption)"}</p>
                            <span className="text-[10px] text-slate-400 font-bold">{parseUTCDate(post.createdDate || post.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{post.user ? post.user.username : "Ẩn danh"}</td>
                        <td className="p-4 text-slate-600">{post.location ? post.location.name : "Không có"}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-bold text-amber-600 bg-amber-50 border-amber-100">
                            ★ {post.averageRating ? post.averageRating.toFixed(1) : "0.0"} ({post.totalRatings || 0})
                          </Badge>
                        </td>
                        <td className="p-4">
                          {post.deleted ? (
                            <Badge className="bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wide">Bị ẩn / Ban</Badge>
                          ) : post.status === 'PENDING_REVIEW' ? (
                            <Badge className="bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wide">Chờ duyệt</Badge>
                          ) : (
                            <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wide">Hoạt động</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {post.status === 'PENDING_REVIEW' ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-primary"
                                  onClick={() => setPreviewPost(post)}
                                  title="Xem trước nội dung"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                                  onClick={() => handleApprovePost && handleApprovePost(post.id)}
                                >
                                  Duyệt
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="h-8 px-3 shadow-sm"
                                  onClick={() => handleRejectPost && handleRejectPost(post.id)}
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-sm hover:shadow-md transition-shadow">
                                <button
                                  className={`p-2 rounded-full transition-all relative ${reports.some(r => r.postId === post.id)
                                      ? "text-red-500 hover:bg-red-50 hover:text-red-700 animate-pulse"
                                      : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                  title="Xem lịch sử tố cáo"
                                  onClick={() => viewPostReports(post.id)}
                                >
                                  {reports.some(r => r.postId === post.id) && (
                                    <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                                  )}
                                  <Info className="h-4 w-4" />
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                                <button
                                  className={`p-2 rounded-full transition-all ${post.deleted ? "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
                                  title={post.deleted ? "Khôi phục bài viết" : "Ẩn bài viết"}
                                  onClick={() => togglePostDeletion(post.id, post.deleted)}
                                >
                                  {post.deleted ? <RotateCcw className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPostsPage(p => Math.max(0, p - 1))}
                disabled={postsPage === 0}
                className="text-xs font-bold text-slate-600 bg-white"
              >
                Trang trước
              </Button>
              <span className="text-xs font-bold text-slate-500">
                Trang {postsPage + 1} / {postsTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPostsPage(p => Math.min(postsTotalPages - 1, p + 1))}
                disabled={postsPage >= postsTotalPages - 1}
                className="text-xs font-bold text-slate-600 bg-white"
              >
                Trang sau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nội dung chi tiết</DialogTitle>
            <DialogDescription>
              Xem trước bài viết chờ duyệt của <span className="font-bold text-foreground">{previewPost?.user?.username}</span>
            </DialogDescription>
          </DialogHeader>

          {previewPost && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-2 -mr-2">
                
                {/* Image Gallery */}
                {previewPost.photos && previewPost.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {previewPost.photos.map((photo: any, index: number) => (
                      <div 
                        key={index} 
                        className={`w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 ${
                          previewPost.photos.length === 1 ? 'col-span-2 aspect-video' : 'aspect-square'
                        } ${
                          previewPost.photos.length === 3 && index === 0 ? 'col-span-2 aspect-video' : ''
                        }`}
                      >
                        <img src={photo.imageUrl} alt={`Preview ${index}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-white">
                      <Calendar className="w-3 h-3 mr-1" />
                      {parseUTCDate(previewPost.createdDate).toLocaleDateString("vi-VN")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/5">
                      <MapPin className="w-3 h-3 mr-1" />
                      {previewPost.location?.name}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {previewPost.caption || <span className="italic text-slate-400">Không có nội dung...</span>}
                  </p>
                  
                  {previewPost.tags && previewPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {previewPost.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {previewPost.shootingTip && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100/50 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1 uppercase tracking-wide">Gợi ý chụp ảnh</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{previewPost.shootingTip}</p>
                    </div>
                  </div>
                )}
                
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPreviewPost(null)}>Đóng</Button>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => {
                    if (handleApprovePost) handleApprovePost(previewPost.id);
                    setPreviewPost(null);
                  }}
                >
                  Duyệt bài này
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
