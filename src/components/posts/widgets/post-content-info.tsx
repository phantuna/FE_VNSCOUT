import { Lightbulb, Camera } from "lucide-react"
import { type Photo } from "@/types"

interface PostContentInfoProps {
  caption?: string
  tags?: string[]
  shootingTip?: string
  photo?: Photo
}

export function PostContentInfo({ caption, tags, shootingTip, photo }: PostContentInfoProps) {
  const hasExif = photo && (photo.cameraMake || photo.cameraModel || photo.iso || photo.aperture || photo.shutterSpeed || photo.focalLength)
  const cameraStr = photo ? [photo.cameraMake, photo.cameraModel].filter(Boolean).join(" ") : ""

  return (
    <div className="px-5 py-4 space-y-3 border-b border-slate-100">
      {caption && (
        <p className="text-sm text-slate-800 leading-relaxed">{caption}</p>
      )}
      
      {(tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(tags || []).map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {shootingTip && (
        <div className="flex gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
          <Lightbulb className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-orange-600 mb-0.5">Photo Tip</p>
            <p className="text-xs text-orange-700 leading-relaxed">{shootingTip}</p>
          </div>
        </div>
      )}

      {/* EXIF Data Section */}
      {hasExif && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-3">
          <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Thông số chụp
          </p>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {cameraStr && (
              <div className="col-span-2 flex items-start gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">Máy ảnh:</span>
                <span className="text-xs text-slate-700 font-medium">{cameraStr}</span>
              </div>
            )}
            {photo.lensModel && (
              <div className="col-span-2 flex items-start gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">Ống kính:</span>
                <span className="text-xs text-slate-700 font-medium">{photo.lensModel}</span>
              </div>
            )}
            {photo.aperture && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">Khẩu độ:</span>
                <span className="text-xs text-slate-700 font-mono font-medium">f/{photo.aperture}</span>
              </div>
            )}
            {photo.shutterSpeed && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">Tốc độ:</span>
                <span className="text-xs text-slate-700 font-mono font-medium">{photo.shutterSpeed}s</span>
              </div>
            )}
            {photo.iso && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">ISO:</span>
                <span className="text-xs text-slate-700 font-mono font-medium">{photo.iso}</span>
              </div>
            )}
            {photo.focalLength && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 w-[60px] shrink-0">Tiêu cự:</span>
                <span className="text-xs text-slate-700 font-mono font-medium">{photo.focalLength}mm</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
