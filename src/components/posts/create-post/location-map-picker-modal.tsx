"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  MapPin,
  X,
  Loader2,
  Navigation,
  Plus,
  Search,
  Check,
  Sparkles,
  CheckCircle2,
  Camera,
  Building2,
  AlertCircle
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createLocation, reverseGeocode, searchVietMap, getPlaceDetail } from "@/services/location.service"

const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY

const SPOT_CATEGORIES = [
  "Thiên nhiên", "Di tích lịch sử", "Chùa / Đền", "Bãi biển",
  "Núi / Đèo", "Thác nước", "Hồ / Sông", "Làng nghề",
  "Phố cổ", "Quảng trường", "Công viên", "Khác",
]

const SERVICE_CATEGORIES = [
  "Khách sạn / Resort", "Homestay / Nhà nghỉ",
  "Quán Cafe / Trà", "Nhà hàng / Ẩm thực",
  "Khu vui chơi / Giải trí", "Spa / Wellness", "Khác",
]

interface LocationItem {
  id: string
  name: string
  province?: string
  nameWithType?: string
  latitude?: number
  longitude?: number
  locationType?: string
}

interface LocationMapPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableLocations: LocationItem[]
  onSelectLocation: (loc: LocationItem, lat: number, lng: number) => void
  onLocationCreated?: (loc: LocationItem) => void
  defaultCenter?: { lat: number; lng: number }
  initialSearchQuery?: string
  initialLocationType?: "SPOT" | "SERVICE"
}

