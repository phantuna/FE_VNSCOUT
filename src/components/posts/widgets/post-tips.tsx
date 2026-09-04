"use client"

import { Lightbulb, Camera } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExifPanel } from "./exif-panel"
import { type Post } from "@/types"

interface PostTipsExifProps {
  post: Post
}

export function PostTipsExif({ post }: PostTipsExifProps) {
  const [showExif, setShowExif] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  
  const isService = post.location?.locationType === "SERVICE"
  const activePhoto = post.photos?.[activePhotoIndex]

  return (
    <>
      {/* EXIF */}
      {!isService && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />Thông số kỹ thuật
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowExif(!showExif)} 
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
            >
              {showExif ? "Ẩn bớt" : "Xem chi tiết"}
            </Button>
          </div>
          {showExif && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
              {post.photos && post.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
                  {post.photos.map((photo, idx) => (
                    <img 
                      key={photo.id || idx}
                      src={photo.imageUrl}
                      alt={`Photo ${idx+1}`}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`h-12 w-12 object-cover rounded-md cursor-pointer border-2 transition-all shrink-0 ${
                        activePhotoIndex === idx ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              )}
              <ExifPanel exif={activePhoto} />
            </div>
          )}
        </section>
      )}
    </>
  )
}
