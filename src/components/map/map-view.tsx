"use client"

import { useRouter } from "next/navigation"
import { Layers, Navigation, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Map as MapIcon, Sun, Camera, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { VietMapView } from "./map-core"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { MapSearchBar } from "./widgets/map-search"
import { MapLocationSidebar } from "./widgets/map-sidebar"
import { MapLocationPopup } from "./modals/map-popup"
import { useMapView, MAP_STYLES } from "@/hooks/use-map-view"

export function MapView() {
  const router = useRouter()
  const {
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
  } = useMapView()

  return (
    <div className="relative flex h-screen w-full bg-background overflow-hidden text-foreground font-sans">
      {/* Bản đồ chính */}
      <div className="absolute inset-0 z-0">
        <VietMapView
          mapInstanceRef={mapRef}
          onSelectLocation={setSelectedLocation}
          onMapClick={() => {
            setSelectedLocation(null)
            setSidebarOpen(false)
          }}
          selectedLocationId={selectedLocation?.id}
          flyToLocation={userLocation}
          styleUrl={selectedStyle.url}
          locations={filteredAndSortedLocations}
          searchResult={searchResultMarker}
          showSpots={showSpots}
          showServices={showServices}
          locationPosts={selectedLocation ? locationPosts : []}
        />
      </div>

      {/* Top Center Controls: Layer Toggle SPOT / SERVICE */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex bg-card/60 backdrop-blur-xl shadow-lg rounded-full border border-border/50 p-1.5 gap-1.5">
        <button
          onClick={() => setShowSpots(s => !s)}
          title="Hiện/ẩn địa điểm du lịch"
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
            showSpots
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Điểm chụp</span>
        </button>
        <button
          onClick={() => setShowServices(s => !s)}
          title="Hiện/ẩn dịch vụ lân cận"
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
            showServices
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Dịch vụ</span>
        </button>
      </div>

      {/* Controls nổi phải */}
      <div className="absolute right-6 bottom-8 z-10 flex flex-col gap-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl">
              <Layers className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" align="end" className="w-64 border border-border bg-card/95 backdrop-blur-md p-3.5 shadow-2xl rounded-2xl z-50">
            <h4 className="text-xs font-bold text-muted-foreground mb-2.5 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Lớp Bản Đồ</h4>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style)} className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${style.id === selectedStyle.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground"}`}>
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-tr ${style.preview} mb-2 shadow-inner`} />
                  <span className="text-[10px] font-bold line-clamp-1">{style.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex flex-col rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => mapRef.current?.zoomTo(mapRef.current.getZoom() + 1, { duration: 300 })} className="h-11 w-11 rounded-none border-b border-border"><ZoomIn className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => mapRef.current?.zoomTo(mapRef.current.getZoom() - 1, { duration: 300 })} className="h-11 w-11 rounded-none"><ZoomOut className="h-5 w-5" /></Button>
        </div>

        <Button variant="outline" size="icon" onClick={handleMyLocation} disabled={isLocating} className={`h-11 w-11 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xl ${isLocating ? "animate-pulse border-primary/40" : ""}`}>
          {isLocating ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Navigation className="h-5 w-5" />}
        </Button>
      </div>

      {/* Left Sidebar */}
      <div className={`absolute left-6 top-6 bottom-6 z-20 flex w-[380px] flex-col rounded-2xl border border-white/10 dark:border-white/5 bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]"}`}>
        {selectedLocation ? (
          <MapLocationPopup
            location={selectedLocation}
            locationPosts={locationPosts}
            loadingPosts={loadingAllPosts}
            cameraStats={cameraStats}
            lensStats={lensStats}
            recommendedSettings={recommendedSettings}
            onClose={() => setSelectedLocation(null)}
            onGetDirections={loc => {
              const dest = (loc.latitude && loc.longitude)
                ? `${loc.latitude},${loc.longitude}`
                : encodeURIComponent(loc.address || loc.name || "");
              const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : "";
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}${origin}`, "_blank");
            }}
            onShare={loc => { navigator.clipboard.writeText(`${window.location.origin}/location/${loc.id}`); toast({ title: "Đã sao chép liên kết", description: `Đã lưu liên kết địa điểm "${loc.name}"!` }) }}
            onViewFeed={loc => router.push(`/location/${loc.id}`)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary/10 p-2 text-primary shadow-sm"><MapIcon className="h-4 w-4" /></div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-wide text-primary">VPS SPOT MAP</h2>
                  <p className="text-[10px] font-semibold text-muted-foreground">Tìm góc chụp tuyệt nhất Việt Nam</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <MapSearchBar
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              searchSuggestions={searchSuggestions} loadingSuggestions={loadingSuggestions}
              onSelectSuggestion={item => {
                const lat = Number(item.lat ?? item.latitude)
                const lng = Number(item.lng ?? item.lon ?? item.longitude)
                if (!isNaN(lat) && !isNaN(lng)) {
                  setSearchResultMarker({
                    lat,
                    lng,
                    name: item.display || item.name || "Địa điểm tìm kiếm"
                  })
                }
                setSearchTerm("")
                setSearchSuggestions([])
              }}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince}
              provincesList={provincesList} categoriesList={categoriesList}
            />

            <MapLocationSidebar
              locations={filteredAndSortedLocations}
              loading={loadingLocations || loadingAllPosts}
              userLocation={userLocation}
              selectedLocationId={selectedLocation?.id}
              onSelect={setSelectedLocation}
            />
          </>
        )}
      </div>

      {/* Toggle button when sidebar hidden */}
      {!sidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="absolute left-6 top-6 z-20 h-11 w-11 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-2xl text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
