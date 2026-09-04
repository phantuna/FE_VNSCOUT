"use client"

import { useState } from "react"
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react"
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
}

export function LocationPicker({ selectedLocation, locationSearch, setLocationSearch, setSelectedLocation, availableLocations, setManualPin, onLocationCreated, defaultCenter }: LocationPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)

  const filtered = availableLocations.filter(loc =>
    locationSearch === "" ||
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.province?.toLowerCase().includes(locationSearch.toLowerCase())
  )

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Địa Điểm</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location-search"
            placeholder="Tìm địa điểm..."
            value={locationSearch}
            onChange={e => { setLocationSearch(e.target.value); setShowPicker(true) }}
            onFocus={() => setShowPicker(true)}
            className="pl-9 text-sm border-primary/30 focus-visible:ring-primary/30"
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs font-semibold" onClick={() => setShowMapModal(true)}>
          <MapPin className="h-3.5 w-3.5" />
          Bản đồ
        </Button>
      </div>

      {selectedLocation && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary font-semibold">
            <MapPin className="h-3 w-3" />
            {selectedLocation.name}
            <button type="button" onClick={() => { setSelectedLocation(null); setLocationSearch("") }} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {showPicker && (
        <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {filtered.map(loc => (
            <button key={loc.id} type="button" onClick={() => { setSelectedLocation({ id: loc.id, name: loc.name, locationType: loc.locationType }); setLocationSearch(loc.name); setShowPicker(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted border-b border-border/50 last:border-b-0">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">{loc.name}</p>
                {loc.province && <p className="text-xs text-muted-foreground">Việt Nam / {loc.province}{loc.nameWithType ? ` / ${loc.name}` : ""}</p>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground italic">Không tìm thấy địa điểm phù hợp</div>}
        </div>
      )}

      {showMapModal && (
        <LocationMapPickerModal 
          open={showMapModal} 
          onOpenChange={setShowMapModal} 
          availableLocations={availableLocations} 
          defaultCenter={defaultCenter}
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
