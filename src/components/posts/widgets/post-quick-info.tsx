"use client"

import { useMemo } from "react"
import { MapPin, Info, Clock, Camera, Phone, Globe, ExternalLink, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { type Post } from "@/types"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { calculateSolarTimes } from "@/lib/solar-calculator"

interface PostInfoHeaderProps {
  post: Post
}

export function PostInfoHeader({ post }: PostInfoHeaderProps) {
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)
      showSuccessToast("Đã sao chép", "Liên kết bài viết đã được lưu vào khay nhớ tạm.")
    } catch (error) {
      showErrorToast("Lỗi", "Không thể chia sẻ liên kết.")
    }
  }

  const solarTimes = useMemo(() => {
    if (!post.location?.latitude || !post.location?.longitude) return null
    return calculateSolarTimes(Number(post.location.latitude), Number(post.location.longitude))
  }, [post.location?.latitude, post.location?.longitude])

  const currentHour = useMemo(() => new Date().getHours(), [])

  return (
    <>
      <section className="rounded-[2.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        <h3 className="text-lg font-black text-slate-900 mb-6">Thông tin nhanh</h3>
        <div className="space-y-5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4" /><span>Khu vực</span>
            </div>
            <span className="text-right font-bold text-slate-700">{post.location?.province || "Đang cập nhật"}</span>
          </div>
          {post.location?.category && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Info className="h-4 w-4" /><span>Loại hình</span>
              </div>
              <span className="text-right font-bold text-slate-700">{post.location.category}</span>
            </div>
          )}
          {(!post.location?.locationType || post.location?.locationType === "SPOT") && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" /><span>Giờ vàng {currentHour < 12 ? "Sáng" : "Chiều"}</span>
              </div>
              <span className="text-right font-bold text-slate-700">
                {solarTimes ? (currentHour < 12 ? `${solarTimes.sunrise} SA` : `${solarTimes.sunset} CH`) : "Đang cập nhật"}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Camera className="h-4 w-4" /><span>Tương tác</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">
              {post.location?.checkInCount || 0} check-ins
            </Badge>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {post.location && (
            <Link href={`/map?location=${post.location.id}`} className="block w-full">
              <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95">
                <ExternalLink className="h-4 w-4" />Mở bản đồ
              </Button>
            </Link>
          )}
          <Button onClick={handleShare} variant="outline" className="w-full h-12 rounded-2xl border-slate-200 font-bold gap-2 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95">
            <Share2 className="h-4 w-4" />Chia sẻ địa điểm
          </Button>
        </div>
      </section>


    </>
  )
}
