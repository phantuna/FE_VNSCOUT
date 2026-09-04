"use client"

import { Share2, MoreHorizontal, Pencil, Trash2, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface PostActionMenuProps {
  isOwner: boolean
  /** Size variant: 'sm' cho author row, 'md' cho topbar */
  size?: "sm" | "md"
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}

/**
 * Menu hành động cho bài viết:
 * - Nếu là tác giả: Chia sẻ + (Sửa / Xoá)
 * - Nếu không phải tác giả: Chia sẻ + Báo cáo vi phạm
 *
 * Dùng ở author row trong trang chi tiết bài viết.
 */
export function PostActionMenu({
  isOwner,
  size = "sm",
  onShare,
  onEdit,
  onDelete,
  onReport,
}: PostActionMenuProps) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-4 w-4"
  const btnSize = size === "md" ? "h-9 w-9" : "h-8 w-8"

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Nút chia sẻ */}
      <Button
        variant="ghost"
        size="icon"
        className={`${btnSize} rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100`}
        onClick={onShare}
        title="Chia sẻ"
      >
        <Share2 className={iconSize} />
      </Button>

      {/* Dropdown: Sửa/Xoá (owner) hoặc Báo cáo (người khác) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`${btnSize} rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 outline-none`}
            title="Tùy chọn"
          >
            <MoreHorizontal className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwner ? (
            <>
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" /> Sửa bài viết
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xoá bài viết
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={onReport}
              className="cursor-pointer text-rose-500 focus:text-rose-500"
            >
              <Flag className="mr-2 h-4 w-4" /> Báo cáo vi phạm
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
