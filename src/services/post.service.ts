import { apiFetch } from "@/services/api.service"
import type { Post, Comment } from "@/types"


export async function getAllPosts(): Promise<Post[]> {
  const res = await apiFetch("/api/v1/posts/getAll")
  return res?.content || res || []
}

export async function getPostById(postId: string): Promise<Post> {
  return apiFetch(`/api/v1/posts/${postId}`)
}

export async function createPost(body: Record<string, unknown>): Promise<Post> {
  return apiFetch("/api/v1/posts/created", {
    method: "POST",
    body: JSON.stringify(body),
  })
}


export interface LikeToggleResponse {
  liked: boolean
  likeCount: number
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<LikeToggleResponse> {
  return apiFetch(`/api/v1/posts/${postId}/like?userId=${userId}`, {
    method: "POST",
  })
}

export async function toggleSave(
  postId: string,
  userId: string
): Promise<boolean> {
  return apiFetch(`/api/v1/saved/${postId}?userId=${userId}`, {
    method: "POST",
  })
}


export async function getCommentsByPost(
  postId: string,
  page = 0,
  size = 10
): Promise<{ content: Comment[]; totalElements: number }> {
  return apiFetch(`/api/v1/comments/post/${postId}?page=${page}&size=${size}`)
}

export async function createComment(body: {
  postId: string
  content: string
  userId: string
  parentCommentId?: string
}): Promise<Comment> {
  return apiFetch("/api/v1/comments", {
    method: "POST",
    body: JSON.stringify(body),
  })
}


export async function uploadPhotos(formData: FormData): Promise<unknown[]> {
  return apiFetch("/api/photos/upload", {
    method: "POST",
    body: formData,
  })
}
