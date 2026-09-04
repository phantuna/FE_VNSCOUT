import Link from "next/link"
import { MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostActionMenu } from "./post-action-menu"
import { type User, type Location } from "@/types"

interface PostAuthorHeaderProps {
  author: User
  location?: Location
  isOwner: boolean
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}

export function PostAuthorHeader({
  author,
  location,
  isOwner,
  onShare,
  onEdit,
  onDelete,
  onReport
}: PostAuthorHeaderProps) {
  const locName = location?.nameWithType?.trim() ?? ""
  const locProv = location?.province?.trim() ?? ""
  const displayAddress = location?.address || [locName, locProv].filter(Boolean).join(", ") || ""

  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
      <Link href={`/profile/${author.id}`}>
        <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-1 shrink-0">
          <AvatarImage src={author.avatarUrl || "/default-avatar.svg"} />
          <AvatarFallback>{author.username?.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${author.id}`} className="hover:underline">
          <p className="font-bold text-slate-900 text-sm truncate">{author.username}</p>
        </Link>
        {displayAddress && (
          <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {displayAddress}
          </p>
        )}
      </div>
      <PostActionMenu
        isOwner={isOwner}
        onShare={onShare}
        onEdit={onEdit}
        onDelete={onDelete}
        onReport={onReport}
      />
    </div>
  )
}
