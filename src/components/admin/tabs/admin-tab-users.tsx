import { Loader2, Search, RotateCcw, Ban, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "../widgets/admin-empty-state"
import { UserReputationCenter } from "../widgets/admin-reputation"

interface AdminTabUsersProps {
  tabLoading: boolean
  filteredUsers: any[]
  allUsers: any[]
  userQuery: string
  setUserQuery: (q: string) => void
  showOnlyAdmins: boolean
  setShowOnlyAdmins: (v: boolean) => void
  usersPage: number
  setUsersPage: (page: number | ((p: number) => number)) => void
  usersTotalPages: number
  handleUnbanUser: (id: string) => void
  handleBanUser: (id: string) => void
  handleUpdateRole: (id: string, currentIsAdmin: boolean) => void
}

export function AdminTabUsers({
  tabLoading,
  filteredUsers,
  allUsers,
  userQuery,
  setUserQuery,
  showOnlyAdmins,
  setShowOnlyAdmins,
  usersPage,
  setUsersPage,
  usersTotalPages,
  handleUnbanUser,
  handleBanUser,
  handleUpdateRole
}: AdminTabUsersProps) {
  return (
    <>
      <div className="animate-in fade-in-50 duration-200">
        {tabLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Danh sách Thành viên ({filteredUsers.length})</h2>
                <p className="text-slate-400 text-[11px] font-bold mt-0.5">Quản lý toàn bộ tài khoản người dùng trên hệ thống, phân quyền và xử lý vi phạm.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant={showOnlyAdmins ? "default" : "outline"}
                  onClick={() => setShowOnlyAdmins(!showOnlyAdmins)}
                  size="sm"
                  className={showOnlyAdmins ? "bg-orange-500 hover:bg-orange-600" : "bg-white"}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Chỉ hiện Admin
                </Button>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm thành viên, email..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-4">Ảnh & Thành viên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Điểm uy tín</th>
                    <th className="p-4">Cấp độ (Level)</th>
                    <th className="p-4">Vai trò (Role)</th>
                    <th className="p-4">Trạng thái tài khoản</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState 
                          icon={<Users className="w-8 h-8" />} 
                          iconWrapperClass="bg-purple-50 text-purple-600 shadow-sm border border-purple-100"
                          title="Chưa có thành viên nào" 
                          description="Danh sách sẽ hiển thị khi có tài khoản đăng ký." 
                          compact 
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-black">{user.username.slice(0, 2).toUpperCase()}</div>
                            )}
                          </div>
                          <span className="text-slate-800 font-extrabold">{user.username}</span>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">{user.email}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-bold text-blue-600 bg-blue-50 border-blue-100">
                            {user.reputationScore} RP
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-bold text-slate-700 bg-slate-100">
                            Level {user.level || 1}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {user.roles?.includes("ADMIN") ? (
                            <Badge className="bg-purple-100 text-purple-700 font-bold border border-purple-200">Admin</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">User</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          {user.deleted ? (
                            <Badge className="bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wide">Đang bị khóa</Badge>
                          ) : (
                            <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wide">Bình thường</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {user.roles?.includes("ADMIN") ? (
                            <span className="text-[10px] italic text-slate-400 select-none">
                              Tài khoản Quản trị (Bảo vệ)
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateRole(user.id, false)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all border shadow-sm hover:shadow-md bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Cấp Admin
                              </button>
                              <button
                                onClick={() => user.deleted ? handleUnbanUser(user.id) : handleBanUser(user.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all border shadow-sm hover:shadow-md ${user.deleted
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                  }`}
                              >
                                {user.deleted ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                {user.deleted ? "Mở khóa" : "Khóa"}
                              </button>
                            </div>
                          )}
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
                onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                disabled={usersPage === 0}
                className="text-xs font-bold text-slate-600 bg-white"
              >
                Trang trước
              </Button>
              <span className="text-xs font-bold text-slate-500">
                Trang {usersPage + 1} / {usersTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUsersPage(p => Math.min(usersTotalPages - 1, p + 1))}
                disabled={usersPage >= usersTotalPages - 1}
                className="text-xs font-bold text-slate-600 bg-white"
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {!tabLoading && allUsers.length > 0 && (
        <div className="mt-6 animate-in fade-in-50 duration-200">
          <UserReputationCenter users={allUsers} />
        </div>
      )}
    </>
  )
}
