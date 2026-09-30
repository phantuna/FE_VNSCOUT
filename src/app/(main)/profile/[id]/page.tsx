"use client"

import { useState, useEffect } from "react"
import { ProfileView } from "@/components/profile/profile-view"
import { apiFetch } from "@/services/api.service"
import { type User, type Post } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { Loader2 } from "lucide-react"
import { use } from "react"

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)

        const userData = await apiFetch(`/users/${id}`)
        const mappedUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatarUrl || "/default-avatar.svg",
          bio: userData.description || userData.bio || "",
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          postsCount: userData.postsCount || 0,
          level: typeof userData.level === "number" ? userData.level : 1,
          reputationScore: userData.reputationScore || 0,
          isFollowing: false,
        }
        setUser(mappedUser)

        const postsUrl = currentUser?.id
          ? `/api/v1/posts/user/${id}?viewerId=${currentUser.id}&page=0&size=50`
          : `/api/v1/posts/user/${id}?page=0&size=50`
        const postsRes = await apiFetch(postsUrl)
        const postsArray = (postsRes as any)?.content || postsRes || []
        setPosts(Array.isArray(postsArray) ? postsArray : [])
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [id, currentUser?.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Không tìm thấy người dùng</p>
      </div>
    )
  }

  return (
    <ProfileView
      user={user}
      posts={posts}
      isOwnProfile={currentUser?.id === id}
      showBackButton
    />
  )
}
