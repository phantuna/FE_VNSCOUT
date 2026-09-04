import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { type Location, type Post } from "@/types"
import { apiFetch } from "@/services/api.service"
import { searchVietMap } from "@/services/location.service"
import { toast } from "@/components/ui/use-toast"
import { removeVietnameseTones } from "@/lib/vietnamese"

const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "d5c2b17037b85fc77c242fa556a290c69134ce87f05f5d4"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const MAP_STYLES = [
  { name: "Bản đồ Vector (Standard)", label: "Mặc định", id: "standard", url: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`, preview: "from-amber-500 to-orange-600" },
  { name: "Bản đồ Sáng (Light)", label: "Sáng", id: "light", url: `https://maps.vietmap.vn/maps/styles/lm/style.json?apikey=${VIETMAP_API_KEY}`, preview: "from-slate-200 to-slate-400 border border-slate-300" },
  { name: "Bản đồ Tối (Dark)", label: "Tối", id: "dark", url: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_API_KEY}`, preview: "from-slate-800 to-slate-950 border border-slate-800" },
  { name: "Ảnh Vệ Tinh (Satellite)", label: "Vệ tinh", id: "satellite", url: `https://maps.vietmap.vn/maps/styles/hm/style.json?apikey=${VIETMAP_API_KEY}`, preview: "from-emerald-800 to-indigo-950" },
]

let cachedLocations: Location[] | null = null
let cachedPosts: Post[] | null = null

export function useMapView() {
  const searchParams = useSearchParams()
  const mapRef = useRef<any>(null)

  const [locations, setLocations] = useState<Location[]>(() => cachedLocations || [])
  const [loadingLocations, setLoadingLocations] = useState(() => !cachedLocations)
  const [allPosts, setAllPosts] = useState<Post[]>(() => cachedPosts || [])
  const [loadingAllPosts, setLoadingAllPosts] = useState(() => !cachedPosts)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [searchResultMarker, setSearchResultMarker] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [selectedProvince, setSelectedProvince] = useState("Tất cả")
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
  const [showSpots, setShowSpots] = useState(true)
  const [showServices, setShowServices] = useState(false)

  const locationsWithRealStats = useMemo(() => {
    const postsByLoc: Record<string, Post[]> = {}
    allPosts.forEach(p => { if (p.location?.id) { postsByLoc[p.location.id] = [...(postsByLoc[p.location.id] || []), p] } })
    return locations.map(loc => {
      const locPosts = postsByLoc[loc.id] || []
      const best = [...locPosts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).find(p => p.photos?.[0]?.imageUrl)
      return { ...loc, postCount: locPosts.length, checkInCount: locPosts.length, coverPhoto: best?.photos?.[0]?.imageUrl || loc.coverPhoto }
    })
  }, [locations, allPosts])

  const locationPosts = useMemo(() => !selectedLocation ? [] : allPosts.filter(p => p.location?.id === selectedLocation.id), [allPosts, selectedLocation])

  useEffect(() => {
    if (cachedLocations) {
      setLocations(cachedLocations)
      setLoadingLocations(false)
    } else {
      apiFetch("/api/locations?size=10000")
        .then(data => {
          const arr = data?.content || data || []
          const filtered = arr.filter((l: any) => l.level === 2)
          cachedLocations = filtered
          setLocations(filtered)
        })
        .catch(console.error)
        .finally(() => setLoadingLocations(false))
    }

    if (cachedPosts) {
      setAllPosts(cachedPosts)
      setLoadingAllPosts(false)
    } else {
      apiFetch("/api/v1/posts/getAll?size=200")
        .then(data => {
          const arr = data?.content || data || []
          cachedPosts = arr
          setAllPosts(arr)
        })
        .catch(console.error)
        .finally(() => setLoadingAllPosts(false))
    }

    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.debug("Auto GPS denied:", err.message)
    )
  }, [])

  useEffect(() => {
    if (locationsWithRealStats.length > 0) {
      const locId = searchParams?.get("location")
      if (locId) {
        const found = locationsWithRealStats.find(l => l.id === locId)
        if (found) {
          setSelectedLocation(found)
        }
      }
    }
  }, [locationsWithRealStats, searchParams])

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchSuggestions([]); return }
    const t = setTimeout(async () => {
      setLoadingSuggestions(true)
      try { setSearchSuggestions(await searchVietMap(searchTerm) || []) }
      catch { }
      finally { setLoadingSuggestions(false) }
    }, 450)
    return () => clearTimeout(t)
  }, [searchTerm])

  const provincesList = useMemo(() => ["Tất cả", ...Array.from(new Set(locationsWithRealStats.map(l => l.province).filter(Boolean) as string[]))], [locationsWithRealStats])
  const categoriesList = useMemo(() => ["Tất cả", ...Array.from(new Set(locationsWithRealStats.map(l => l.category).filter(Boolean) as string[]))], [locationsWithRealStats])

  const filteredAndSortedLocations = useMemo(() => {
    const filtered = locationsWithRealStats.filter(loc => {
      const isService = loc.locationType === "SERVICE"
      if (isService && !showServices) return false
      if (!isService && !showSpots) return false

      const matchCat = selectedCategory === "Tất cả" || loc.category === selectedCategory
      const matchProv = selectedProvince === "Tất cả" || loc.province === selectedProvince
      const q = removeVietnameseTones(searchTerm)
      if (!q) return matchCat && matchProv
      const n = removeVietnameseTones(loc.name)
      const a = loc.address ? removeVietnameseTones(loc.address) : ""
      const p = loc.province ? removeVietnameseTones(loc.province) : ""
      return matchCat && matchProv && (n.includes(q) || a.includes(q) || p.includes(q))
    })
    const withDist = filtered.map(loc => userLocation && loc.latitude && loc.longitude
      ? { ...loc, distance: calculateDistance(userLocation.lat, userLocation.lng, loc.latitude, loc.longitude) }
      : { ...loc, distance: undefined })
    return userLocation ? withDist.sort((a, b) => (a.distance || 0) - (b.distance || 0)) : withDist.sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
  }, [locationsWithRealStats, selectedCategory, selectedProvince, searchTerm, userLocation, showSpots, showServices])

  const cameraStats = useMemo(() => {
    const counts: Record<string, number> = {}; let total = 0
    locationPosts.forEach(p => p.photos?.forEach(ph => { if (ph.cameraModel) { counts[`${ph.cameraMake || ""} ${ph.cameraModel}`.trim()] = (counts[`${ph.cameraMake || ""} ${ph.cameraModel}`.trim()] || 0) + 1; total++ } }))
    return Object.entries(counts).map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) })).sort((a, b) => b.count - a.count).slice(0, 3)
  }, [locationPosts])

  const lensStats = useMemo(() => {
    const counts: Record<string, number> = {}; let total = 0
    locationPosts.forEach(p => p.photos?.forEach(ph => { if (ph.lensModel) { counts[ph.lensModel] = (counts[ph.lensModel] || 0) + 1; total++ } }))
    return Object.entries(counts).map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) })).sort((a, b) => b.count - a.count).slice(0, 3)
  }, [locationPosts])

  const recommendedSettings = useMemo(() => {
    if (!locationPosts.length) return null
    let totalIso = 0, isoCount = 0, totalAp = 0, apCount = 0
    const shutterSpeeds: Record<string, number> = {}; let shutterCount = 0
    locationPosts.forEach(p => p.photos?.forEach(ph => {
      if (ph.iso) { totalIso += ph.iso; isoCount++ }
      if (ph.aperture) { totalAp += ph.aperture; apCount++ }
      if (ph.shutterSpeed) { shutterSpeeds[ph.shutterSpeed] = (shutterSpeeds[ph.shutterSpeed] || 0) + 1; shutterCount++ }
    }))
    return {
      avgIso: isoCount > 0 ? Math.round(totalIso / isoCount) : null,
      avgAperture: apCount > 0 ? (totalAp / apCount).toFixed(1) : null,
      topShutter: Object.entries(shutterSpeeds).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      hasData: isoCount > 0 || apCount > 0 || shutterCount > 0,
    }
  }, [locationPosts])

  const handleMyLocation = () => {
    if (!navigator.geolocation) { toast({ title: "Không hỗ trợ", description: "Trình duyệt của bạn không hỗ trợ định vị." }); return }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(coords); setIsLocating(false)
        setSearchResultMarker({ ...coords, name: "Vị trí hiện tại của bạn" })
        toast({ title: "Định vị thành công", description: "Góc nhìn bản đồ đã được di chuyển về GPS của bạn!" })
      },
      err => { console.error(err); toast({ title: "Lỗi định vị", description: "Không thể xác định vị trí của bạn." }); setIsLocating(false) }
    )
  }

  return {
    mapRef,
    loadingLocations,
    loadingAllPosts,
    selectedLocation,
    setSelectedLocation,
    userLocation,
    isLocating,
    searchTerm,
    setSearchTerm,
    searchSuggestions,
    setSearchSuggestions,
    loadingSuggestions,
    searchResultMarker,
    setSearchResultMarker,
    selectedCategory,
    setSelectedCategory,
    selectedProvince,
    setSelectedProvince,
    sidebarOpen,
    setSidebarOpen,
    selectedStyle,
    setSelectedStyle,
    showSpots,
    setShowSpots,
    showServices,
    setShowServices,
    locationPosts,
    provincesList,
    categoriesList,
    filteredAndSortedLocations,
    cameraStats,
    lensStats,
    recommendedSettings,
    handleMyLocation
  }
}
