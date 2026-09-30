"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, Loader2, Lightbulb, Camera, Building2, Sparkles, SlidersHorizontal, Globe, Users, Lock, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
  const searchParams = useSearchParams()
  const initialLocationId = searchParams.get("locationId")
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
  const [suggestedLocation, setSuggestedLocation] = useState<{ id: string; name: string; locationType?: string; distanceKm?: number } | null>(null)
  const [locationSearch, setLocationSearch] = useState("")
  const [manualPin, setManualPin] = useState<{lat: number, lng: number} | null>(null)
  
  const [postType, setPostType] = useState<"SPOT" | "SERVICE">("SPOT")

  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmData, setConfirmData] = useState<any>(null)
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE">("PUBLIC")

  useEffect(() => {
    apiFetch("/api/locations?level=2&size=1000", { cache: "no-store" })
      .then(data => setAvailableLocations((data?.content || data) || []))
      .catch(console.error)
  }, [])

  // Tự động nhận diện nếu có param locationId từ URL (ví dụ bấm từ Map hoặc Location detail)
  useEffect(() => {
    if (initialLocationId && availableLocations.length > 0 && !selectedLocation) {
      const found = availableLocations.find(l => l.id === initialLocationId)
      if (found) {
        setSelectedLocation({ id: found.id, name: found.name, locationType: found.locationType })
        setLocationSearch(found.name)
        if (found.locationType === "SERVICE" || found.locationType === "SPOT") {
          setPostType(found.locationType)
        }
      }
    }
  }, [initialLocationId, availableLocations, selectedLocation])

  // Tự động quét toạ độ GPS từ ảnh và gợi ý/chọn ngay địa điểm gần nhất
  useEffect(() => {
    if (selectedLocation) return
    const imgWithGps = images.find(img => img?.exifData?.gpsLatitude && img?.exifData?.gpsLongitude)
    if (!imgWithGps || availableLocations.length === 0) return

    const lat = imgWithGps.exifData.gpsLatitude
    const lng = imgWithGps.exifData.gpsLongitude
    let closest: any = null
    let minD = Infinity
    for (const loc of availableLocations) {
      if (loc.latitude && loc.longitude) {
        const d = Math.hypot(loc.latitude - lat, loc.longitude - lng)
        if (d < minD) {
          minD = d
          closest = loc
        }
      }
    }

    if (closest) {
      const distanceKm = +(minD * 111).toFixed(1)
      setSuggestedLocation({
        id: closest.id,
        name: closest.name,
        locationType: closest.locationType,
        distanceKm
      })

      // Nếu rất gần (< 5km ~ 0.045 độ), tự chọn luôn nếu người dùng chưa chọn
      if (minD < 0.045 && !selectedLocation) {
        setSelectedLocation({ id: closest.id, name: closest.name, locationType: closest.locationType })
        setLocationSearch(closest.name)
        if (closest.locationType === "SERVICE" || closest.locationType === "SPOT") {
          setPostType(closest.locationType)
        }
        toast({
          title: "Đã tự động nhận diện địa điểm",
          description: `Vị trí ảnh khớp với "${closest.name}" (~${distanceKm}km).`,
        })
      }
    }
  }, [images, availableLocations, selectedLocation, toast])

  // Trích xuất thương hiệu/model máy ảnh từ EXIF để làm thẻ tag gợi ý 1 chạm
  const exifSuggestedTags = useMemo(() => {
    const list: string[] = []
    images.forEach(img => {
      const exif = img?.exifData
      if (!exif) return
      if (exif.cameraMake) {
        const make = exif.cameraMake.trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, "")
        if (make && !list.includes(make)) list.push(make)
      }
      if (exif.cameraModel) {
        const modelWords = exif.cameraModel.trim().split(" ")
        const mainModel = modelWords[modelWords.length - 1].replace(/[^a-zA-Z0-9]/g, "")
        if (mainModel && mainModel.length >= 2 && !list.includes(mainModel)) list.push(mainModel)
      }
    })
    return list
  }, [images])

  const handleFilesSelected = async (files: FileList) => {
    if (files.length === 0) return
    setIsUploading(true)
    const formData = new FormData()

    try {
      const compressedFiles = await Promise.all(Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/") || file.size < 500 * 1024) return file;
        
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            preserveExif: true,
            initialQuality: 0.8
          };
          const compressed = await imageCompression(file, options);
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
      manualLongitude: manualPin?.lng,
      visibility,
    }

    try {
      const newPost = await apiFetch("/api/v1/posts/created", { method: "POST", body: JSON.stringify(payload) })

      if (newPost?.status === "PENDING_REVIEW") {
        // Phân loại lý do để thông báo phù hợp
        if (newPost?.pendingReason === "NO_GPS") {
          toast({
            title: "⏳ Bài đang chờ duyệt",
            description: "Một hoặc nhiều ảnh của bạn không có dữ liệu GPS. Admin sẽ xác minh vị trí trước khi duyệt.",
            variant: "default",
            className: "bg-amber-500 text-white border-none",
          })
        } else {
          // LOW_LEVEL hoặc lý do khác
          toast({
            title: "📋 Bài đã gửi – chờ duyệt",
            description: "Bài viết đang chờ Quản trị viên xét duyệt. Bạn sẽ nhận thông báo khi được duyệt.",
            variant: "default",
            className: "bg-emerald-500 text-white border-none",
          })
        }
      } else {
        toast({
          title: "✅ Đã đăng thành công!",
          description: "Bài viết của bạn đã được đăng.",
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


  const handleInsertExifSpecs = () => {
    if (!currentPhoto?.exifData) return
    const { cameraMake, cameraModel, lensModel, aperture, shutterSpeed, iso, focalLength } = currentPhoto.exifData
    const parts: string[] = []
    const cam = [cameraMake, cameraModel].filter(Boolean).join(" ")
    if (cam) parts.push(`📷 ${cam}`)
    if (lensModel) parts.push(`🔍 ${lensModel}`)
    const settings = [
      focalLength ? `${focalLength}mm` : null,
      aperture ? `f/${aperture}` : null,
      shutterSpeed ? `${shutterSpeed}s` : null,
      iso ? `ISO ${iso}` : null
    ].filter(Boolean).join(" • ")
    if (settings) parts.push(`⚙️ ${settings}`)

    const generated = parts.join(" | ")
    if (generated) {
      setPhotoTip(prev => prev ? `${prev} — ${generated}` : generated)
      toast({
        title: "Đã chèn thông số chụp",
        description: generated,
      })
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
                <Avatar className="h-10 w-10 border border-border"><AvatarImage src={displayUser.avatarUrl || "/default-avatar.svg"} /><AvatarFallback>{displayUser.username?.charAt(0)}</AvatarFallback></Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{displayUser.username}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-white dark:bg-card px-2.5 py-0.5 text-xs font-medium text-foreground hover:border-primary transition-all shadow-sm"
                        >
                          {visibility === "PUBLIC" && <Globe className="h-3 w-3 text-primary" />}
                          {visibility === "FOLLOWERS_ONLY" && <Users className="h-3 w-3 text-primary" />}
                          {visibility === "PRIVATE" && <Lock className="h-3 w-3 text-primary" />}
                          <span>
                            {visibility === "PUBLIC" && "Công khai"}
                            {visibility === "FOLLOWERS_ONLY" && "Bạn bè"}
                            {visibility === "PRIVATE" && "Riêng tư"}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 rounded-xl border border-border bg-white dark:bg-card p-1 shadow-md">
                        <DropdownMenuItem
                          onClick={() => setVisibility("PUBLIC")}
                          className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${visibility === "PUBLIC" ? "bg-muted font-semibold" : ""}`}
                        >
                          <Globe className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Công khai</p>
                            <p className="text-[11px] text-muted-foreground">Mọi người đều có thể thấy</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setVisibility("FOLLOWERS_ONLY")}
                          className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${visibility === "FOLLOWERS_ONLY" ? "bg-muted font-semibold" : ""}`}
                        >
                          <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Bạn bè</p>
                            <p className="text-[11px] text-muted-foreground">Chỉ người theo dõi 2 chiều</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setVisibility("PRIVATE")}
                          className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${visibility === "PRIVATE" ? "bg-muted font-semibold" : ""}`}
                        >
                          <Lock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Riêng tư</p>
                            <p className="text-[11px] text-muted-foreground">Chỉ mình tôi (không cần duyệt)</p>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
              suggestedLocation={suggestedLocation}
              setManualPin={setManualPin}
              postType={postType}
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
              <PostTags
                tags={tags}
                setTags={setTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                extraSuggestions={exifSuggestedTags}
              />
            )}

            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  {isServiceLocation ? "Đánh giá & Trải nghiệm dịch vụ" : "Mẹo chụp & Thông số kỹ thuật"}
                </span>
                {!isServiceLocation && currentPhoto?.exifData && (currentPhoto.exifData.cameraModel || currentPhoto.exifData.aperture) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1 font-medium cursor-pointer"
                    onClick={handleInsertExifSpecs}
                  >
                    <SlidersHorizontal className="h-3 w-3" /> Chèn thông số từ ảnh (1 chạm)
                  </Button>
                )}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-input p-2.5 bg-background focus-within:ring-1 focus-within:ring-primary">
                <Input
                  placeholder={isServiceLocation ? "Chia sẻ đánh giá, giá cả hoặc trải nghiệm dịch vụ..." : "Nhập mẹo góc chụp, thời gian đẹp, hoặc bấm chèn thông số tự động..."}
                  value={photoTip}
                  onChange={e => setPhotoTip(e.target.value)}
                  className="flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
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
