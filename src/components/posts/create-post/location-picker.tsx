"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, Navigation, Search, X, Loader2, Sparkles, Check, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LocationMapPickerModal } from "./location-map-picker-modal"

interface LocationItem { id: string; name: string; province?: string; nameWithType?: string; latitude?: number; longitude?: number; locationType?: string }

interface LocationPickerProps {
  selectedLocation: { id: string; name: string; locationType?: string } | null
  locationSearch: string
  setLocationSearch: (v: string) => void
  setSelectedLocation: (loc: { id: string; name: string; locationType?: string } | null) => void
  availableLocations: LocationItem[]
  setManualPin?: (pin: {lat: number, lng: number} | null) => void
  onLocationCreated?: (loc: LocationItem) => void
  defaultCenter?: {lat: number, lng: number}
  suggestedLocation?: { id: string; name: string; locationType?: string; distanceKm?: number } | null
  postType?: "SPOT" | "SERVICE"
}

export function LocationPicker({
  selectedLocation,
  locationSearch,
  setLocationSearch,
  setSelectedLocation,
  availableLocations,
  setManualPin,
  onLocationCreated,
  defaultCenter,
  suggestedLocation,
  postType
}: LocationPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener("mousedown", handleDocClick)
    return () => document.removeEventListener("mousedown", handleDocClick)
  }, [])

  const filtered = availableLocations.filter(loc =>
    locationSearch === "" ||
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.province?.toLowerCase().includes(locationSearch.toLowerCase())
  )

  const quickPicks = availableLocations.slice(0, 5)

  return (
    <div className="mb-4 relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Địa Điểm</span>
          <span className="text-xs text-red-500">*</span>
        </div>
        {availableLocations.length > 0 && (
          <span className="text-[11px] text-muted-foreground">{availableLocations.length} địa điểm sẵn có</span>
        )}
      </div>

      {/* Banner gợi ý 1 chạm từ toạ độ ảnh EXIF */}
      {suggestedLocation && !selectedLocation && (
        <div className="mb-2.5 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs text-foreground transition-all">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
            <span className="truncate">
              Gợi ý từ toạ độ ảnh: <span className="font-semibold text-primary">{suggestedLocation.name}</span>
              {suggestedLocation.distanceKm !== undefined && (
                <span className="text-muted-foreground ml-1">(~{suggestedLocation.distanceKm} km)</span>
              )}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 text-xs px-2.5 shrink-0 bg-primary font-medium"
            onClick={() => {
              setSelectedLocation({
                id: suggestedLocation.id,
                name: suggestedLocation.name,
                locationType: suggestedLocation.locationType
              })
              setLocationSearch(suggestedLocation.name)
              setShowPicker(false)
            }}
          >
            Chọn ngay
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location-search"
            placeholder="Tìm theo tên địa điểm hoặc tỉnh thành..."
            value={locationSearch}
            onChange={e => { setLocationSearch(e.target.value); setShowPicker(true) }}
            onFocus={() => setShowPicker(true)}
            className="pl-9 text-sm border-input focus-visible:ring-1 focus-visible:ring-primary"
          />
          {locationSearch && (
            <button
              type="button"
              onClick={() => { setLocationSearch(""); setShowPicker(true) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="shrink-0 gap-1.5 text-xs font-semibold h-9 border-primary/40 bg-white dark:bg-card hover:bg-primary/5 text-foreground hover:border-primary shadow-sm transition-all cursor-pointer" 
          onClick={() => setShowMapModal(true)}
          title="Chọn vị trí hoặc tạo địa điểm mới trên bản đồ"
        >
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Bản đồ &</span> Tạo mới
        </Button>
      </div>

      {selectedLocation && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-primary font-semibold truncate">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Địa điểm đã chọn: <strong>{selectedLocation.name}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedLocation(null); setLocationSearch("") }}
            className="ml-2 text-muted-foreground hover:text-destructive flex items-center gap-1 text-[11px] shrink-0 cursor-pointer"
          >
            <X className="h-3 w-3" /> Bỏ chọn
          </button>
        </div>
      )}

      {/* Danh sách địa điểm gợi ý & kết quả tìm kiếm */}
      {showPicker && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-xl backdrop-blur-md">
          {locationSearch === "" && quickPicks.length > 0 && (
            <div className="px-3 py-1.5 bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
              <span>ĐỊA ĐIỂM NỔI BẬT GẦN ĐÂY</span>
              <span>Bấm 1 chạm để chọn</span>
            </div>
          )}
          {filtered.slice(0, 40).map(loc => {
            const isCurrent = selectedLocation?.id === loc.id
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setSelectedLocation({ id: loc.id, name: loc.name, locationType: loc.locationType })
                  setLocationSearch(loc.name)
                  setShowPicker(false)
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors border-b border-border/40 last:border-b-0 cursor-pointer ${
                  isCurrent ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MapPin className={`h-4 w-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">{loc.name}</p>
                    {loc.province && (
                      <p className="text-xs text-muted-foreground truncate">
                        {loc.province}{loc.nameWithType ? ` • ${loc.nameWithType}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                {loc.locationType && (
                  <Badge variant="outline" className="text-[10px] shrink-0 uppercase ml-2">
                    {loc.locationType === "SERVICE" ? "Dịch vụ" : "Điểm chụp"}
                  </Badge>
                )}
              </button>
            )
          })}

          {/* Nút Tạo Địa Điểm Mới nhanh 1-chạm ở chân dropdown khi người dùng đang gõ */}
          {locationSearch.trim().length > 0 && (
            <div className="p-2 border-t border-border bg-muted/30 sticky bottom-0 z-10 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  setShowMapModal(true)
                  setShowPicker(false)
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors border border-primary/25 cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo địa điểm mới: <strong>&quot;{locationSearch.trim()}&quot;</strong></span>
              </button>
            </div>
          )}

          {filtered.length === 0 && locationSearch.trim().length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground italic">
              Chưa có địa điểm nào phù hợp. Bấm &quot;Tạo mới&quot; để thêm địa điểm.
            </div>
          )}
        </div>
      )}

      {showMapModal && (
        <LocationMapPickerModal 
          open={showMapModal} 
          onOpenChange={setShowMapModal} 
          availableLocations={availableLocations} 
          defaultCenter={defaultCenter}
          initialSearchQuery={locationSearch}
          initialLocationType={postType}
          onSelectLocation={(loc, lat, lng) => {
            setSelectedLocation({ id: loc.id, name: loc.name, locationType: loc.locationType })
            setLocationSearch(loc.name)
            setManualPin?.({ lat, lng })
          }}
          onLocationCreated={onLocationCreated}
        />
      )}
    </div>
  )
}
