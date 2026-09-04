"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { type Post } from "@/types"

interface PostImageGalleryProps {
  post: Post
  activeIndex?: number
  onIndexChange?: (index: number) => void
}

export function PostImageGallery({ post, activeIndex: externalActiveIndex, onIndexChange }: PostImageGalleryProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)
  const activeIndex = externalActiveIndex !== undefined ? externalActiveIndex : internalActiveIndex
  const setActiveIndex = (index: number) => {
    setInternalActiveIndex(index)
    onIndexChange?.(index)
  }

  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null)

  const imageUrls = post.photos?.map(p => p.imageUrl) || []
  const displayCaption = post.caption || ""

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (previewIndex !== null) {
      setPreviewIndex((previewIndex + 1) % imageUrls.length)
    } else {
      setActiveIndex((activeIndex + 1) % imageUrls.length)
    }
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (previewIndex !== null) {
      setPreviewIndex((previewIndex - 1 + imageUrls.length) % imageUrls.length)
    } else {
      setActiveIndex((activeIndex - 1 + imageUrls.length) % imageUrls.length)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (previewIndex === null) return
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "Escape") setPreviewIndex(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [previewIndex, activeIndex])

  // Mobile scroll observer
  useEffect(() => {
    const container = mobileScrollContainerRef.current
    if (!container) return

    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const scrollLeft = container.scrollLeft
        const width = container.clientWidth
        const newIndex = Math.round(scrollLeft / width)
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < imageUrls.length) {
          setActiveIndex(newIndex)
        }
      }, 150) // Debounce scroll event
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [imageUrls.length, activeIndex, setActiveIndex])

  return (
    <>
      {/* ─── Desktop: full-height centered viewer ─── */}
      <div className="hidden md:flex w-full h-full relative group flex-col items-center justify-center">
        {imageUrls.length > 0 && (
          <>
            {/* Main image */}
            <img
              src={imageUrls[activeIndex]}
              alt={displayCaption}
              className="w-full h-full object-contain cursor-zoom-in transition-opacity duration-300"
              onClick={() => setPreviewIndex(activeIndex)}
            />

            {/* Left/Right nav arrows */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </button>

                {/* Thumbnail strip at bottom (on hover) */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {imageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`h-11 w-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeIndex === i ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img src={url} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Dot indicators (hidden on hover) */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 z-10 group-hover:opacity-0 transition-opacity duration-300">
                  {imageUrls.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${activeIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/40"
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ─── Mobile: swipe carousel ─── */}
      <div 
        ref={mobileScrollContainerRef}
        className="flex md:hidden snap-x snap-mandatory overflow-x-auto aspect-[4/3]"
      >
        {imageUrls.map((url, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 snap-center w-full overflow-hidden cursor-pointer"
            onClick={() => setPreviewIndex(i)}
          >
            <img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
            {imageUrls.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                {i + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Fullscreen lightbox ─── */}
      <Dialog open={previewIndex !== null} onOpenChange={open => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-[100vw] h-[100vh] p-0 border-none bg-black/90 backdrop-blur-2xl shadow-none flex items-center justify-center outline-none">
          <DialogTitle className="sr-only">Xem ảnh toàn màn hình</DialogTitle>
          <div
            className="relative w-full h-full flex items-center justify-center cursor-zoom-out"
            onClick={() => setPreviewIndex(null)}
          >
            {imageUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 z-50 bg-white/10 text-white hover:bg-white/25 rounded-full h-12 w-12 backdrop-blur-lg transition-all hover:scale-110"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {previewIndex !== null && (
              <div className="relative max-w-[92vw] max-h-[92vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
                <img
                  src={imageUrls[previewIndex]}
                  alt="Preview"
                  className="max-w-full max-h-[92vh] object-contain rounded-sm shadow-2xl pointer-events-none"
                />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/60 font-medium text-sm">
                  {previewIndex + 1} / {imageUrls.length}
                </div>
              </div>
            )}

            {imageUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="fixed right-4 z-50 bg-white/10 text-white hover:bg-white/25 rounded-full h-12 w-12 backdrop-blur-lg transition-all hover:scale-110"
                onClick={handleNext}
              >
                <ChevronLeft className="h-8 w-8 rotate-180" />
              </Button>
            )}

            {/* Thumbnail strip in lightbox */}
            {imageUrls.length > 1 && (
              <div
                className="fixed bottom-6 left-0 right-0 flex justify-center gap-2 z-50"
                onClick={e => e.stopPropagation()}
              >
                {imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewIndex(i)}
                    className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${previewIndex === i ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img src={url} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
