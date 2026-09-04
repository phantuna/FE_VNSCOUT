"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Loader2, Lightbulb, Camera, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/services/api.service"
import imageCompression from "browser-image-compression"
import { ExifPanel } from "@/components/posts/widgets/exif-panel"
import { PhotoUploader } from "./create-post/photo-uploader"
import { LocationPicker } from "./create-post/location-picker"
import { PostTags } from "./create-post/post-tags"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
const PHOTO_LOCATION_MISMATCH_CODE = 3003

export function CreatePostView() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const displayUser = user || { username: "Guest", avatarUrl: "", level: 1 }

  const [images, setImages] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [content, setContent] = useState("")
  const [photoTip, setPhotoTip] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string; locationType?: string } | null>(null)
  const [locationSearch, setLocationSearch] = useState("")
  const [manualPin, setManualPin] = useState<{lat: number, lng: number} | null>(null)
  
  const [postType, setPostType] = useState<"SPOT" | "SERVICE">("SPOT")

  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmData, setConfirmData] = useState<any>(null)

  useEffect(() => {
    apiFetch("/api/locations?level=2&size=1000", { cache: "no-store" })
      .then(data => setAvailableLocations((data?.content || data) || []))
      .catch(console.error)
  }, [])

  const handleFilesSelected = async (files: FileList) => {
    if (files.length === 0) return
    setIsUploading(true)
    const formData = new FormData()

    try {
      const compressedFiles = await Promise.all(Array.from(files).map(async (file) => {
        // Bỏ qua nếu không phải ảnh hoặc file quá nhỏ (< 500KB)
        if (!file.type.startsWith("image/") || file.size < 500 * 1024) return file;
        
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            preserveExif: true, // Cố gắng giữ lại EXIF
            initialQuality: 0.8
          };
          const compressed = await imageCompression(file, options);
          // Để đảm bảo tên file không bị mất
          return new File([compressed], file.name, { type: compressed.type, lastModified: Date.now() });
        } catch (error) {
          console.error("Compression error:", error);
          return file;
        }
      }));

      compressedFiles.forEach(f => formData.append("files", f))

      const results = await apiFetch("/api/photos/upload", { method: "POST", body: formData })
      setImages(prev => [...prev, ...results])

      const warnings = results.filter((r: any) => r.moderationStatus === "WARNING")
      if (warnings.length > 0) setFormError(`⚠️ ${warnings.length > 1 ? `${warnings.length} ảnh` : "Ảnh"} có nội dung cần xem xét: "${warnings[0].moderationMessage ?? "Nhạy cảm"}". Vẫn có thể đăng.`)

      if (images.length === 0 && results.length > 0) {
        setSelectedIndex(0)
        const photo = results[0]
        if (!selectedLocation && photo?.exifData?.gpsLatitude && photo?.exifData?.gpsLongitude && availableLocations.length > 0) {
          const lat = photo.exifData.gpsLatitude, lng = photo.exifData.gpsLongitude
          let closest = null, min = Infinity
          for (const loc of availableLocations) {
            if (loc.latitude && loc.longitude) {
              const d = Math.hypot(loc.latitude - lat, loc.longitude - lng)
              if (d < min) { min = d; closest = loc }
            }
          }
          // Tăng khoảng cách nhận diện tự động lên 0.05 (~5.5km)
          if (closest && min < 0.05) { 
            setSelectedLocation({ id: closest.id, name: closest.name, locationType: closest.locationType }); 
            setLocationSearch(closest.name);
            // Tự động chuyển tab nếu địa điểm thuộc loại khác
            if (closest.locationType === "SERVICE" || closest.locationType === "SPOT") {
              setPostType(closest.locationType);
            }
          }
        }
      }
    } catch (err: any) {
      setFormError(`Không thể tải ảnh lên: ${err?.data?.message ?? "Ảnh vi phạm nội dung."}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreatePost = async (forceCreate = false) => {
    setFormError(null)
    if (images.length === 0) return setFormError("Vui lòng chọn ít nhất một ảnh trước khi đăng.")
    if (!selectedLocation) { setFormError("Vui lòng chọn địa điểm."); document.getElementById("location-search")?.focus(); return }

    setIsCreatingPost(true)
    const payload = { 
      locationId: selectedLocation.id, 
      caption: content, 
      shootingTip: photoTip, 
      tags, 
      photoIds: images.map(img => img.photoId), 
      forceCreate,
      manualLatitude: manualPin?.lat,
      manualLongitude: manualPin?.lng
    }

    try {
      await apiFetch("/api/v1/posts/created", { method: "POST", body: JSON.stringify(payload) })
      if ((displayUser as any).level < 3) {
        toast({
          title: "Đã gửi bài viết",
          description: "Bài viết của bạn đã được ghi nhận và đang chờ Quản trị viên xét duyệt!",
          variant: "default",
          className: "bg-emerald-500 text-white border-none",
        })
      } else {
        toast({
          title: "Thành công",
          description: "Bài viết của bạn đã được đăng thành công!",
          variant: "default",
          className: "bg-emerald-500 text-white border-none",
        })
      }
      router.push("/")
    } catch (err: any) {
      const errorData = err?.data || err
      if (errorData?.code === PHOTO_LOCATION_MISMATCH_CODE) {
        setConfirmData({ distanceKm: typeof errorData?.result?.distanceMeters === "number" ? (errorData.result.distanceMeters / 1000).toFixed(2) : null, photoProvince: errorData?.result?.photoProvince, payload })
        setShowConfirmDialog(true)
        setIsCreatingPost(false)
        return
      }
      if (errorData?.code === 9000 && Array.isArray(errorData.result)) setFormError(errorData.result.map((e: any) => e.message).join(". "))
      else setFormError(errorData?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setIsCreatingPost(false)
    }
  }

  const currentPhoto = images[selectedIndex]
  const isServiceLocation = selectedLocation?.locationType === "SERVICE"

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 backdrop-blur-md">
        <h2 className="text-lg font-bold text-foreground">Tạo bài đăng</h2>
        <Button size="sm" onClick={() => handleCreatePost(false)} disabled={!content.trim() || !selectedLocation || images.length === 0 || isCreatingPost}>
          {isCreatingPost && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Chia sẻ
        </Button>
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <div className="flex gap-8">
          <PhotoUploader
            images={images} selectedIndex={selectedIndex} isUploading={isUploading}
            setSelectedIndex={setSelectedIndex} onFilesSelected={handleFilesSelected}
            onRemoveImage={idx => setImages(prev => { const n = prev.filter((_, i) => i !== idx); if (selectedIndex >= n.length) setSelectedIndex(Math.max(0, n.length - 1)); return n })}
          />

          <div className="flex-1">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarImage src={displayUser.avatarUrl || "/default-avatar.svg"} /><AvatarFallback>{displayUser.username?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{displayUser.username}</p>
                  {selectedLocation && <p className="flex items-center gap-1 text-xs text-primary"><MapPin className="h-3 w-3" />{selectedLocation.name}</p>}
                </div>
              </div>
            </div>

            <Textarea placeholder="Chia sẻ câu chuyện bức ảnh, trải nghiệm chụp, hoặc mẹo..." value={content} onChange={e => setContent(e.target.value)} className="min-h-[120px] resize-none text-sm" />
            <Separator className="my-5" />

            <div className="mb-5 space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                Bạn muốn đăng loại bài viết nào?
              </label>
              <Tabs value={postType} onValueChange={(v) => {
                setPostType(v as "SPOT" | "SERVICE")
                if (selectedLocation?.locationType !== v) {
                  setSelectedLocation(null)
                  setLocationSearch("")
                }
              }}>
                <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 p-1">
                  <TabsTrigger value="SPOT" className="font-bold text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md flex items-center justify-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Điểm Chụp
                  </TabsTrigger>
                  <TabsTrigger value="SERVICE" className="font-bold text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md flex items-center justify-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Dịch Vụ
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <LocationPicker 
              selectedLocation={selectedLocation} 
              locationSearch={locationSearch} 
              setLocationSearch={setLocationSearch} 
              setSelectedLocation={setSelectedLocation} 
              availableLocations={availableLocations.filter(loc => loc.locationType === postType)} 
              setManualPin={setManualPin}
              onLocationCreated={(newLoc) => {
                setAvailableLocations(prev => [newLoc, ...prev])
                setSelectedLocation({ id: newLoc.id, name: newLoc.name, locationType: newLoc.locationType })
                setLocationSearch(newLoc.name)
                // Tự đổi tab sang loại phù hợp với địa điểm vừa tạo
                if (newLoc.locationType === "SERVICE" || newLoc.locationType === "SPOT") {
                  setPostType(newLoc.locationType)
                }
              }}
              defaultCenter={(() => {
                const imgWithGps = images.find(img => img?.exifData?.gpsLatitude && img?.exifData?.gpsLongitude);
                return imgWithGps 
                  ? { lat: imgWithGps.exifData.gpsLatitude, lng: imgWithGps.exifData.gpsLongitude } 
                  : undefined;
              })()}
            />
            {!isServiceLocation && (
              <PostTags tags={tags} setTags={setTags} tagInput={tagInput} setTagInput={setTagInput} />
            )}

            <div className="mb-3 flex items-start gap-3 rounded-lg p-3 hover:bg-muted">
              <Lightbulb className="mt-0.5 h-5 w-5 text-primary" />
              <Input placeholder={isServiceLocation ? "Chia sẻ đánh giá, trải nghiệm của bạn về dịch vụ này..." : "Chia sẻ kinh nghiệm hoặc mẹo chụp ảnh tại đây..."} value={photoTip} onChange={e => setPhotoTip(e.target.value)} className="flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" />
            </div>

            <Button className="mt-6 w-full h-12 text-base font-bold shadow-lg shadow-primary/20" onClick={() => handleCreatePost(false)} disabled={!content.trim() || !selectedLocation || images.length === 0 || isCreatingPost}>
              {isCreatingPost && <Loader2 className="h-5 w-5 animate-spin mr-2" />} Đăng Bài Viết
            </Button>

            {formError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</div>}
          </div>
        </div>

        {!isServiceLocation && (
          <div className="mt-12">
            <ExifPanel exif={currentPhoto ? { ...currentPhoto.exifData, isLocationVerified: currentPhoto.locationVerified, moderationStatus: currentPhoto.moderationStatus, moderationMessage: currentPhoto.moderationMessage } : undefined} />
          </div>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">⚠️ Xác nhận đăng bài</DialogTitle>
            <DialogDescription className="text-base">
              {confirmData?.photoProvince && <span className="block mb-1">Ảnh được chụp tại: <span className="font-bold text-foreground">{confirmData.photoProvince}</span></span>}
              {confirmData?.distanceKm ? `Khoảng cách tới địa điểm đã chọn: ${confirmData.distanceKm}km.` : "Khoảng cách không thể xác định."}
              <br /><span className="mt-2 block font-medium">Bạn có chắc chắn muốn tiếp tục đăng bài không?</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isCreatingPost}>Hủy</Button>
            <Button onClick={() => {
              setIsCreatingPost(true)
              apiFetch("/api/v1/posts/created", { method: "POST", body: JSON.stringify({ ...confirmData.payload, forceCreate: true }) })
                .then(() => router.push("/"))
                .catch(() => setFormError("Không thể tiếp tục đăng bài. Vui lòng thử lại."))
                .finally(() => { setIsCreatingPost(false); setShowConfirmDialog(false) })
            }} disabled={isCreatingPost} className="bg-red-500 hover:bg-red-600 text-white">
              {isCreatingPost && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Đăng bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
