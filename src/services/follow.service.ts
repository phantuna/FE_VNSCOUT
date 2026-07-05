import { apiFetch } from "@/services/api.service"

export interface FollowStatusResponse {
  following: boolean
  followersCount: number
  followingCount: number
}


export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<FollowStatusResponse> {
  return apiFetch(`/api/v1/follow/${followingId}?followerId=${followerId}`, {
    method: "POST",
  })
}


export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<FollowStatusResponse> {
  return apiFetch(
    `/api/v1/follow/status?followerId=${followerId}&followingId=${followingId}`
  )
}


export async function getFollowCounts(
  userId: string
): Promise<Pick<FollowStatusResponse, "followersCount" | "followingCount">> {
  return apiFetch(`/api/v1/follow/counts/${userId}`)
}
