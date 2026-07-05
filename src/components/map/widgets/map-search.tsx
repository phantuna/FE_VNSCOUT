"use client"

import { Loader2, Search, X, MapPin, ChevronLeft, SlidersHorizontal } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useState, useEffect, useRef } from "react"

interface MapSearchBarProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  searchSuggestions: any[]
  loadingSuggestions: boolean
  onSelectSuggestion: (item: any) => void
  selectedCategory: string
  setSelectedCategory: (v: string) => void
  selectedProvince: string
  setSelectedProvince: (v: string) => void
  provincesList: string[]
  categoriesList: string[]
}

export function MapSearchBar({
  searchTerm, setSearchTerm, searchSuggestions, loadingSuggestions, onSelectSuggestion,
  selectedCategory, setSelectedCategory, selectedProvince, setSelectedProvince,
  provincesList, categoriesList,
}: MapSearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Tự động mở dropdown khi có danh sách gợi ý mới
  useEffect(() => {
    if (searchSuggestions.length > 0) {
      setIsOpen(true)
    }
  }, [searchSuggestions])

  // Lắng nghe click ngoài vùng tìm kiếm để ẩn dropdown gợi ý
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* Thanh Tìm Kiếm */}
      <div ref={containerRef} className="relative px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/85 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm địa chỉ, tỉnh thành, tọa độ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (searchSuggestions.length > 0) setIsOpen(true) }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false)
              }
            }}
            className="w-full rounded-xl border border-border bg-background/80 pl-10 pr-9 py-2.5 text-xs text-foreground placeholder-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setIsOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Gợi ý Geocoding */}
        {loadingSuggestions && (
          <div className="absolute left-4 right-4 top-full mt-2 z-30 flex items-center justify-center rounded-xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
            <span className="text-[11px] text-muted-foreground font-medium">Đang tìm địa điểm...</span>
          </div>
        )}
        {!loadingSuggestions && isOpen && searchSuggestions.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 z-30 max-h-60 overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl py-1 divide-y divide-border">
            {searchSuggestions.map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-accent/60 flex items-start gap-2.5 text-foreground hover:text-primary"
                onClick={() => {
                  onSelectSuggestion(item)
                  setIsOpen(false)
                }}
              >
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.display || item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bộ Lọc */}
      <div className="px-4 pb-3 flex flex-col gap-2 border-b border-border">
        <div className="flex items-center justify-between gap-2 bg-muted/40 border border-border rounded-xl px-3 py-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khu vực:</span>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="h-7 w-auto border-none bg-transparent px-2 text-xs font-bold text-primary hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 shadow-none data-[state=open]:bg-muted/50 transition-all">
              <SelectValue placeholder="Chọn khu vực" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl border-border bg-card/95 backdrop-blur-md shadow-xl min-w-[160px]">
              {provincesList.map((prov) => (
                <SelectItem 
                  key={prov} 
                  value={prov}
                  className="cursor-pointer text-xs font-semibold focus:bg-primary/10 focus:text-primary rounded-lg my-0.5 transition-colors"
                >
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 hide-scrollbar">
          <div className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase transition-all duration-200 bg-primary text-primary-foreground shadow-md flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            ĐỊA ĐIỂM GẦN BẠN NHẤT
          </div>
        </div>
      </div>
    </>
  )
}
