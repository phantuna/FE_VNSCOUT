import { PostsFeedView } from "@/components/posts/posts-feed-view"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải...</div>}>
      <PostsFeedView />
    </Suspense>
  )
}
