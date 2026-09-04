"use client"


import { type Post } from "@/types"
import { PostImageGallery } from "./post-image-gallery"
import { PostHeaderActions } from "./post-header"
import { PostAuthorSection } from "./post-author"
import { PostTipsExif } from "./post-tips"

interface PostGalleryProps {
  post: Post
  liked: boolean
  saved: boolean
  isLiking: boolean
  isSavingPost: boolean
  onToggleLike: () => void
  onToggleSave: () => void
}

export function PostGallery({ 
  post, 
  liked, 
  saved, 
  isLiking, 
  isSavingPost, 
  onToggleLike, 
  onToggleSave 
}: PostGalleryProps) {
  return (
    <>
      <PostImageGallery post={post} />
      <PostHeaderActions 
        post={post}
        liked={liked}
        saved={saved}
        isLiking={isLiking}
        isSavingPost={isSavingPost}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
      />
      {/* <PostAuthorSection post={post} /> */}
      <PostTipsExif post={post} />
    </>
  )
}
