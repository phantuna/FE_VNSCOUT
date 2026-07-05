"use client"

import { useEffect, useRef, useState } from "react"
import { type Location } from "@/types"
import "./map.css"

// Chặn lỗi AbortError ảo từ nội bộ Vietmap GL một cách triệt để ở cấp độ global
if (typeof window !== "undefined") {
  const handleAbortError = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason && (reason.name === "AbortError" || reason.message?.toLowerCase().includes("abort"))) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener("unhandledrejection", handleAbortError);
}

const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY

interface VietMapProps {
  onSelectLocation?: (location: Location | null) => void
  onMapClick?: () => void
  selectedLocationId?: string | null
  flyToLocation?: { lat: number; lng: number } | null
  styleUrl?: string
  locations?: Location[]
  searchResult?: { lat: number; lng: number; name: string } | null
  mapInstanceRef?: React.MutableRefObject<any>
  showSpots?: boolean
  showServices?: boolean
  locationPosts?: any[]
}

export function VietMapView({
  onSelectLocation,
  onMapClick,
  selectedLocationId,
  flyToLocation,
  styleUrl,
  locations = [],
  searchResult,
  mapInstanceRef,
  showSpots = true,
  showServices = false,
  locationPosts = [],
}: VietMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const isInitializing = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Lưu trữ các marker đang hiển thị để dọn dẹp tránh trùng lặp
  const markersRef = useRef<any[]>([])
  const photoMarkersRef = useRef<any[]>([])
  // Lưu trữ marker tìm kiếm tạm thời
  const searchMarkerRef = useRef<any>(null)

  // 1. Khởi tạo bản đồ VietMap
  useEffect(() => {
    let checkInterval: NodeJS.Timeout

    const initMap = () => {
      if (isInitializing.current || mapRef.current) return true

      const vietmapgl = (window as any).vietmapgl
      if (!vietmapgl || !mapContainer.current) return false

      isInitializing.current = true
      vietmapgl.accessToken = VIETMAP_API_KEY
      const MapClass = vietmapgl.Map

      if (!VIETMAP_API_KEY) {
        setMapLoaded(true)
        return true
      }

      try {
        const initialStyle = styleUrl || `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`
        const map = new MapClass({
          container: mapContainer.current,
          style: initialStyle,
          center: [108.2022, 16.0471],
          zoom: 5.8,
          hash: false,
        })

        mapRef.current = map
        if (mapInstanceRef) {
          mapInstanceRef.current = map
        }

        map.on("load", () => {
          setMapLoaded(true)
          console.log("VietMap loaded successfully")

          // Thiết lập class zoom ban đầu để phục vụ ẩn/hiện chi tiết marker chống rối mắt
          const zoom = map.getZoom()
          if (mapContainer.current) {
            if (zoom >= 11) {
              mapContainer.current.classList.add("vps-zoom-detailed")
              mapContainer.current.classList.remove("vps-zoom-simple")
            } else {
              mapContainer.current.classList.add("vps-zoom-simple")
              mapContainer.current.classList.remove("vps-zoom-detailed")
            }
          }
        })

        // Lắng nghe sự kiện click trên bản đồ nền để đóng popup/sidebar
        map.on("click", () => {
          if (onMapClick) {
            onMapClick()
          } else if (onSelectLocation) {
            onSelectLocation(null)
          }
        })

        // Lắng nghe sự kiện zoom để tự động thay đổi lớp hiển thị
        map.on("zoom", () => {
          if (!mapContainer.current) return
          const zoom = map.getZoom()
          if (zoom >= 11) {
            mapContainer.current.classList.add("vps-zoom-detailed")
            mapContainer.current.classList.remove("vps-zoom-simple")
          } else {
            mapContainer.current.classList.add("vps-zoom-simple")
            mapContainer.current.classList.remove("vps-zoom-detailed")
          }
        })

        map.on("error", (e: any) => {
          console.error("VietMap Error Detailed:", e?.error || e)
          if (e?.error?.status === 423) {
            console.error("API Key VietMap bị khóa hoặc hết hạn định mức (423 Locked).")
          }
        })

        return true
      } catch (err) {
        console.error("Failed to initialize VietMap:", err)
        isInitializing.current = false
        return false
      }
    }

    if (!initMap()) {
      checkInterval = setInterval(() => {
        if (initMap()) clearInterval(checkInterval)
      }, 300)
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
      if (mapRef.current) {
        const currentMap = mapRef.current
        mapRef.current = null
        if (mapInstanceRef) {
          mapInstanceRef.current = null
        }
        isInitializing.current = false

        setTimeout(() => {
          try {
            if (currentMap && typeof currentMap.remove === "function") {
              // Tắt các sự kiện trước khi remove để tránh lỗi trigger
              currentMap.off('move');
              currentMap.off('zoom');
              currentMap.off('idle');
              currentMap.off('render');
              currentMap.remove()
            }
          } catch (e: any) {
            // Mapbox/VietMap GL thường ném lỗi AbortError khi hủy các fetch tiles đang dang dở
            const msg = e?.message?.toLowerCase() || ""
            if (e?.name !== "AbortError" && !msg.includes("aborted") && !msg.includes("abort")) {
              console.debug("Map cleanup error:", e?.message)
            }
          }
        }, 250)
      }
    }
  }, [])

  // 2. Cập nhật Style Bản đồ (Layers) khi đổi styleUrl
  useEffect(() => {
    if (mapRef.current && mapLoaded && styleUrl) {
      try {
        mapRef.current.setStyle(styleUrl)
      } catch (error) {
        console.error("Failed to set map style:", error)
      }
    }
  }, [styleUrl, mapLoaded])

  // 3. Zoom và di chuyển bản đồ đến vị trí được yêu cầu (flyToLocation)
  useEffect(() => {
    if (flyToLocation && mapRef.current && mapLoaded) {
      const lat = Number(flyToLocation.lat)
      const lng = Number(flyToLocation.lng)
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 14.5,
          essential: true,
          duration: 2000,
        })
      }
    }
  }, [flyToLocation, mapLoaded])

  // Tự động di chuyển bản đồ (flyTo) đến địa điểm được chọn khi selectedLocationId thay đổi
  useEffect(() => {
    if (selectedLocationId && mapLoaded && mapRef.current && locations.length > 0) {
      const loc = locations.find(l => l.id === selectedLocationId)
      if (loc && loc.longitude && loc.latitude) {
        const center = mapRef.current.getCenter()
        const latDiff = Math.abs(center.lat - loc.latitude)
        const lngDiff = Math.abs(center.lng - loc.longitude)
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          mapRef.current.flyTo({
            center: [loc.longitude, loc.latitude],
            zoom: 14.5,
            essential: true,
            duration: 1500,
          })
        }
      }
    }
  }, [selectedLocationId, mapLoaded, locations])

  // 4. Vẽ danh sách các Địa Điểm Ảnh Đẹp lên bản đồ
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl) return

    const MarkerClass = vietmapgl.Marker
    const map = mapRef.current

    // Dọn dẹp các marker cũ để không bị nhân đôi
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Lặp qua từng địa điểm và tạo marker tùy chỉnh cao cấp
    locations.forEach((loc) => {
      if (!loc.longitude || !loc.latitude) return

      const isSelected = loc.id === selectedLocationId
      const isService = loc.locationType === "SERVICE"

      // Màu sắc theo loại địa điểm
      const accentColor = isService ? "#6366f1" : "#f59e0b"
      const glowColor = isService ? "rgba(99,102,241,0.4)" : "rgba(245,158,11,0.4)"
      const gradientEnd = isService ? "#4f46e5" : "#ea580c"
      const badgeColor = isService ? "#6366f1" : "#ef4444"
      const avatarRadius = isService ? "8px" : "50%"
      const imgRadius = isService ? "5px" : "50%"

      // Icon mặc định khi chưa có ảnh bìa
      const defaultIcon = isService
        ? `<svg style="width:18px;height:18px;color:#fff;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`
        : `<svg style="width:20px;height:20px;color:#fff;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`

      const el = document.createElement("div")
      el.className = `vietmap-custom-spot-marker ${isService ? "vps-type-service" : "vps-type-spot"}`
      el.style.cursor = "pointer"

      // HTML cho Marker với cấu trúc Class có ngữ nghĩa phục vụ điều khiển bằng CSS
      el.innerHTML = `
        <div class="vps-marker-wrapper ${isSelected ? 'vps-marker-selected' : ''} ${isService ? 'vps-marker-service' : 'vps-marker-spot'}" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; z-index: ${isSelected ? '99' : '1'};">
          <!-- Vòng sáng theo màu loại -->
          <div class="vps-marker-glow" style="position: absolute; width: 48px; height: 48px; border-radius: ${avatarRadius}; background: ${isSelected ? `linear-gradient(135deg, ${accentColor}, ${gradientEnd})` : glowColor}; filter: blur(${isSelected ? '4px' : '2px'}); opacity: ${isSelected ? '1' : '0.6'}; transition: all 0.3s; animation: ${isSelected ? 'pulse 2s infinite' : 'none'};"></div>
          
          <!-- Khung ảnh với hình dạng theo loại -->
          <div class="vps-marker-avatar" style="position: relative; width: 42px; height: 42px; border-radius: ${avatarRadius}; border: 3px solid ${isSelected ? accentColor : '#ffffff'}; background-color: #1f2937; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);">
            ${loc.coverPhoto
          ? `<img src="${loc.coverPhoto}" alt="${loc.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${imgRadius};" />`
          : defaultIcon
        }
          </div>

          <!-- Huy hiệu số lượng bài viết đăng tại địa điểm này -->
          ${(loc.postCount || 0) > 0
          ? `<div class="vps-marker-badge" style="position: absolute; top: -6px; right: -6px; background: ${badgeColor}; color: #ffffff; border-radius: 55px; height: 20px; min-width: 20px; padding: 0 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.2s;">
                  ${loc.postCount}
                 </div>`
          : ""
        }

          <!-- Nhãn tên địa điểm -->
          <div class="vps-marker-label" style="position: absolute; top: 48px; background: rgba(15, 23, 42, 0.9); border: 1.5px solid ${isSelected ? accentColor : 'rgba(255,255,255,0.1)'}; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.25); pointer-events: none; opacity: ${isSelected ? '1' : '0.85'}; transition: all 0.2s;">
            ${loc.name}
          </div>
        </div>
      `

      // Thêm hiệu ứng hover phóng to bằng JS cho chế độ chi tiết (khi zoom sát)
      el.addEventListener("mouseenter", () => {
        if (!isSelected) {
          const wrapper = el.firstElementChild as HTMLElement
          if (wrapper) {
            // Không can thiệp nếu đang ở chế độ zoom xa simple (CSS sẽ lo phần zoom xa)
            if (!mapContainer.current?.classList.contains("vps-zoom-simple")) {
              wrapper.style.transform = "scale(1.15)"
              wrapper.style.zIndex = "10"
              const glow = wrapper.firstElementChild as HTMLElement
              if (glow) glow.style.opacity = "1"
            }
          }
        }
      })

      el.addEventListener("mouseleave", () => {
        if (!isSelected) {
          const wrapper = el.firstElementChild as HTMLElement
          if (wrapper) {
            if (!mapContainer.current?.classList.contains("vps-zoom-simple")) {
              wrapper.style.transform = "scale(1)"
              wrapper.style.zIndex = "1"
              const glow = wrapper.firstElementChild as HTMLElement
              if (glow) glow.style.opacity = "0.6"
            }
          }
        }
      })

      el.addEventListener("click", (e) => {
        e.stopPropagation()
        onSelectLocation?.(loc)
      })

      // Tạo marker và đưa vào bản đồ
      const marker = new MarkerClass({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [mapLoaded, locations, onSelectLocation, selectedLocationId])

  // 5. Thêm Marker tìm kiếm tạm thời khi có kết quả tìm kiếm (searchResult)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl) return

    const MarkerClass = vietmapgl.Marker
    const map = mapRef.current

    // Xóa marker cũ
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove()
      searchMarkerRef.current = null
    }

    if (!searchResult) return

    const lat = Number(searchResult.lat)
    const lng = Number(searchResult.lng)
    if (isNaN(lat) || isNaN(lng)) return

    // Tạo HTML Marker tìm kiếm với hiệu ứng sóng đập (pulsing)
    const el = document.createElement("div")
    el.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <!-- Vòng sóng radar loang ra màu xanh nước biển -->
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #06b6d4; opacity: 0.7; animation: radarPulse 1.8s infinite ease-out;"></div>
        <!-- Điểm nhân trung tâm màu xanh sáng -->
        <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(6,182,212,0.8);"></div>
      </div>
    `

    const marker = new MarkerClass({ element: el })
      .setLngLat([lng, lat])
      .addTo(map)

    searchMarkerRef.current = marker

    // Tự động di chuyển góc nhìn tới địa điểm tìm kiếm
    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1800,
    })
  }, [searchResult, mapLoaded])

  // 5.5. Thêm Marker cho từng ảnh của bài viết (nếu có locationPosts)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl) return

    const MarkerClass = vietmapgl.Marker
    const map = mapRef.current

    // Dọn dẹp photo markers cũ
    photoMarkersRef.current.forEach(m => m.remove())
    photoMarkersRef.current = []

    if (!locationPosts || locationPosts.length === 0) return

    // Thu thập tất cả photos có tọa độ
    const photosWithGps = locationPosts.flatMap(post => 
      (post.photos || []).filter((p: any) => {
        if (p.gpsLatitude === null || p.gpsLongitude === null) return false
        const lat = Number(p.gpsLatitude)
        const lng = Number(p.gpsLongitude)
        return !isNaN(lat) && !isNaN(lng)
      })
    )

    photosWithGps.forEach(photo => {
      const el = document.createElement("div")
      el.className = "vps-photo-marker"
      el.style.cursor = "pointer"
      el.style.zIndex = "50" // Đặt z-index cao hơn base marker nhưng thấp hơn selected marker
      
      // Marker nhỏ chứa thumbnail ảnh (hiệu ứng ảnh polaroid nghiêng nhẹ)
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translateY(-50%); transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <!-- Cột mốc cắm xuống đất -->
          <div style="position: absolute; bottom: -8px; width: 2px; height: 14px; background: #fff; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>
          <!-- Khung ảnh -->
          <div style="position: relative; width: 36px; height: 36px; border-radius: 4px; border: 2.5px solid #fff; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background: #222; transform: rotate(-5deg); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <img src="${photo.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
      `
      
      el.addEventListener("mouseenter", () => {
        el.style.zIndex = "90"
        const imgContainer = el.querySelector("div > div:nth-child(2)") as HTMLElement
        if (imgContainer) {
          imgContainer.style.transform = "scale(1.8) rotate(0deg) translateY(-5px)"
          imgContainer.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5)"
        }
      })
      
      el.addEventListener("mouseleave", () => {
        el.style.zIndex = "50"
        const imgContainer = el.querySelector("div > div:nth-child(2)") as HTMLElement
        if (imgContainer) {
          imgContainer.style.transform = "rotate(-5deg) scale(1) translateY(0)"
          imgContainer.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)"
        }
      })

      const marker = new MarkerClass({ element: el })
        .setLngLat([Number(photo.gpsLongitude), Number(photo.gpsLatitude)])
        .addTo(map)
        
      photoMarkersRef.current.push(marker)
    })
  }, [mapLoaded, locationPosts])

  // 6. Fly to selected location
  useEffect(() => {
    if (!mapRef.current || !selectedLocationId || locations.length === 0) return

    const loc = locations.find((l) => l.id === selectedLocationId)
    if (!loc) return

    mapRef.current.flyTo({
      center: [loc.longitude, loc.latitude],
      zoom: 14.5,
      duration: 1500,
    })
  }, [selectedLocationId, locations])

  return (
    <div className="relative h-full w-full bg-slate-950">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Lớp phủ màn hình tải bản đồ */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500" />
            <h3 className="text-base font-bold text-slate-100">Đang khởi tạo bản đồ</h3>
            <p className="text-xs text-slate-400 mt-1">Đang kết nối hệ thống VietMap...</p>
          </div>
        </div>
      )}
    </div>
  )
}
