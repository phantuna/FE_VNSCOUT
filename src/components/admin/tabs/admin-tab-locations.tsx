import { Loader2, Search, RotateCcw, EyeOff, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "../widgets/admin-empty-state"

interface AdminTabLocationsProps {
  tabLoading: boolean
  filteredLocations: any[]
  locationQuery: string
  setLocationQuery: (q: string) => void
  locationsPage: number
  setLocationsPage: (page: number | ((p: number) => number)) => void
  locationsTotalPages: number
  toggleLocationDeletion: (id: string, deleted: boolean) => void
}

export function AdminTabLocations({
  tabLoading,
  filteredLocations,
  locationQuery,
  setLocationQuery,
  locationsPage,
  setLocationsPage,
  locationsTotalPages,
  toggleLocationDeletion
}: AdminTabLocationsProps) {
  return (
    <div className="animate-in fade-in-50 duration-200">
      {tabLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Danh sách Địa điểm Săn ảnh ({filteredLocations.length})</h2>
              <p className="text-slate-400 text-[11px] font-bold mt-0.5">Danh sách toàn bộ các địa điểm săn ảnh cấp Quận/Huyện/Checkin (Level 2) trong hệ thống.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm địa điểm, tỉnh thành..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="p-4">Mã Code</th>
                  <th className="p-4">Tên địa điểm</th>
                  <th className="p-4">Phân nhóm</th>
                  <th className="p-4">Tọa độ</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState 
                        icon={<MapPin className="w-8 h-8" />} 
                        iconWrapperClass="bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                        title="Không tìm thấy địa điểm" 
                        description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc." 
                        compact 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map(loc => (
                    <tr key={loc.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 text-slate-400">#{loc.code}</td>
                      <td className="p-4 text-slate-800 font-extrabold">{loc.nameWithType || loc.name}</td>
                      <td className="p-4 text-slate-500">{loc.type || "Địa điểm checkin"}</td>
                      <td className="p-4 text-slate-500 font-medium">
                        {loc.latitude && loc.longitude
                          ? `${parseFloat(loc.latitude).toFixed(4)}, ${parseFloat(loc.longitude).toFixed(4)}`
                          : "Chưa setup"}
                      </td>
                      <td className="p-4">
                        {loc.deleted ? (
                          <Badge className="bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wide">Đang ẩn</Badge>
                        ) : (
                          <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wide">Xác thực</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleLocationDeletion(loc.id, loc.deleted)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all border shadow-sm hover:shadow-md ${loc.deleted
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                            }`}
                        >
                          {loc.deleted ? <RotateCcw className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {loc.deleted ? "Phê duyệt" : "Ẩn Spot"}
                        </button>
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
              onClick={() => setLocationsPage(p => Math.max(0, p - 1))}
              disabled={locationsPage === 0}
              className="text-xs font-bold text-slate-600 bg-white"
            >
              Trang trước
            </Button>
            <span className="text-xs font-bold text-slate-500">
              Trang {locationsPage + 1} / {locationsTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocationsPage(p => Math.min(locationsTotalPages - 1, p + 1))}
              disabled={locationsPage >= locationsTotalPages - 1}
              className="text-xs font-bold text-slate-600"
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
