"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, ImagePlus, ChevronLeft, ChevronRight, X, Loader2, MapPinOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoUploadResponse {
  photoId: string
  imageUrl: string
  exifData?: any
  locationVerified?: boolean
  moderationStatus?: string
  moderationMessage?: string
}

interface PhotoUploaderProps {
  images: PhotoUploadResponse[]
  selectedIndex: number
  isUploading: boolean
  setSelectedIndex: (i: number) => void
  onFilesSelected: (files: FileList) => void
  onRemoveImage: (index: number) => void
}

export function PhotoUploader({
  images, selectedIndex, isUploading, setSelectedIndex, onFilesSelected, onRemoveImage,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files)
  }

  return (
    <div className="w-1/2 space-y-6">
      <input type="file" ref={fileInputRef} onChange={e => e.target.files && onFilesSelected(e.target.files)} multiple accept="image/*" className="hidden" />

      {images.length > 0 ? (
        <div className="space-y-4">
          {/* Main Preview */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
            <Image src={images[selectedIndex].imageUrl} alt="Preview" fill className="object-cover" />

            {/* Warning overlay nếu ảnh đang xem thiếu GPS */}
            {!images[selectedIndex]?.exifData?.gpsLatitude && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm px-3 py-2">
                <MapPinOff className="h-4 w-4 text-white shrink-0" />
                <span className="text-xs font-semibold text-white leading-tight">Ảnh thiếu GPS — bài sẽ chờ admin duyệt vị trí</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <Button size="icon" variant="ghost" onClick={() => setSelectedIndex((selectedIndex - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ảnh ({images.length}/10)</span>
              <span className="text-[10px] text-muted-foreground italic">Nhấp để xem chi tiết</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((photo, i) => (
                <div
                  key={i}
                  className={cn("group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300",
                    i === selectedIndex ? "border-primary scale-105 shadow-md ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105")}
                  onClick={() => setSelectedIndex(i)}
                >
                  <Image src={photo.imageUrl} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                  {/* GPS missing badge */}
                  {!photo?.exifData?.gpsLatitude && (
                    <div className="absolute top-1 left-1 rounded-full bg-amber-500 p-0.5 shadow" title="Thiếu GPS">
                      <MapPinOff className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onRemoveImage(i) }}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted">
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                </button>
              )}
            </div>
          </div>

          {/* Banner tổng hợp nếu có ảnh thiếu GPS */}
          {images.some(img => !img?.exifData?.gpsLatitude) && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Một số ảnh thiếu dữ liệu GPS</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Ảnh không có GPS cần được Admin xác minh vị trí trước khi hiển thị công khai. Bài viết sẽ vào hàng chờ duyệt.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn("flex aspect-square w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
            isDragging ? "border-primary bg-primary/5 scale-[0.98]" : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted hover:shadow-inner")}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-14 w-14 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center"><Upload className="h-6 w-6 text-primary/50" /></div>
              </div>
              <p className="text-sm font-bold text-primary animate-pulse">Đang trích xuất dữ liệu EXIF...</p>
            </div>
          ) : (
            <>
              <div className={cn("rounded-2xl p-6 transition-all duration-500 group-hover:scale-110", isDragging ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                <Upload className="h-10 w-10" strokeWidth={2} />
              </div>
              <div className="mt-6 text-center px-8">
                <p className="text-lg font-bold text-foreground">{isDragging ? "Thả ảnh vào đây" : "Kéo hoặc chọn ảnh"}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Hỗ trợ tối đa 10 ảnh chất lượng cao. Thông số kĩ thuật (EXIF) sẽ được tự động nhận diện.</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
