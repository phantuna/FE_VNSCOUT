"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, X, Loader2, Navigation, Plus, Search } from "lucide-react"
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CreateLocationDialog } from "@/components/location/modals/create-location-dialog"

const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY

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
  defaultCenter?: {lat: number, lng: number}
}

export function LocationMapPickerModal({ open, onOpenChange, availableLocations, onSelectLocation, onLocationCreated, defaultCenter }: LocationMapPickerModalProps) {
  const { toast } = useToast()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  
  const [mapLoaded, setMapLoaded] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState<{lat: number, lng: number} | null>(null)
  const [suggestedLocation, setSuggestedLocation] = useState<LocationItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{display: string, name?: string, address?: string, lat: number, lng: number, ref_id?: string}[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)

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
          address: item.address || item.display_name,
          lat: item.lat ?? 0, lng: item.lon ?? item.lng ?? 0,
          ref_id: item.ref_id
        })))
      } catch (_) { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 380)
  }

  const handleSelectResult = async (r: {display: string, name?: string, address?: string, lat: number, lng: number, ref_id?: string}) => {
    setSearchQuery(r.display); setSearchResults([])
    setIsSearching(true)
    let finalLat = r.lat, finalLng = r.lng
    try {
      if ((!finalLat || !finalLng) && r.ref_id) {
        const { getPlaceDetail } = await import("@/services/location.service")
        const detail = await getPlaceDetail(r.ref_id)
        if (detail && detail.lat && detail.lng) { finalLat = detail.lat; finalLng = detail.lng }
      }
      if (finalLat && finalLng && mapRef.current) {
        mapRef.current.flyTo({ center: [finalLng, finalLat], zoom: 15, duration: 900 })
        // Tự động rớt ghim sau khi bay tới
        setTimeout(() => placeMarker(finalLng, finalLat), 1000)
      }
    } catch (_) { } finally { setIsSearching(false) }
  }

  const placeMarker = useCallback((lng: number, lat: number) => {
    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl || !mapRef.current) return
    
    if (markerRef.current) markerRef.current.remove()
    
    const el = document.createElement("div")
    el.innerHTML = `<div style="width:40px;height:40px;background:hsl(28,80%,52%);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer;transition:transform .15s; border: 2px solid white;"><svg style="transform:rotate(45deg);width:20px;height:20px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`
    
    markerRef.current = new vietmapgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current)
      
    setPinnedCoords({ lat, lng })
    
    // Reverse Geo-fencing logic
    let closest: LocationItem | null = null
    let minDistance = Infinity
    
    for (const loc of availableLocations) {
      if (loc.latitude && loc.longitude) {
        // approximate distance in degrees (1 degree is roughly 111km)
        const d = Math.hypot(loc.latitude - lat, loc.longitude - lng)
        if (d < minDistance) {
          minDistance = d
          closest = loc
        }
      }
    }
    
    // If closest is within ~5km (0.05 degrees) for SPOT, or ~500m (0.005) for SERVICE
    if (closest) {
      const isService = closest.locationType === "SERVICE"
      const threshold = isService ? 0.005 : 0.05
      
      if (minDistance < threshold) {
        setSuggestedLocation(closest)
      } else {
        setSuggestedLocation(null)
      }
    } else {
      setSuggestedLocation(null)
    }
    
  }, [availableLocations])

  useEffect(() => {
    if (!open) {
      setPinnedCoords(null)
      setSuggestedLocation(null)
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
        center: defaultCenter ? [defaultCenter.lng, defaultCenter.lat] : [105.852, 21.028], // Default Hanoi or Photo EXIF
        zoom: defaultCenter ? 14 : 12,
        antialias: true,
      })
      mapRef.current = map

      map.on("load", () => {
        setMapLoaded(true)
        setTimeout(() => map.resize(), 100)
        setTimeout(() => map.resize(), 300)
        setTimeout(() => map.resize(), 500)
        
        // Ensure map always resizes if container changes
        const resizeObserver = new ResizeObserver(() => {
          map?.resize();
        });
        if (mapContainer.current) {
          resizeObserver.observe(mapContainer.current);
        }
        
        if (!defaultCenter) {
          // Fallback to IP/Browser location if no EXIF is provided
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
              const { latitude, longitude } = pos.coords
              map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1000 })
            }, () => {})
          }
        } else {
          // Automatically place marker at EXIF GPS location
          placeMarker(defaultCenter.lng, defaultCenter.lat);
        }
      })

      map.on("click", (e: any) => {
        placeMarker(e.lngLat.lng, e.lngLat.lat)
      })
    }

    const checkScript = setInterval(() => {
      if ((window as any).vietmapgl) {
        clearInterval(checkScript)
        initMap()
      }
    }, 200)

    return () => {
      clearInterval(checkScript)
      if (map) map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [open, placeMarker])

  const handleConfirmSuggestion = () => {
    if (suggestedLocation && pinnedCoords) {
      onSelectLocation(suggestedLocation, pinnedCoords.lat, pinnedCoords.lng)
      onOpenChange(false)
    }
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  return (
    <>
      <Dialog open={open && !showCreateModal} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <DialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] max-w-4xl w-[95vw] h-[85vh] gap-0 p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col">
            <VisuallyHidden>
              <DialogTitle>Bản đồ chọn vị trí</DialogTitle>
            </VisuallyHidden>
            {/* Header with Search */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none gap-4">
              <div className="flex-1 max-w-sm pointer-events-auto relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={searchQuery} 
                    onChange={e => handleSearch(e.target.value)} 
                    placeholder="Tìm đường, phường, thành phố..." 
                    className="pl-9 pr-8 bg-card/95 backdrop-blur-md shadow-lg border-border h-11 rounded-xl" 
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(""); setSearchResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  )}
                </div>
                {(searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {isSearching ? <div className="px-4 py-3 text-sm text-muted-foreground">Đang tìm...</div> : searchResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => handleSelectResult(r)} className="w-full flex items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted/80 border-b border-border/50 last:border-0 transition-colors">
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

              <Button size="icon" variant="secondary" onClick={() => onOpenChange(false)} className="rounded-full shadow-lg pointer-events-auto hover:bg-destructive hover:text-white transition-colors shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-muted/30 w-full min-h-[400px]">
              <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
              
              {!mapLoaded && (
                <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Đang tải bản đồ...</p>
                </div>
              )}
              
              {mapLoaded && !pinnedCoords && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-card/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl border border-border/50 animate-bounce pointer-events-none">
                  <p className="text-sm font-bold text-foreground">👇 Chạm vào bản đồ để thả ghim góc chụp</p>
                </div>
              )}
              
              <Button 
                type="button" 
                variant="secondary" 
                size="icon"
                className="absolute right-4 bottom-32 z-20 rounded-xl shadow-xl border border-border bg-card/95"
                onClick={() => {
                  if (navigator.geolocation && mapRef.current) {
                    navigator.geolocation.getCurrentPosition(pos => {
                      mapRef.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 })
                    })
                  }
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {/* Bottom Panel */}
            <div className="h-auto min-h-[140px] bg-card border-t border-border p-6 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] relative z-20 flex flex-col justify-center">
              {!pinnedCoords ? (
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Bạn đang ở đâu?</h3>
                  <p className="text-sm text-muted-foreground">Di chuyển bản đồ và chọn chính xác vị trí bạn đã đứng chụp ảnh.</p>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    {suggestedLocation ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <MapPin className="h-5 w-5 animate-bounce" />
                          Gợi ý địa điểm gần bạn:
                        </div>
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-lg">{suggestedLocation.name}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{suggestedLocation.province}</p>
                          </div>
                          <Button onClick={handleConfirmSuggestion} className="px-6 shadow-md shadow-primary/20">
                            Có, tôi ở đây
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-amber-600 flex items-center gap-2">
                          <MapPin className="h-5 w-5" /> Khu vực mới khám phá
                        </h3>
                        <p className="text-sm text-muted-foreground">Không tìm thấy địa điểm nào có sẵn quanh tọa độ này.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-[1px] h-16 bg-border mx-2 hidden md:block" />
                  
                  <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hoặc</p>
                    <Button variant={suggestedLocation ? "outline" : "default"} onClick={handleCreateNew} className="gap-2 rounded-xl">
                      <Plus className="h-4 w-4" /> Tạo địa điểm mới
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
      
      {showCreateModal && (
        <CreateLocationDialog 
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          initialLocation={pinnedCoords || defaultCenter || undefined}
          onCreated={(newLoc) => {
            setShowCreateModal(false)
            if (newLoc) {
              // Tự động chọn địa điểm vừa tạo rồi đóng map modal
              onSelectLocation(newLoc, newLoc.latitude ?? pinnedCoords?.lat ?? 0, newLoc.longitude ?? pinnedCoords?.lng ?? 0)
              onLocationCreated?.(newLoc)
              onOpenChange(false)
            } else {
              toast({ title: "Tạo địa điểm thành công", description: "Vui lòng tìm tên địa điểm vừa tạo để chọn." })
              onOpenChange(false)
            }
          }}
        />
      )}
    </>
  )
}
