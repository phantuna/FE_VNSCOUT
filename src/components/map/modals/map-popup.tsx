"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  MapPin, Camera, Navigation, Sun, Share2, TrendingUp, Info,
  Heart, ChevronRight, ChevronLeft, X, Loader2, Sunrise, Sunset, Hotel, Building2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Location, type Post } from "@/types"
import { calculateSolarTimes } from "@/lib/solar-calculator"

interface LocationWithStats extends Location {
  postCount?: number
  checkInCount?: number
  coverPhoto?: string
}

interface StatItem { name: string; count: number; percentage: number }

interface MapLocationPopupProps {
  location: LocationWithStats
  locationPosts: Post[]
  loadingPosts: boolean
  cameraStats: StatItem[]
  lensStats: StatItem[]
  recommendedSettings: { avgIso: number | null; avgAperture: string | null; topShutter: string | null; hasData: boolean } | null
  onClose: () => void
  onGetDirections: (loc: LocationWithStats) => void
  onShare: (loc: LocationWithStats) => void
  onViewFeed: (loc: LocationWithStats) => void
}

export function MapLocationPopup({
  location, locationPosts, loadingPosts, cameraStats, lensStats, recommendedSettings,
  onClose, onGetDirections, onShare, onViewFeed,
}: MapLocationPopupProps) {
  const solarTimes = useMemo(() => {
    if (!location.latitude || !location.longitude) return null
    return calculateSolarTimes(Number(location.latitude), Number(location.longitude))
  }, [location.latitude, location.longitude])

  return (
    <div className="flex h-full w-full flex-col bg-card overflow-hidden transition-all duration-300 animate-in slide-in-from-right-4">
      {/* Banner */}
      <div className="relative h-44 shrink-0 bg-muted">
        <Image src={location.coverPhoto || "/placeholder.svg"} alt={location.name} fill className="object-cover" sizes="400px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
        <button
          onClick={onClose}
          className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1 rounded-xl bg-card/85 px-3 py-1.5 text-xs font-bold text-foreground backdrop-blur-md border border-border transition-all hover:bg-card shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </button>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`border-none text-[9px] font-extrabold px-2 py-0.5 ${
              location.locationType === "SERVICE"
                ? "bg-amber-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}>
              {location.locationType === "SERVICE" ? (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Dịch vụ
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Camera className="h-3 w-3" /> {location.category || "Địa danh"}
                </span>
              )}
            </Badge>
            {(!location.locationType || location.locationType === "SPOT") && solarTimes && (
              <Badge className="bg-orange-500/10 text-orange-600 border border-orange-500/30 text-[9px] font-bold px-2 py-0.5 flex items-center gap-1">
                <Sun className="h-2.5 w-2.5" /> Giờ vàng: {solarTimes.sunset}
              </Badge>
            )}
          </div>
          <h2 className="mt-1.5 text-base font-extrabold text-foreground leading-tight drop-shadow-sm">{location.name}</h2>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent">

        {/* Mô tả */}
        <div className="space-y-2 bg-muted/30 border border-border p-3 rounded-xl">
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            "{location.description || "Nơi hội tụ những góc chụp nghệ thuật tuyệt đỉnh, được đề xuất bởi cộng đồng săn ảnh Vietnam Photo Scout."}"
          </p>
          <div className="h-px bg-border" />
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground leading-normal text-[11px]">{location.address || location.nameWithType}</span>
          </div>
        </div>

        {/* Astronomical Solar Clock Widget */}
        {(!location.locationType || location.locationType === "SPOT") && solarTimes && (
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent p-3.5 backdrop-blur-md">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
              <Sun className="h-3.5 w-3.5 text-orange-500 animate-pulse" /> Chu kỳ mặt trời hôm nay
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-card/60 p-2 border border-border/40">
                <Sunrise className="h-5 w-5 text-amber-500" />
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Bình minh</span>
                  <span className="text-xs font-black text-foreground">{solarTimes.sunrise} SA</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-card/60 p-2 border border-border/40">
                <Sunset className="h-5 w-5 text-orange-500" />
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Hoàng hôn</span>
                  <span className="text-xs font-black text-foreground">{solarTimes.sunset} CH</span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5 justify-center py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <Camera className="h-3.5 w-3.5 text-amber-600" />
              <span>Giờ vàng: <strong>{solarTimes.goldenHourMorning}</strong> & <strong>{solarTimes.goldenHourEvening}</strong></span>
            </div>
          </div>
        )}

        {/* Tác vụ nhanh */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onGetDirections(location)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border transition-all text-center gap-1.5">
            <Navigation className="h-4 w-4 text-cyan-500 rotate-45" />
            <span className="text-[10px] font-bold text-foreground">Dẫn đường</span>
          </button>
          <button onClick={() => onShare(location)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 hover:bg-muted border border-border transition-all text-center gap-1.5">
            <Share2 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-foreground">Chia sẻ spot</span>
          </button>
          <button onClick={() => onViewFeed(location)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary hover:bg-primary/95 transition-all text-center gap-1.5 text-primary-foreground">
            <Camera className="h-4 w-4" />
            <span className="text-[10px] font-black">Xem bài viết</span>
          </button>
        </div>

        {/* Analytics / Service Info */}
        {location.locationType === "SERVICE" ? (
          <div className="space-y-3 bg-muted/30 border border-border p-3 rounded-xl">
            <h4 className="text-xs font-black text-muted-foreground flex items-center gap-1.5 border-l-2 border-amber-500 pl-2">
              <Hotel className="h-3.5 w-3.5" /> THÔNG TIN DỊCH VỤ
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Đây là địa điểm dịch vụ. Xem bài viết bên dưới để đọc review từ cộng đồng.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-muted-foreground flex items-center gap-1.5 border-l-2 border-primary pl-2">
              <TrendingUp className="h-4 w-4 text-primary" /> PHÂN TÍCH NHIẾP ẢNH (EXIF)
            </h4>
          {locationPosts.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <Info className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-[10px] text-muted-foreground leading-normal">
                Địa điểm này chưa có ảnh đăng tải. Hãy đăng bức ảnh đầu tiên kèm Exif để mở khóa thống kê!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {cameraStats.length > 0 && (
                <div className="space-y-2 bg-muted/20 border border-border p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Body máy ảnh phổ biến:</span>
                  <div className="space-y-1.5 mt-1">
                    {cameraStats.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground truncate pr-2">{item.name}</span>
                          <span className="font-extrabold text-primary shrink-0">{item.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {lensStats.length > 0 && (
                <div className="space-y-2 bg-muted/20 border border-border p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ống kính (Lens) được yêu thích:</span>
                  <div className="space-y-1.5 mt-1">
                    {lensStats.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground truncate pr-2">{item.name}</span>
                          <span className="font-extrabold text-cyan-600 shrink-0">{item.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recommendedSettings?.hasData && (
                <div className="grid grid-cols-3 gap-2 bg-muted/30 border border-border p-2.5 rounded-xl">
                  {[
                    { label: "ISO tối ưu", val: recommendedSettings.avgIso ? `~${recommendedSettings.avgIso}` : "N/A" },
                    { label: "Khẩu độ", val: recommendedSettings.avgAperture ? `f/${recommendedSettings.avgAperture}` : "N/A" },
                    { label: "Tốc độ chụp", val: recommendedSettings.topShutter || "N/A" },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center p-1.5 rounded-lg bg-card border border-border">
                      <span className="text-[9px] font-bold text-muted-foreground block uppercase">{label}</span>
                      <span className="text-xs font-black text-foreground block mt-1 truncate px-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {/* Ảnh gần đây */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-muted-foreground flex items-center gap-1.5 border-l-2 border-primary pl-2">
              <Camera className="h-4 w-4 text-primary" /> BỨC ẢNH ĐẸP GẦN ĐÂY
            </h4>
            {locationPosts.length > 3 && (
              <Link href={`/explore?location=${location.id}`} className="flex items-center gap-0.5 text-[10px] font-extrabold text-primary hover:underline uppercase">
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {loadingPosts ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : locationPosts.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/20 py-8 text-center text-[10px] text-muted-foreground font-medium">
              Chưa có hình ảnh nào được tải lên tại đây.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {locationPosts.slice(0, 6).map((post) => {
                const thumb = post.photos?.[0]?.imageUrl
                return (
                  <Link key={post.id} href={`/post/${post.id}`} className="group relative aspect-square shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={thumb || "/placeholder.svg"} alt={`Ảnh chụp tại ${location.name}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="110px" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <span className="flex items-center gap-0.5 text-[9px] font-black text-white">
                        <Heart className="h-3 w-3 fill-red-500 stroke-red-500" /> {post.likeCount}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Thanh Thao Tác Nhanh 1-Chạm (Quick Action Bar) */}
      <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md shrink-0 flex items-center gap-2">
        <Button
          onClick={() => onGetDirections(location)}
          size="sm"
          className="flex-1 h-9 rounded-xl gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
        >
          <Navigation className="h-3.5 w-3.5" /> Chỉ đường
        </Button>
        <Link
          href={`/create?locationId=${location.id}`}
          className="inline-flex items-center justify-center h-9 px-3 rounded-xl gap-1 text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <Camera className="h-3.5 w-3.5" /> Đăng ảnh
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onShare(location)}
          className="h-9 w-9 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          title="Sao chép liên kết"
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onViewFeed(location)}
          className="h-9 w-9 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          title="Xem trang chi tiết"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
