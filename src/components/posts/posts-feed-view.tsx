"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, MapPin, Sun, X, Camera, Loader2, Clock, Users, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/services/api.service"
import { removeVietnameseTones } from "@/lib/vietnamese"
import { calculateSolarTimes } from "@/lib/solar-calculator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LocationItem {
  id: string
  name: string
  level: number
  code?: string
  category?: string
  coverPhoto?: string
  postCount?: number
  checkInCount?: number
  goldenHour?: string
  province?: string
  parent?: LocationItem
  latitude?: number | string
  longitude?: number | string
  locationType?: "SPOT" | "SERVICE"
}

const CATEGORY_COLORS: Record<string, string> = {
  Lake: "bg-blue-100 text-blue-700",
  Landmark: "bg-purple-100 text-purple-700",
  Nature: "bg-green-100 text-green-700",
  Heritage: "bg-amber-100 text-amber-700",
  Mountain: "bg-slate-100 text-slate-700",
  Beach: "bg-cyan-100 text-cyan-700",
  City: "bg-orange-100 text-orange-700",
  Bridge: "bg-pink-100 text-pink-700",
  Temple: "bg-yellow-100 text-yellow-700",
}



export function PostsFeedView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<"SPOT" | "SERVICE">("SPOT")
  const [visibleLocationsCount, setVisibleLocationsCount] = useState(20)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allPosts, setAllPosts] = useState<any[]>([])
  
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Tải danh sách địa điểm (level 2)
  useEffect(() => {
    // Phục hồi dữ liệu từ cache sau khi mount để tránh lỗi Hydration Mismatch
    const saved = sessionStorage.getItem("home_locations")
    if (saved) {
      try {
        setLocations(JSON.parse(saved))
        setLoading(false)
      } catch (e) {
        console.error("Failed to parse cached locations:", e)
      }
    }

    async function fetchLocations() {
      try {
        setError(null)
        const data = await apiFetch("/api/locations?size=20&page=0&level=2")
        const arr = data?.content || data || []
        setLocations(arr)
        sessionStorage.setItem("home_locations", JSON.stringify(arr))
        if (arr.length < 20) setHasMore(false)
      } catch (err: any) {
        console.error("Failed to fetch locations:", err)
        setError("Không thể tải địa điểm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()

    async function fetchRecentPostsForImages() {
      try {
        // Lấy 200 bài viết gần nhất để làm ảnh bìa cho địa điểm
        const res = await apiFetch("/api/v1/posts/getAll?size=200")
        setAllPosts(res?.content || res || [])
      } catch (e) {
        console.error("Failed to fetch recent posts:", e)
      }
    }
    fetchRecentPostsForImages()
  }, [])

  const fetchMoreLocations = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const data = await apiFetch(`/api/locations?size=20&page=${nextPage}&level=2`)
      const newLocs = data?.content || data || []
      
      if (newLocs.length < 20) {
        setHasMore(false)
      }
      
      if (newLocs.length > 0) {
        setLocations(prev => {
          const combined = [...prev, ...newLocs]
          // Filter duplicates
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          sessionStorage.setItem("home_locations", JSON.stringify(unique))
          return unique
        })
        setPage(nextPage)
      }
    } catch (err) {
      console.error("Lỗi khi load thêm địa điểm:", err)
    } finally {
      setLoadingMore(false)
    }
  }



  // Đóng bảng gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Lưu và khôi phục vị trí cuộn
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem("home_scroll", window.scrollY.toString());
      }, 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (locations.length > 0 && !loading) {
      const savedScroll = sessionStorage.getItem("home_scroll");
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" });
        }, 100);
      }
    }
  }, [locations.length, loading]);

  // Lấy tên tỉnh từ chuỗi cha
  function getProvince(loc: LocationItem): string {
    if (loc.province) return loc.province
    let cur = loc.parent
    while (cur) {
      if (cur.level === 0) return cur.name
      cur = cur.parent
    }
    return ""
  }

  // Lấy tên quận/huyện
  function getDistrict(loc: LocationItem): string {
    let cur = loc.parent
    while (cur) {
      if (cur.level === 1) return cur.name
      cur = cur.parent
    }
    return ""
  }

  // Tính toán ảnh bìa từ các bài viết gần đây
  const locationsWithRealStats = useMemo(() => {
    return locations.map((loc) => {
      // Tìm các bài viết thuộc địa điểm này
      const locPosts = allPosts.filter((p: any) => p.location?.id === loc.id)
      // Lấy ảnh bìa từ bài viết có nhiều like nhất
      const best = locPosts.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0))[0]
      const dynamicCover = best?.photos?.[0]?.imageUrl || best?.images?.[0]
      
      return {
        ...loc,
        postCount: locPosts.length > 0 ? locPosts.length : (loc.postCount || 0),
        checkInCount: locPosts.length > 0 ? locPosts.length : (loc.checkInCount || 0),
        coverPhoto: dynamicCover || loc.coverPhoto,
      }
    })
  }, [locations, allPosts])

  // Lấy danh sách tỉnh unique
  const provinces = useMemo(() => {
    return Array.from(
      new Set(locationsWithRealStats.map(getProvince).filter(Boolean))
    ).sort()
  }, [locationsWithRealStats])

  // Gợi ý Autocomplete thông minh trong bộ nhớ khi gõ chữ (Không dấu & Chữ thường)
  const suggestions = useMemo(() => {
    const q = removeVietnameseTones(searchQuery)
    if (!q) return { spots: [], categories: [], provinces: [] }

    // Tìm góc chụp/dịch vụ khớp tên hoặc tỉnh
    const matchedSpots = locationsWithRealStats
      .filter((loc) => {
        const lType = loc.locationType || "SPOT"
        if (lType !== activeLayer) return false
        const nameNorm = removeVietnameseTones(loc.name)
        const provNorm = removeVietnameseTones(getProvince(loc))
        return nameNorm.includes(q) || provNorm.includes(q)
      })
      .slice(0, 5)

    // Tìm thể loại khớp
    const categories = Array.from(
      new Set(locationsWithRealStats.map((loc) => loc.category).filter(Boolean))
    ) as string[]
    const matchedCategories = categories
      .filter((cat) => removeVietnameseTones(cat).includes(q))
      .slice(0, 3)

    // Tìm tỉnh thành khớp
    const matchedProvinces = provinces
      .filter((prov) => removeVietnameseTones(prov).includes(q))
      .slice(0, 3)

    return {
      spots: matchedSpots,
      categories: matchedCategories,
      provinces: matchedProvinces,
    }
  }, [searchQuery, locationsWithRealStats, provinces, activeLayer])

  // Lọc danh sách góc chụp hiển thị trong Grid chính (Không dấu & Chữ thường)
  const filtered = useMemo(() => {
    return locationsWithRealStats.filter((loc) => {
      // 1. Filter by Layer (SPOT vs SERVICE)
      const lType = loc.locationType || "SPOT"
      if (lType !== activeLayer) return false

      const prov = getProvince(loc)
      const matchProvince = !selectedProvince || prov === selectedProvince
      const q = removeVietnameseTones(searchQuery)
      if (!q) return matchProvince

      const nameNorm = removeVietnameseTones(loc.name)
      const provNorm = removeVietnameseTones(prov)
      const catNorm = loc.category ? removeVietnameseTones(loc.category) : ""

      return (
        matchProvince &&
        (nameNorm.includes(q) || provNorm.includes(q) || catNorm.includes(q))
      )
    })
  }, [locationsWithRealStats, selectedProvince, searchQuery, activeLayer])

  // Sắp xếp các góc chụp nổi bật (theo số bài viết thật trong DB giảm dần)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0))
  }, [filtered])

  const hasFilter = !!(searchQuery || selectedProvince)

  const showSuggestionsDropdown = showSuggestions && searchQuery.trim() !== ""

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md pt-4 md:pt-8">
        <div className="px-4 md:px-8">
          <h1 className="text-3xl font-bold text-foreground">Điểm Đến Nổi Bật</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm các địa điểm hot và cộng đồng tại mỗi nơi
          </p>

          {/* Search + Province Filter */}
          <div className="mt-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {/* Search Container with Autocomplete Suggestions */}
            <div ref={containerRef} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                ref={searchRef}
                placeholder="Tìm kiếm địa điểm, danh mục..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="h-12 rounded-full border-2 border-border bg-background pl-12 pr-10 text-sm font-medium transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 hover:border-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setShowSuggestions(false)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Xoá tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Autocomplete Dropdown Panel */}
              {showSuggestionsDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2.5 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-3.5 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.spots.length === 0 &&
                  suggestions.categories.length === 0 &&
                  suggestions.provinces.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                      Không tìm thấy kết quả phù hợp cho "{searchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Spots matches */}
                      {suggestions.spots.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                            {activeLayer === "SPOT" ? "Góc chụp" : "Dịch vụ"} phù hợp ({suggestions.spots.length})
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {suggestions.spots.map((spot) => (
                              <Link
                                key={spot.id}
                                href={`/location/${spot.id}`}
                                onClick={() => setShowSuggestions(false)}
                                className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent/40 transition-colors"
                              >
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
                                  {spot.coverPhoto ? (
                                    <Image
                                      src={spot.coverPhoto}
                                      alt={spot.name}
                                      fill
                                      className="object-cover"
                                      sizes="40px"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center bg-primary/10">
                                      <Camera className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-foreground truncate">
                                    {spot.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {spot.category} • {getProvince(spot)}
                                  </div>
                                </div>
                                {spot.postCount !== undefined && spot.postCount > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary text-[9px] font-extrabold shrink-0 border-none px-2 py-0.5"
                                  >
                                    {spot.postCount} ảnh
                                  </Badge>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categories matches */}
                      {suggestions.categories.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                            Thể loại phù hợp
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 px-2">
                            {suggestions.categories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => {
                                  setSearchQuery(cat)
                                  setShowSuggestions(false)
                                }}
                                className="rounded-full bg-muted border border-border px-3 py-1 text-[10px] font-extrabold text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Provinces matches */}
                      {suggestions.provinces.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                            Khu vực phù hợp
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 px-2">
                            {suggestions.provinces.map((prov) => (
                              <button
                                key={prov}
                                onClick={() => {
                                  setSelectedProvince(prov)
                                  setSearchQuery("")
                                  setShowSuggestions(false)
                                }}
                                className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-[10px] font-extrabold hover:bg-primary hover:text-primary-foreground transition-all"
                              >
                                {prov}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Province dropdown */}
            <div className="relative shrink-0 min-w-[180px]">
              <Select value={selectedProvince || "all"} onValueChange={(v) => setSelectedProvince(v === "all" ? "" : v)}>
                <SelectTrigger className="h-12 w-full rounded-full border-2 border-border bg-background px-5 text-sm font-semibold text-foreground hover:border-primary/50 focus:ring-0 focus:border-primary shadow-none transition-all data-[state=open]:border-primary [&>svg]:hidden">
                  <div className="flex w-full items-center justify-between gap-3">
                    <SelectValue placeholder="Tất cả Tỉnh" />
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="rounded-2xl border-border bg-card/95 backdrop-blur-md shadow-xl max-h-80">
                  <SelectItem value="all" className="cursor-pointer font-semibold text-sm focus:bg-primary/10 focus:text-primary transition-colors my-0.5 rounded-lg">
                    Tất cả Tỉnh
                  </SelectItem>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p} className="cursor-pointer font-semibold text-sm focus:bg-primary/10 focus:text-primary transition-colors my-0.5 rounded-lg">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear button */}
            {hasFilter && (
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedProvince("")
                  setShowSuggestions(false)
                }}
                className="h-12 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Xoá Bộ Lọc
              </Button>
            )}
          </div>
        </div>
        {/* Underlined Tabs */}
        <div className="flex px-4 md:px-8 w-full">
          <button
            onClick={() => setActiveLayer("SPOT")}
            className={`flex-1 flex items-center justify-center gap-2 pb-3.5 text-sm font-bold border-b-[3px] transition-all duration-300 ${
              activeLayer === "SPOT" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Camera className="h-4 w-4" />
            Điểm Chụp
          </button>
          <button
            onClick={() => setActiveLayer("SERVICE")}
            className={`flex-1 flex items-center justify-center gap-2 pb-3.5 text-sm font-bold border-b-[3px] transition-all duration-300 ${
              activeLayer === "SERVICE" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Dịch Vụ
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 md:px-8 py-4 md:py-8">
        {/* Loading */}
        {loading && (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải địa điểm...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
              }}
              className="mt-4 text-xs text-primary hover:underline font-bold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {sorted.length > 0 ? (
              <>
                <h2 className="mb-6 text-2xl font-bold text-foreground">Địa Điểm Nổi Bật</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sorted.slice(0, visibleLocationsCount).map((loc) => {
                    const province = getProvince(loc)
                    const district = getDistrict(loc)
                    const catColor = CATEGORY_COLORS[loc.category ?? ""] ?? "bg-orange-100 text-orange-700"

                    const solarTimes = loc.latitude && loc.longitude
                      ? calculateSolarTimes(Number(loc.latitude), Number(loc.longitude))
                      : null

                    const currentHour = new Date().getHours()
                    const displaySunrise = currentHour < 12
                    const solarIcon = displaySunrise ? "🌅" : "🌇"
                    const solarText = solarTimes
                      ? (displaySunrise ? solarTimes.sunrise : solarTimes.sunset)
                      : "—"
                      
                    const isService = loc.locationType === "SERVICE"

                    return (
                      <Link
                        key={loc.id}
                        href={`/location/${loc.id}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
                      >
                        {/* Cover image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-muted">
                          {loc.coverPhoto ? (
                            <Image
                              src={loc.coverPhoto}
                              alt={loc.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-orange-100">
                              <Camera className="h-14 w-14 text-primary/20" />
                            </div>
                          )}

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                          {/* Post count badge */}
                          {(loc.postCount ?? 0) > 0 && (
                            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                              {loc.postCount} {loc.postCount === 1 ? "bài" : "bài"}
                            </div>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="flex flex-col gap-2 p-4">
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {loc.name}
                          </h3>

                          {/* Category */}
                          {loc.category && (
                            <span className={`self-start rounded-full px-3 py-0.5 text-xs font-bold ${catColor}`}>
                              {loc.category}
                            </span>
                          )}

                          {/* Address */}
                          {(district || province) && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {[district, province].filter(Boolean).join(", ")}
                            </p>
                          )}

                          {/* Stats row */}
                          <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {province || "—"}
                            </span>
                            
                            {!isService && (
                              <span className="flex items-center gap-1.5" title={displaySunrise ? "Giờ vàng Bình minh hôm nay" : "Giờ vàng Hoàng hôn hôm nay"}>
                                <Sun className="h-3.5 w-3.5 text-orange-500" />
                                <span className="font-semibold text-foreground/85">{solarText} {displaySunrise ? "Sáng" : "Chiều"}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                
                {hasMore && (
                  <div className="flex justify-center pt-8 pb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setVisibleLocationsCount(prev => prev + 20)
                        fetchMoreLocations()
                      }}
                      disabled={loadingMore}
                      className="rounded-full px-8 bg-card"
                    >
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Xem thêm địa điểm
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-28 rounded-2xl border border-dashed border-border">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-5">
                  <MapPin className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Không tìm thấy địa điểm nào</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilter ? "Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm" : "Chưa có địa điểm nào trong hệ thống"}
                </p>
                {hasFilter && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedProvince("")
                    }}
                    className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all"
                  >
                    Xoá Bộ Lọc
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
