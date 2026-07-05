"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { useRouter } from "next/navigation"
import {
  toggleFollow as apiToggleFollow,
  getFollowStatus,
  getFollowCounts,
} from "@/services/follow.service"

interface UseFollowOptions {
  profileUserId: string
  initialFollowersCount?: number
  initialFollowingCount?: number
  initialIsFollowing?: boolean
}

interface UseFollowReturn {
  following: boolean
  followersCount: number
  followingCount: number
  isLoading: boolean
  toggleFollow: () => Promise<void>
  canFollow: boolean
}


export function useFollow({
  profileUserId,
  initialFollowersCount = 0,
  initialFollowingCount = 0,
  initialIsFollowing = false,
}: UseFollowOptions): UseFollowReturn {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [following, setFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [followingCount, setFollowingCount] = useState(initialFollowingCount)
  const [isLoading, setIsLoading] = useState(false)

  const isOwnProfile = currentUser?.id === profileUserId
  const canFollow = !!currentUser && !isOwnProfile

  useEffect(() => {
    if (!profileUserId) return

    const fetchStatus = async () => {
      try {
        const counts = await getFollowCounts(profileUserId)
        setFollowersCount(counts.followersCount)
        setFollowingCount(counts.followingCount)

        if (currentUser && !isOwnProfile) {
          const status = await getFollowStatus(currentUser.id, profileUserId)
          setFollowing(status.following)
          setFollowersCount(status.followersCount)
        }
      } catch (error) {
        console.error("[useFollow] Failed to fetch follow status:", error)
      }
    }

    fetchStatus()
  }, [currentUser, profileUserId, isOwnProfile])

  const toggleFollow = useCallback(async () => {
    if (!currentUser) {
      showLoginRequiredToast(router)
      return
    }

    if (isLoading || isOwnProfile) return
    setIsLoading(true)
    const prevFollowing = following
    const prevFollowersCount = followersCount
    setFollowing(!following)
    setFollowersCount((c) => (!following ? c + 1 : Math.max(0, c - 1)))

    try {
      const result = await apiToggleFollow(currentUser.id, profileUserId)
      setFollowing(result.following)
      setFollowersCount(result.followersCount)
    } catch (error: any) {
      setFollowing(prevFollowing)
      setFollowersCount(prevFollowersCount)
      console.error("[useFollow] toggleFollow failed:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, profileUserId, isLoading, isOwnProfile, following, followersCount, toast])

  return {
    following,
    followersCount,
    followingCount,
    isLoading,
    toggleFollow,
    canFollow,
  }
}
