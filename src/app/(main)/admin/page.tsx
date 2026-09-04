"use client"

import { Suspense } from "react"

import { useEffect, useState } from "react"
import { apiFetch } from "@/services/api.service"
import {
  ShieldAlert, CheckCircle, Users, Image as ImageIcon,
  AlertTriangle, TrendingUp, Server, ArrowUpRight, Search,
  MapPin, Ban, RotateCcw, Calendar, ShieldCheck, Eye, EyeOff, Info, Bot
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { AdminStatsResponse, ReportResponse } from "@/types"
import { parseUTCDate } from "@/utils/date"

import { EmptyState } from "@/components/admin/widgets/admin-empty-state"
import { AdminTabStats } from "@/components/admin/tabs/admin-tab-stats"
import { AdminTabPosts } from "@/components/admin/tabs/admin-tab-posts"
import { AdminTabUsers } from "@/components/admin/tabs/admin-tab-users"
import { AdminTabLocations } from "@/components/admin/tabs/admin-tab-locations"
import { AdminTabBannedWords } from "@/components/admin/tabs/admin-tab-banned-words"
import { AdminReportModal } from "@/components/admin/modals/admin-report-modal"
import { AdminBanModal } from "@/components/admin/modals/admin-ban-modal"

import { useSearchParams } from "next/navigation"

// Wrapper component để cô lập useSearchParams trong Suspense boundary
function AdminDashboardInner() {


  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as any
  const [activeTab, setActiveTab] = useState<"stats" | "posts" | "users" | "locations" | "bannedWords">(tabParam || "stats")

  useEffect(() => {
    if (tabParam && ["stats", "posts", "users", "locations", "bannedWords"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [reports, setReports] = useState<ReportResponse[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [bannedWords, setBannedWords] = useState<any[]>([])

  const [usersPage, setUsersPage] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(1)

  const [postsPage, setPostsPage] = useState(0)
  const [postsTotalPages, setPostsTotalPages] = useState(1)
  const [postsPendingMode, setPostsPendingMode] = useState(true)

  const [locationsPage, setLocationsPage] = useState(0)
  const [locationsTotalPages, setLocationsTotalPages] = useState(1)

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)

  const [userQuery, setUserQuery] = useState("")
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false)
  const [postQuery, setPostQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [wordQuery, setWordQuery] = useState("")

  const [selectedPostReports, setSelectedPostReports] = useState<any[] | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [reportModalLoading, setReportModalLoading] = useState(false)

  const [confirmBanUser, setConfirmBanUser] = useState<{ userId: string; reportId?: string } | null>(null)

  const { toast } = useToast()

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [statsRes, reportsRes] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/admin/reports?status=PENDING&size=20")
      ])
      setStats(statsRes)
      setReports(reportsRes?.content || [])
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu admin. Đảm bảo bạn có quyền truy cập.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "posts") {
      fetchPosts()
    } else if (activeTab === "locations") {
      fetchLocations()
    }
  }, [activeTab, usersPage, postsPage, locationsPage, postsPendingMode])

  useEffect(() => {
    if (activeTab === "bannedWords") {
      const handler = setTimeout(() => {
        fetchBannedWords(wordQuery)
      }, 500)
      return () => clearTimeout(handler)
    }
  }, [activeTab, wordQuery])

  const fetchUsers = async () => {
    try {
      setTabLoading(true)
      const res = await apiFetch(`/api/admin/users?page=${usersPage}&size=10`)
      const data = res || {}
      setAllUsers(data.content || [])
      setUsersTotalPages(data.totalPages || 1)
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy danh sách người dùng", variant: "destructive" })
    } finally {
      setTabLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setTabLoading(true)
      const pendingQuery = postsPendingMode ? "&pending=true" : ""
      const res = await apiFetch(`/api/admin/posts?page=${postsPage}&size=10${pendingQuery}`)
      const data = res || {}
      setAllPosts(data.content || [])
      setPostsTotalPages(data.totalPages || 1)
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy danh sách bài viết", variant: "destructive" })
    } finally {
      setTabLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      setTabLoading(true)
      const res = await apiFetch(`/api/admin/locations?page=${locationsPage}&size=10`)
      const data = res || {}
      setAllLocations(data.content || [])
      setLocationsTotalPages(data.totalPages || 1)
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy danh sách địa điểm", variant: "destructive" })
    } finally {
      setTabLoading(false)
    }
  }

  const fetchBannedWords = async (query: string = "") => {
    if (!query.trim()) {
      setBannedWords([])
      return
    }
    try {
      setTabLoading(true)
      const res = await apiFetch(`/api/v1/admin/banned-words?keyword=${encodeURIComponent(query)}&size=50`)
      const data = res || {}
      setBannedWords(data.content || [])
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy danh sách từ cấm", variant: "destructive" })
    } finally {
      setTabLoading(false)
    }
  }

  const handleResolve = async (reportId: string) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}/resolve`, { method: "PUT" })
      toast({ title: "Thành công", description: "Đã xử lý vi phạm. Bài viết bị ẩn và tác giả bị trừ điểm." })
      setReports(reports.filter(r => r.id !== reportId))
      setStats(prev => prev ? { ...prev, pendingReports: prev.pendingReports - 1 } : null)
      // refresh posts if loaded
      if (allPosts.length > 0) fetchPosts()
    } catch (e) {
      toast({ title: "Lỗi", description: "Xử lý thất bại", variant: "destructive" })
    }
  }

  const handleDismiss = async (reportId: string) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}/dismiss`, { method: "PUT" })
      toast({ title: "Thành công", description: "Đã bỏ qua báo cáo này." })
      setReports(reports.filter(r => r.id !== reportId))
      setStats(prev => prev ? { ...prev, pendingReports: prev.pendingReports - 1 } : null)
    } catch (e) {
      toast({ title: "Lỗi", description: "Thao tác thất bại", variant: "destructive" })
    }
  }

  const handleBanUser = async (userId: string | undefined, reportId?: string) => {
    if (!userId) {
      toast({ title: "Lỗi", description: "Không tìm thấy ID người dùng để khóa.", variant: "destructive" })
      return
    }
    setConfirmBanUser({ userId, reportId })
  }

  const confirmBanExecution = async () => {
    if (!confirmBanUser) return
    const { userId, reportId } = confirmBanUser
    setConfirmBanUser(null)
    try {
      await apiFetch(`/api/admin/users/${userId}/ban`, { method: "PUT" })
      toast({ title: "Đã Khóa", description: "Tài khoản người dùng đã bị khóa thành công." })
      if (reportId) {
        await handleResolve(reportId)
      }
      fetchUsers()
    } catch (e) {
      toast({ title: "Lỗi", description: "Khóa tài khoản thất bại", variant: "destructive" })
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/unban`, { method: "PUT" })
      toast({ title: "Đã Mở Khóa", description: "Tài khoản người dùng đã được mở khóa thành công." })
      fetchUsers()
    } catch (e) {
      toast({ title: "Lỗi", description: "Mở khóa tài khoản thất bại", variant: "destructive" })
    }
  }

  const handleUpdateRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/role?isAdmin=${!currentIsAdmin}`, { method: "PUT" })
      toast({ title: "Thành công", description: !currentIsAdmin ? "Đã cấp quyền Admin." : "Đã hủy quyền Admin." })
      fetchUsers()
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message || "Cập nhật quyền thất bại", variant: "destructive" })
    }
  }

  const togglePostDeletion = async (postId: string, currentDeleted: boolean) => {
    const targetStatus = currentDeleted ? 0 : 1
    try {
      await apiFetch(`/api/admin/posts/${postId}/status?deleted=${targetStatus}`, { method: "PUT" })
      toast({ title: "Thành công", description: currentDeleted ? "Đã khôi phục bài viết." : "Đã ẩn bài viết." })
      fetchPosts()
    } catch (e) {
      toast({ title: "Lỗi", description: "Cập nhật trạng thái bài viết thất bại", variant: "destructive" })
    }
  }

  const handleApprovePost = async (postId: string) => {
    try {
      await apiFetch(`/api/admin/posts/${postId}/approve`, { method: "PUT" })
      toast({ title: "Thành công", description: "Đã duyệt bài viết." })
      fetchPosts()
    } catch (e) {
      toast({ title: "Lỗi", description: "Duyệt bài viết thất bại", variant: "destructive" })
    }
  }

  const handleRejectPost = async (postId: string) => {
    try {
      await apiFetch(`/api/admin/posts/${postId}/reject`, { method: "PUT" })
      toast({ title: "Thành công", description: "Đã từ chối và ẩn bài viết." })
      fetchPosts()
    } catch (e) {
      toast({ title: "Lỗi", description: "Từ chối bài viết thất bại", variant: "destructive" })
    }
  }

  const toggleLocationDeletion = async (locationId: string, currentDeleted: boolean) => {
    const targetStatus = currentDeleted ? 0 : 1
    try {
      await apiFetch(`/api/admin/locations/${locationId}/status?deleted=${targetStatus}`, { method: "PUT" })
      toast({ title: "Thành công", description: currentDeleted ? "Đã duyệt/khôi phục địa điểm." : "Đã ẩn địa điểm." })
      fetchLocations()
    } catch (e) {
      toast({ title: "Lỗi", description: "Cập nhật địa điểm thất bại", variant: "destructive" })
    }
  }

  const viewPostReports = async (postId: string) => {
    try {
      setReportModalLoading(true)
      setSelectedPostId(postId)
      const res = await apiFetch(`/api/admin/posts/${postId}/reports`)
      setSelectedPostReports(res || [])
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy lịch sử tố cáo bài viết này.", variant: "destructive" })
    } finally {
      setReportModalLoading(false)
    }
  }

  const handleAddWord = async (word: string, type: string, language: string) => {
    try {
      const formData = new URLSearchParams()
      formData.append("word", word)
      formData.append("type", type)
      formData.append("language", language)

      await apiFetch(`/api/v1/admin/banned-words`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      })
      toast({ title: "Thành công", description: "Đã thêm từ cấm mới." })
      if (wordQuery && word.toLowerCase().includes(wordQuery.toLowerCase())) {
        fetchBannedWords(wordQuery)
      }
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.data?.message || e.message || "Thêm từ cấm thất bại", variant: "destructive" })
    }
  }

  const handleDeleteWord = async (id: string) => {
    try {
      await apiFetch(`/api/v1/admin/banned-words/${id}`, { method: "DELETE" })
      toast({ title: "Thành công", description: "Đã xóa từ cấm." })
      fetchBannedWords(wordQuery)
    } catch (e) {
      toast({ title: "Lỗi", description: "Xóa từ cấm thất bại", variant: "destructive" })
    }
  }


  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase());
    if (showOnlyAdmins && !u.roles?.includes("ADMIN")) return false;
    return matchesSearch;
  })

  const filteredPosts = allPosts.filter(p =>
    (p.caption && p.caption.toLowerCase().includes(postQuery.toLowerCase())) ||
    (p.user && p.user.username.toLowerCase().includes(postQuery.toLowerCase()))
  )

  const filteredLocations = allLocations.filter(loc =>
    loc.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
    (loc.nameWithType && loc.nameWithType.toLowerCase().includes(locationQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-24 min-h-screen bg-slate-950/20 backdrop-blur-md">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-sm font-bold text-slate-400 mt-4">Đang tải dữ liệu quản trị tối cao...</p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900">
                <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                Trung tâm Quản trị
              </h1>
              <p className="text-slate-500 text-sm font-medium pl-14">
                Hệ thống phân tích, thống kê & kiểm duyệt chuyên sâu dành cho Ban Quản Trị.
              </p>
            </div>
          </div>



          {activeTab === "stats" && (
            <AdminTabStats
              stats={stats}
            />
          )}

          {activeTab === "posts" && (
            <AdminTabPosts
              tabLoading={tabLoading}
              filteredPosts={filteredPosts}
              postQuery={postQuery}
              setPostQuery={setPostQuery}
              postsPage={postsPage}
              setPostsPage={setPostsPage}
              postsTotalPages={postsTotalPages}
              postsPendingMode={postsPendingMode}
              setPostsPendingMode={setPostsPendingMode}
              viewPostReports={viewPostReports}
              togglePostDeletion={togglePostDeletion}
              reports={reports}
              pendingReportsCount={stats?.pendingReports || 0}
              fetchAdminData={fetchAdminData}
              handleDismiss={handleDismiss}
              handleResolve={handleResolve}
              handleBanUser={handleBanUser}
              handleApprovePost={handleApprovePost}
              handleRejectPost={handleRejectPost}
            />
          )}

          {activeTab === "users" && (
            <AdminTabUsers
              tabLoading={tabLoading}
              filteredUsers={filteredUsers}
              allUsers={allUsers}
              userQuery={userQuery}
              setUserQuery={setUserQuery}
              showOnlyAdmins={showOnlyAdmins}
              setShowOnlyAdmins={setShowOnlyAdmins}
              usersPage={usersPage}
              setUsersPage={setUsersPage}
              usersTotalPages={usersTotalPages}
              handleUnbanUser={handleUnbanUser}
              handleBanUser={handleBanUser}
              handleUpdateRole={handleUpdateRole}
            />
          )}

          {activeTab === "locations" && (
            <AdminTabLocations
              tabLoading={tabLoading}
              filteredLocations={filteredLocations}
              locationQuery={locationQuery}
              setLocationQuery={setLocationQuery}
              locationsPage={locationsPage}
              setLocationsPage={setLocationsPage}
              locationsTotalPages={locationsTotalPages}
              toggleLocationDeletion={toggleLocationDeletion}
            />
          )}

          {activeTab === "bannedWords" && (
            <AdminTabBannedWords
              tabLoading={tabLoading}
              bannedWords={bannedWords}
              wordQuery={wordQuery}
              setWordQuery={setWordQuery}
              handleAddWord={handleAddWord}
              handleDeleteWord={handleDeleteWord}
            />
          )}

          <AdminReportModal
            selectedPostId={selectedPostId}
            setSelectedPostId={setSelectedPostId}
            reportModalLoading={reportModalLoading}
            selectedPostReports={selectedPostReports}
            setSelectedPostReports={setSelectedPostReports}
            handleDismiss={handleDismiss}
            handleResolve={handleResolve}
            handleBanUser={handleBanUser}
          />

          <AdminBanModal
            confirmBanUser={confirmBanUser}
            setConfirmBanUser={setConfirmBanUser}
            confirmBanExecution={confirmBanExecution}
          />
        </div>
      </div>
    </>
  )
}

// Page mặc định: bọc toàn bộ dashboard trong Suspense để fix lỗi build
export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center p-24 min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-sm font-bold text-slate-400 mt-4">Đang tải...</p>
      </div>
    }>
      <AdminDashboardInner />
    </Suspense>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
