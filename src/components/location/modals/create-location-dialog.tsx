"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Search, X, Loader2, CheckCircle2, Camera, Building2, Layers, Navigation, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createLocation, type LocationCreateRequest } from "@/services/location.service"
import { MAP_STYLES } from "@/hooks/use-map-view"

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

interface SearchResult { display: string; name: string; lat: number; lng: number; ref_id?: string; address?: string }
interface CreateLocationDialogProps {
  onCreated?: (location?: any) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialLocation?: { lat: number, lng: number };
}

export function CreateLocationDialog({ onCreated, trigger, open: controlledOpen, onOpenChange, initialLocation }: CreateLocationDialogProps) {
  const { toast } = useToast()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const hasInitRef = useRef(false)

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)
  const [form, setForm] = useState<LocationCreateRequest>({ name: "", latitude: 0, longitude: 0, description: "", category: "", locationType: "SPOT" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pinned, setPinned] = useState(false)

  const [selectedStyle, setSelectedStyle] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vietmap_style")
      if (saved) return MAP_STYLES.find(s => s.id === saved) || MAP_STYLES[0]
    }
    return MAP_STYLES[0]
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vietmap_style", selectedStyle.id)
    }
  }, [selectedStyle])

  const [isLocating, setIsLocating] = useState(false)

  const placeMarker = useCallback((lng: number, lat: number) => {
    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl || !mapRef.current) return
    if (markerRef.current) markerRef.current.remove()
    const el = document.createElement("div")
    el.innerHTML = `<div style="width:36px;height:36px;background:hsl(28,80%,52%);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;transition:transform .15s;"><svg style="transform:rotate(45deg);width:16px;height:16px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`
    markerRef.current = new vietmapgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current)
    setForm(f => ({ ...f, latitude: lat, longitude: lng }))
    setPinned(true)
  }, [])

  const reverseGeocodeAndFill = useCallback(async (lat: number, lng: number) => {
    try {
      const { reverseGeocode } = await import("@/services/location.service")
      const first = await reverseGeocode(lat, lng)
      if (first?.display) setForm(f => ({ ...f, name: f.name || first.name || first.display.split(",")[0].trim() }))
    } catch (_) { }
  }, [])

  const initLocationMap = useCallback(() => {
    if (hasInitRef.current) return
    const globalContainer = document.getElementById("persistent-map-container")
    if (!globalContainer) return
    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl) return
    hasInitRef.current = true
    const innerContainer = document.createElement("div")
    innerContainer.style.width = "100%"; innerContainer.style.height = "100%"
    globalContainer.appendChild(innerContainer)
    vietmapgl.accessToken = VIETMAP_API_KEY
    const map = new vietmapgl.Map({
      container: innerContainer,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`,
      center: [108.2022, 16.0471], zoom: 5.5, antialias: false,
    })
    mapRef.current = map
      ; (window as any).vietmapPersistentInstance = map
    map.on("load", () => setMapLoaded(true))
    map.on("click", (e: any) => {
      placeMarker(e.lngLat.lng, e.lngLat.lat)
      reverseGeocodeAndFill(e.lngLat.lat, e.lngLat.lng)
    })
  }, [placeMarker, reverseGeocodeAndFill])

  // Removed eager initialization to prevent background map rendering and excessive .pbf requests
  useEffect(() => {
    const globalContainer = document.getElementById("persistent-map-container")
    if (!globalContainer) return

    if (open) {
      if (!globalContainer.firstChild) {
        initLocationMap()
      } else if (!mapRef.current && (window as any).vietmapPersistentInstance) {
        mapRef.current = (window as any).vietmapPersistentInstance
        setMapLoaded(true)
      }
      const moveMap = () => {
        if (globalContainer.firstChild && mapContainer.current) {
          mapContainer.current.appendChild(globalContainer.firstChild)
          setTimeout(() => mapRef.current?.resize(), 100)
        }
      }
      const t = setTimeout(moveMap, 50)
      return () => clearTimeout(t)
    } else {
      if (mapContainer.current?.firstChild) {
        globalContainer.appendChild(mapContainer.current.firstChild)
      }
    }
  }, [open, initLocationMap])

  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      mapRef.current.setStyle(selectedStyle.url)
    }
  }, [selectedStyle.url, mapLoaded])

  // Handle initialLocation when map is loaded and dialog is open
  useEffect(() => {
    if (open && mapLoaded && mapRef.current && initialLocation && !pinned) {
      setTimeout(() => {
        if (!mapRef.current) return
        mapRef.current.resize()
        mapRef.current.jumpTo({ center: [initialLocation.lng, initialLocation.lat], zoom: 15 })
        placeMarker(initialLocation.lng, initialLocation.lat)
        reverseGeocodeAndFill(initialLocation.lat, initialLocation.lng)
      }, 600)
    }
  }, [open, mapLoaded, initialLocation, pinned, placeMarker, reverseGeocodeAndFill])

  const handleMyLocation = () => {
    if (!navigator.geolocation) { toast({ title: "Không hỗ trợ", description: "Trình duyệt của bạn không hỗ trợ định vị." }); return }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setIsLocating(false)
        mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 900 })
        placeMarker(coords.lng, coords.lat)
        reverseGeocodeAndFill(coords.lat, coords.lng)
      },
      err => { console.error(err); toast({ title: "Lỗi định vị", description: "Không thể xác định vị trí của bạn.", variant: "destructive" }); setIsLocating(false) }
    )
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (q.trim().length < 2) { setSearchResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { searchVietMap } = await import("@/services/location.service")
        const data = await searchVietMap(q)
        setSearchResults((data || []).map((item: any) => ({
          display: item.display_name || item.name || item.display,
          name: item.name || item.display_name?.split(",")[0],
          lat: item.lat ?? 0, lng: item.lon ?? item.lng ?? 0,
          ref_id: item.ref_id,
          address: item.address || item.display_name
        })))
      } catch (_) { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 380)
  }

  const handleSelectResult = async (r: SearchResult) => {
    setSearchQuery(r.display); setSearchResults([])
    setIsSearching(true)

    let finalLat = r.lat
    let finalLng = r.lng

    try {
      if ((!finalLat || !finalLng) && r.ref_id) {
        const { getPlaceDetail } = await import("@/services/location.service")
        const detail = await getPlaceDetail(r.ref_id)
        if (detail && detail.lat && detail.lng) {
          finalLat = detail.lat
          finalLng = detail.lng
        }
      }

      if (!finalLat || !finalLng) {
        toast({ title: "Lỗi", description: "Không thể lấy tọa độ của địa điểm này.", variant: "destructive" })
        return
      }

      mapRef.current?.flyTo({ center: [finalLng, finalLat], zoom: 14, duration: 900 })
      placeMarker(finalLng, finalLat)
      setForm(f => ({ ...f, name: f.name || r.name || r.display.split(",")[0].trim() }))
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể định vị địa điểm này.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast({ title: "Thiếu tên địa điểm", variant: "destructive" })
    if (!form.latitude || !form.longitude) return toast({ title: "Chọn vị trí trên bản đồ", variant: "destructive" })
    setIsSubmitting(true)
    try {
      const newLoc = await createLocation(form)
      toast({ title: "✅ Tạo địa điểm thành công!" })
      setOpen(false); onCreated?.(newLoc)
      setForm({ name: "", latitude: 0, longitude: 0, description: "", category: "", locationType: form.locationType })
      setSearchQuery(""); setPinned(false)
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    } catch (err: any) {
      toast({ title: "Lỗi khi tạo địa điểm", description: err?.message, variant: "destructive" })
    } finally { setIsSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" className="gap-2"><MapPin className="h-4 w-4" /> Thêm địa điểm</Button>}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-3xl w-full gap-0 p-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Tạo địa điểm mới
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[540px]">
            <div className="relative flex-1 min-w-0">
              <div className="absolute top-3 left-3 right-3 z-20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Tìm kiếm địa điểm..." className="pl-9 pr-8 bg-card/95 backdrop-blur-md" />
                  {searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]) }} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5" /></button>}
                </div>
                {(searchResults.length > 0 || isSearching) && (
                  <div className="mt-1.5 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden">
                    {isSearching ? <div className="px-4 py-3 text-sm">Đang tìm...</div> : searchResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => handleSelectResult(r)} className="w-full flex items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/80 border-b last:border-0">
                        <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-medium text-foreground truncate">{r.name || r.display}</span>
                          {r.address && r.address !== (r.name || r.display) && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-tight">{r.address}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={mapContainer} className="h-full w-full bg-muted/30" />
              <div className={`absolute inset-0 z-10 transition-opacity duration-500 pointer-events-none ${mapLoaded ? "opacity-0" : "opacity-100"}`}>
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              </div>
              {mapLoaded && !pinned && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-card/90 px-4 py-2 text-xs animate-bounce-slow">Click trên bản đồ để chọn vị trí</div>}
              {pinned && <div className="absolute bottom-4 left-3 z-10 rounded-full bg-primary/15 border border-primary/40 px-3 py-1.5 text-xs text-primary font-mono">{form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</div>}

              {/* Map Controls */}
              <div className="absolute right-3 bottom-6 z-20 flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl">
                      <Layers className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="left" align="end" className="w-64 border border-border bg-card/95 backdrop-blur-md p-3.5 shadow-2xl rounded-2xl z-50">
                    <h4 className="text-xs font-bold text-muted-foreground mb-2.5 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Lớp Bản Đồ</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {MAP_STYLES.map(style => (
                        <button type="button" key={style.id} onClick={() => setSelectedStyle(style)} className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${style.id === selectedStyle.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground"}`}>
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-tr ${style.preview} mb-2 shadow-inner`} />
                          <span className="text-[10px] font-bold line-clamp-1">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-col rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl overflow-hidden">
                  <Button type="button" variant="ghost" size="icon" onClick={() => mapRef.current?.zoomTo(mapRef.current.getZoom() + 1, { duration: 300 })} className="h-9 w-9 rounded-none border-b border-border"><ZoomIn className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => mapRef.current?.zoomTo(mapRef.current.getZoom() - 1, { duration: 300 })} className="h-9 w-9 rounded-none"><ZoomOut className="h-4 w-4" /></Button>
                </div>

                <Button type="button" variant="outline" size="icon" onClick={handleMyLocation} disabled={isLocating} className={`h-9 w-9 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl ${isLocating ? "animate-pulse border-primary/40" : ""}`}>
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex w-72 flex-col border-l border-border">
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div className="space-y-1.5"><Label className="text-sm">Tên địa điểm *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Đỉnh Fansipan" required /></div>
                {/* Toggle loại địa điểm */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Loại địa điểm</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, locationType: "SPOT", category: "" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${form.locationType !== "SERVICE"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted border-border text-muted-foreground hover:bg-accent"
                        }`}
                    >
                      <Camera className="h-4 w-4" /> Điểm chụp
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, locationType: "SERVICE", category: "" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${form.locationType === "SERVICE"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-muted border-border text-muted-foreground hover:bg-accent"
                        }`}
                    >
                      <Building2 className="h-4 w-4" /> Dịch vụ
                    </button>
                  </div>
                </div>
                {/* Danh mục tự đổi theo loại địa điểm */}
                <div className="space-y-1.5"><Label className="text-sm">Danh mục</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger><SelectContent className="max-h-[200px]" position="popper" side="bottom" sideOffset={4}>{(form.locationType === "SERVICE" ? SERVICE_CATEGORIES : SPOT_CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-sm">Mô tả</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="..." rows={4} className="resize-none" /></div>
                <div className={`rounded-lg px-3 py-2.5 border ${pinned ? "bg-primary/5 border-primary/20" : "bg-muted"}`}><p className="text-[11px] text-muted-foreground uppercase">Tọa độ</p>{pinned ? <div className="text-xs font-mono">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</div> : <p className="text-xs text-muted-foreground">Chưa chọn</p>}</div>
              </div>
              <div className="border-t border-border px-5 py-4 flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" className="flex-1" disabled={isSubmitting || !pinned || !form.name.trim()}>Tạo</Button></div>
            </form>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
