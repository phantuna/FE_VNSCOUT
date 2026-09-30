import { Suspense } from "react"
import { CreatePostView } from "@/components/posts/create-post-view"

export default function CreatePostPage() {
  return (
    <Suspense fallback={null}>
      <CreatePostView />
    </Suspense>
  )
}