export function LocationMapPickerModal({
  open,
  onOpenChange,
  availableLocations,
  onSelectLocation,
  onLocationCreated,
  defaultCenter,
  initialSearchQuery = "",
  initialLocationType = "SPOT"
}: LocationMapPickerModalProps) {
  const { toast } = useToast()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [suggestedLocation, setSuggestedLocation] = useState<LocationItem | null>(null)

  // Search input & results on map
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ display: string; name?: string; address?: string; lat: number; lng: number; ref_id?: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)

  // Creation Form State
  const [name, setName] = useState(initialSearchQuery)
  const [locationType, setLocationType] = useState<"SPOT" | "SERVICE">(initialLocationType)
  const [category, setCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Keep initial values in sync when opening
  useEffect(() => {
    if (open) {
      if (initialSearchQuery) setName(initialSearchQuery)
      if (initialLocationType) setLocationType(initialLocationType)
    }
  }, [open, initialSearchQuery, initialLocationType])

  const categories = locationType === "SERVICE" ? SERVICE_CATEGORIES : SPOT_CATEGORIES

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchVietMap(q)
        setSearchResults(
          (data || []).map((item: any) => ({
            display: item.display_name || item.name || item.display,
            name: item.name || item.display_name?.split(",")[0],
            address: item.address || item.display_name,
            lat: item.lat ?? 0,
            lng: item.lon ?? item.lng ?? 0,
            ref_id: item.ref_id
          }))
        )
      } catch (_) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }

  const handleSelectResult = async (r: { display: string; name?: string; address?: string; lat: number; lng: number; ref_id?: string }) => {
    setSearchQuery(r.display)
    setSearchResults([])
    setIsSearching(true)
    let finalLat = r.lat,
      finalLng = r.lng
    try {
      if ((!finalLat || !finalLng) && r.ref_id) {
        const detail = await getPlaceDetail(r.ref_id)
        if (detail && detail.lat && detail.lng) {
          finalLat = detail.lat
          finalLng = detail.lng
        }
      }
      if (finalLat && finalLng && mapRef.current) {
        mapRef.current.flyTo({ center: [finalLng, finalLat], zoom: 15, duration: 800 })
        placeMarker(finalLng, finalLat)
        if (!name.trim()) {
          setName(r.name || r.display.split(",")[0].trim())
        }
      }
    } catch (_) {
    } finally {
      setIsSearching(false)
    }
  }

  const reverseGeocodeAndFill = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await reverseGeocode(lat, lng)
      if (res?.display) {
        setName(prev => (prev.trim() ? prev : (res.name || res.display.split(",")[0].trim())))
      }
    } catch (_) { }
  }, [])

  const placeMarker = useCallback(
    (lng: number, lat: number) => {
      const vietmapgl = (window as any).vietmapgl
      if (!vietmapgl || !mapRef.current) return

      if (markerRef.current) markerRef.current.remove()

      const el = document.createElement("div")
      el.innerHTML = `<div style="width:38px;height:38px;background:hsl(28,80%,52%);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.45);cursor:pointer;border:2.5px solid white;"><svg style="transform:rotate(45deg);width:18px;height:18px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`

      markerRef.current = new vietmapgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)

      setPinnedCoords({ lat, lng })

      // Check for closest existing location
      let closest: LocationItem | null = null
      let minDistance = Infinity

      for (const loc of availableLocations) {
        if (loc.latitude && loc.longitude) {
          const d = Math.hypot(loc.latitude - lat, loc.longitude - lng)
          if (d < minDistance) {
            minDistance = d
            closest = loc
          }
        }
      }

      if (closest) {
        const threshold = closest.locationType === "SERVICE" ? 0.005 : 0.045
        if (minDistance < threshold) {
          setSuggestedLocation(closest)
        } else {
          setSuggestedLocation(null)
        }
      } else {
        setSuggestedLocation(null)
      }
    },
    [availableLocations]
  )

  useEffect(() => {
    if (!open) {
      setPinnedCoords(null)
      setSuggestedLocation(null)
      setSearchQuery("")
      setSearchResults([])
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    let map: any
    const initMap = () => {
      const vietmapgl = (window as any).vietmapgl
      if (!vietmapgl || !mapContainer.current) return

      vietmapgl.accessToken = VIETMAP_API_KEY
      map = new vietmapgl.Map({
        container: mapContainer.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`,
        center: defaultCenter ? [defaultCenter.lng, defaultCenter.lat] : [105.852, 21.028],
        zoom: defaultCenter ? 15 : 12,
        antialias: true
      })
      mapRef.current = map

      map.on("load", () => {
        setMapLoaded(true)
        setTimeout(() => map.resize(), 100)
        setTimeout(() => map.resize(), 300)

        if (defaultCenter) {
          placeMarker(defaultCenter.lng, defaultCenter.lat)
          reverseGeocodeAndFill(defaultCenter.lat, defaultCenter.lng)
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              const { latitude, longitude } = pos.coords
              map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 800 })
            },
            () => { }
          )
        }
      })

      map.on("click", (e: any) => {
        placeMarker(e.lngLat.lng, e.lngLat.lat)
        reverseGeocodeAndFill(e.lngLat.lat, e.lngLat.lng)
      })
    }

    const checkScript = setInterval(() => {
      if ((window as any).vietmapgl) {
        clearInterval(checkScript)
        initMap()
      }
    }, 150)

    return () => {
      clearInterval(checkScript)
      if (map) map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [open, defaultCenter, placeMarker, reverseGeocodeAndFill])

  const handleConfirmSuggestion = () => {
    if (suggestedLocation && pinnedCoords) {
      onSelectLocation(suggestedLocation, pinnedCoords.lat, pinnedCoords.lng)
      onOpenChange(false)
    }
  }

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      return toast({ title: "Thiếu tên địa điểm", description: "Vui lòng nhập tên địa điểm bạn muốn tạo.", variant: "destructive" })
    }
    if (!pinnedCoords) {
      return toast({ title: "Chưa chọn vị trí", description: "Vui lòng chạm trên bản đồ để thả ghim vị trí chụp.", variant: "destructive" })
    }

    setIsSubmitting(true)
    try {
      const newLoc = await createLocation({
        name: name.trim(),
        latitude: pinnedCoords.lat,
        longitude: pinnedCoords.lng,
        category: category || undefined,
        locationType,
        description: description.trim() || undefined
      })

      toast({
        title: " Tạo địa điểm thành công!",
        description: `Đã thêm "${newLoc.name}" và chọn vào bài viết của bạn.`
      })

      onSelectLocation(newLoc, pinnedCoords.lat, pinnedCoords.lng)
      onLocationCreated?.(newLoc)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Lỗi tạo địa điểm",
        description: err?.message || "Không thể tạo địa điểm mới lúc này, vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/25 dark:bg-black/45 backdrop-blur-md"
        hideCloseButton={true}
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-5xl w-[96vw] h-[90vh] max-h-[820px] gap-0 p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col md:flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Bản đồ chọn & tạo địa điểm</DialogTitle>
        </VisuallyHidden>

        {/* Left Column: Interactive Map */}
        <div className="flex-1 relative bg-muted/20 w-full h-[320px] md:h-full flex flex-col">
          {/* Search Bar on Map */}
          <div className="absolute top-3 left-3 right-14 md:right-auto md:w-80 z-20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Tìm đường, địa danh trên bản đồ..."
                className="pl-9 pr-8 bg-card/95 backdrop-blur-md shadow-lg border-border h-10 rounded-xl text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {(searchResults.length > 0 || isSearching) && (
              <div className="mt-1.5 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden max-h-[260px] overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm kiếm...
                  </div>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResult(r)}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-muted border-b border-border/50 last:border-0 transition-colors cursor-pointer"
                    >
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-foreground truncate">{r.name || r.display}</span>
                        {r.address && r.address !== (r.name || r.display) && (
                          <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{r.address}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="md:hidden absolute top-3 right-3 z-20 rounded-full shadow-md h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* GPS Photo Badge or Prompt */}
          {defaultCenter && (
            <div className="absolute top-16 left-3 z-10 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-primary/30 flex items-center gap-1.5 text-xs text-primary font-medium">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Đã ghim toạ độ từ ảnh chụp (EXIF GPS)</span>
            </div>
          )}

          {/* Map Canvas */}
          <div ref={mapContainer} className="w-full h-full" />

          {!mapLoaded && (
            <div className="absolute inset-0 bg-muted/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">Đang tải bản đồ VietMap...</p>
            </div>
          )}

          {mapLoaded && !pinnedCoords && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border text-center pointer-events-none animate-bounce-slow">
              <p className="text-xs font-bold text-foreground"> Chạm trên bản đồ để chọn vị trí</p>
            </div>
          )}

          {/* Geolocation Button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 bottom-3 z-20 rounded-xl shadow-lg border border-border bg-card/95 h-9 w-9"
            onClick={() => {
              if (navigator.geolocation && mapRef.current) {
                navigator.geolocation.getCurrentPosition(pos => {
                  mapRef.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 })
                })
              }
            }}
            title="Vị trí của bạn"
          >
            <Navigation className="h-4 w-4 text-foreground" />
          </Button>
        </div>

        {/* Right Column: Unified Form & Action Panel */}
        <div className="w-full md:w-[380px] lg:w-[410px] border-t md:border-t-0 md:border-l border-border bg-card flex flex-col h-[calc(90vh-320px)] md:h-full justify-between">
          {/* Panel Header */}
          <div className="px-5 pt-4 pb-3 border-b border-border/80 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Thông Tin Địa Điểm
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chọn điểm có sẵn hoặc tạo địa điểm mới ngay
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hidden md:flex rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Pin Coordinates Status Indicator */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs border border-border/60">
              <span className="text-muted-foreground font-medium">Toạ độ ghim:</span>
              {pinnedCoords ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {pinnedCoords.lat.toFixed(4)}, {pinnedCoords.lng.toFixed(4)}
                </span>
              ) : (
                <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Chưa thả ghim
                </span>
              )}
            </div>

            {/* Nearest Existing Location Suggestion */}
            {suggestedLocation && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Có địa điểm sẵn gần đây:
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
                    {suggestedLocation.locationType === "SERVICE" ? "Dịch vụ" : "Điểm chụp"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{suggestedLocation.name}</h4>
                  {suggestedLocation.province && (
                    <p className="text-xs text-muted-foreground mt-0.5">{suggestedLocation.province}</p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSuggestion}
                  className="w-full h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm mt-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Chọn địa điểm này
                </Button>
                <p className="text-[10px] text-center text-muted-foreground italic pt-1">
                  Hoặc tạo địa điểm mới ở bên dưới nếu không đúng
                </p>
              </div>
            )}

            {/* Creation Form */}
            <form id="create-location-subform" onSubmit={handleCreateAndSelect} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Tên địa điểm mới <span className="text-destructive">*</span>
                  </label>
                </div>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Đỉnh đèo Hải Vân, Quán Cafe X..."
                  className="text-xs h-9 bg-card border-input focus-visible:ring-1 focus-visible:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Loại địa điểm</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationType("SPOT")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${locationType === "SPOT"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                  >
                    <Camera className="h-3.5 w-3.5" /> Điểm Chụp
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("SERVICE")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${locationType === "SERVICE"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Dịch Vụ
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Danh mục</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Chọn danh mục..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Mô tả ngắn (tuỳ chọn)</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Đường đi, mẹo canh góc chụp đẹp, lưu ý..."
                  className="text-xs min-h-[60px] resize-none"
                  rows={2}
                />
              </div>
            </form>
          </div>

          {/* Bottom Panel Actions */}
          <div className="p-4 border-t border-border/80 bg-muted/20 shrink-0">
            <Button
              type="submit"
              form="create-location-subform"
              disabled={isSubmitting || !name.trim() || !pinnedCoords}
              className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl gap-2 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo địa điểm...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Tạo & Chọn Vào Bài Viết
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
