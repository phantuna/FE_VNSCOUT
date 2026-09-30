"use client"

import { useState, useEffect } from "react"
import type { User, Post } from "@/types"
import { useFollow } from "@/hooks/use-follow"
import { apiFetch } from "@/services/api.service"

import { ProfileHeader } from "./widgets/profile-header"
import { ProfileTabs } from "./widgets/profile-tabs"

interface ProfileViewProps {
  user: User
  posts: Post[]
  isOwnProfile?: boolean
  showBackButton?: boolean
}

export function ProfileView({
  user: initialUser,
  posts,
  isOwnProfile = false,
  showBackButton = false,
}: ProfileViewProps) {
  const {
    following,
    followersCount,
    followingCount,
    isLoading: isLoadingFollow,
    toggleFollow,
    canFollow,
  } = useFollow({
    profileUserId: initialUser.id,
    initialFollowersCount: initialUser.followersCount,
    initialFollowingCount: initialUser.followingCount,
    initialIsFollowing: initialUser.isFollowing,
  })

  const userPosts = posts.filter((p) => !p.author?.id || p.author.id === initialUser.id || (p as any).userId === initialUser.id)
  const exp = initialUser.reputationScore || 0;
  const currentLevel = (() => {
    if (exp >= 4000) return 6;
    if (exp >= 1500) return 5;
    if (exp >= 500) return 4;
    if (exp >= 200) return 3;
    if (exp >= 50) return 2;
    return 1;
  })();
  
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)

  useEffect(() => {
    if (isOwnProfile) {
      setIsLoadingSaved(true)
      apiFetch(`/api/v1/saved?userId=${initialUser.id}`)
        .then(res => {
          const postsArray = (res as any)?.content || res || []
          setSavedPosts(Array.isArray(postsArray) ? postsArray : [])
        })
        .catch(err => console.error("Failed to fetch saved posts", err))
        .finally(() => setIsLoadingSaved(false))
    }
  }, [isOwnProfile, initialUser.id])

  return (
    <div className="min-h-screen">
      <ProfileHeader
        user={initialUser}
        userPosts={userPosts}
        isOwnProfile={isOwnProfile}
        showBackButton={showBackButton}
        following={following}
        followersCount={followersCount}
        followingCount={followingCount}
        isLoadingFollow={isLoadingFollow}
        canFollow={canFollow}
        toggleFollow={toggleFollow}
        currentLevel={currentLevel}
        exp={exp}
      />
      <ProfileTabs
        userPosts={userPosts}
        savedPosts={savedPosts}
        isLoadingSaved={isLoadingSaved}
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}
