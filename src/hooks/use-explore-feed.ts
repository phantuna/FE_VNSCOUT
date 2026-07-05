import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { apiFetch } from "@/services/api.service"
import { useToast } from "@/hooks/use-toast"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { type Post, type User } from "@/types"
import { parseUTCDate } from "@/utils/date"

export interface TagItem {
  id: string
  name: string
  postCount?: number
}

export function useExploreFeed() {
  const [activeTab, setActiveTab] = useState<"photos" | "photographers" | "tags">("photos")
  const [searchQuery, setSearchQuery] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)

  // Hydrate state from sessionStorage on mount to avoid Next.js Hydration Mismatch
  useEffect(() => {
    const savedPosts = sessionStorage.getItem("explore_posts")
    const savedUsers = sessionStorage.getItem("explore_users")
    const savedTags = sessionStorage.getItem("explore_tags")

    if (savedPosts) {
      const parsed = JSON.parse(savedPosts)
      setPosts(Array.isArray(parsed) ? parsed : (parsed?.content || []))
    }
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }
    if (savedTags) {
      setTags(JSON.parse(savedTags))
    }
    if (savedPosts) {
      setLoading(false)
    }
  }, [])
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<string | null>(null)
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set())

  const [validLocationIds, setValidLocationIds] = useState<Set<string>>(new Set())

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [visibleExplorePostsCount, setVisibleExplorePostsCount] = useState(20)

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchData() {
      const hasCache = typeof window !== "undefined" && sessionStorage.getItem("explore_posts")
      if (isMounted && !hasCache) setLoading(true)
      try {
        const [postsRes, usersRes, locationsRes] = await Promise.allSettled([
          apiFetch(user ? `/api/v1/posts/getAll?size=20&page=0&viewerId=${user.id}` : "/api/v1/posts/getAll?size=20&page=0", { signal }),
          apiFetch("/users/getall?size=50", { signal }),
          apiFetch("/api/locations?size=10000", { signal })
        ])

        if (!isMounted) return

        if (postsRes.status === "fulfilled" && postsRes.value) {
          const postsArray = (postsRes.value as any)?.content || postsRes.value || []
          if (Array.isArray(postsArray)) {
            const sortedPosts = [...postsArray].sort((a: any, b: any) => {
              const dateA = a.createdDate ? parseUTCDate(a.createdDate).getTime() : 0
              const dateB = b.createdDate ? parseUTCDate(b.createdDate).getTime() : 0
              return dateB - dateA
            })
            setPosts(sortedPosts)
            sessionStorage.setItem("explore_posts", JSON.stringify(sortedPosts))
          }
        }
        if (usersRes.status === "fulfilled" && usersRes.value) {
          const arr = usersRes.value.content || usersRes.value || []
          if (Array.isArray(arr) && isMounted) {
            setUsers(arr)
            sessionStorage.setItem("explore_users", JSON.stringify(arr))
          }
        }
        if (locationsRes.status === "fulfilled" && isMounted) {
          const locsArray = locationsRes.value?.content || locationsRes.value || []
          if (Array.isArray(locsArray)) {
            setValidLocationIds(new Set(locsArray.map((l: any) => l.id)))
          }
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [user])

  const fetchMorePosts = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const res = await apiFetch(user ? `/api/v1/posts/getAll?size=20&page=${nextPage}&viewerId=${user.id}` : `/api/v1/posts/getAll?size=20&page=${nextPage}`)
      const newPosts = res?.content || res || []

      if (newPosts.length < 20) {
        setHasMore(false)
      }

      if (newPosts.length > 0) {
        setPosts(prev => {
          const combined = [...prev, ...newPosts]
          const uniquePosts = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          sessionStorage.setItem("explore_posts", JSON.stringify(uniquePosts))
          return uniquePosts
        })
        setPage(nextPage)
      }
    } catch (e) {
      console.error("Lỗi khi load thêm bài viết:", e)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!user || users.length === 0) return
    let isMounted = true

    apiFetch(`/api/v1/follow/following-ids/${user.id}`)
      .then((followingIds: string[]) => {
        if (isMounted && Array.isArray(followingIds)) {
          setFollowingSet(new Set(followingIds))
        }
      })
      .catch(() => {
      })

    return () => {
      isMounted = false
    }
  }, [user, users.length])

  const handleToggleFollow = async (targetUserId: string) => {
    if (!user || followLoading) return
    setFollowLoading(targetUserId)
    try {
      const res = await apiFetch(
        `/api/v1/follow/${targetUserId}?followerId=${user.id}`,
        { method: "POST" }
      )
      setFollowingSet(prev => {
        const next = new Set(prev)
        if (res.following) next.add(targetUserId)
        else next.delete(targetUserId)
        return next
      })
      setUsers(prev => prev.map(u =>
        u.id === targetUserId
          ? { ...u, followersCount: res.followersCount }
          : u
      ))
    } catch (e) {
      console.error(e)
    } finally {
      setFollowLoading(null)
    }
  }

  useEffect(() => {
    if (posts.length > 0) {
      const initialSaved = new Set(
        posts.filter(p => p.isSaved).map(p => p.id)
      )
      setSavedSet(initialSaved)
    }
  }, [posts])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem("explore_scroll", window.scrollY.toString());
      }, 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (posts.length > 0 && !loading) {
      const savedScroll = sessionStorage.getItem("explore_scroll");
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "instant" });
        }, 100);
      }
    }
  }, [posts.length, loading]);

  const handleToggleSave = async (postId: string) => {
    if (!user) {
      showLoginRequiredToast(router)
      return
    }

    const wasSaved = savedSet.has(postId)

    setSavedSet(prev => {
      const next = new Set(prev)
      if (wasSaved) next.delete(postId)
      else next.add(postId)
      return next
    })

    try {
      await apiFetch(`/api/v1/saved/${postId}?userId=${user.id}`, {
        method: "POST"
      })
      toast({
        title: !wasSaved ? "Đã lưu thành công" : "Đã bỏ lưu",
        description: !wasSaved
          ? "Bài viết đã được lưu vào profile cá nhân của bạn."
          : "Đã xóa bài viết khỏi danh sách lưu của bạn.",
      })
    } catch (error) {
      console.error("Lỗi khi lưu bài viết:", error)
      setSavedSet(prev => {
        const next = new Set(prev)
        if (wasSaved) next.add(postId)
        else next.delete(postId)
        return next
      })
      toast({
        title: "Thao tác thất bại",
        description: "Có lỗi xảy ra trong quá trình lưu bài viết. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  const sortedTrendingTags = useMemo(() => {
    // Count occurrences of each tag across all posts
    const counts: Record<string, number> = {}
    posts.forEach((post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tagName) => {
          const cleanTagName = tagName.trim()
          if (cleanTagName) {
            counts[cleanTagName] = (counts[cleanTagName] || 0) + 1
          }
        })
      }
    })

    // Map each tag to its calculated postCount or create from counts
    const mappedTags = Object.entries(counts).map(([name, count]) => {
      const existingTag = tags.find(t => t.name === name)
      return {
        id: existingTag?.id || name,
        name,
        postCount: count
      }
    })

    return mappedTags
      .sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0))
      .slice(0, 10)
  }, [tags, posts])

  const filteredPosts = posts.filter(p =>
    !searchQuery ||
    p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredUsers = users
    .filter(u => u.id !== user?.id)
    .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    posts,
    users,
    tags,
    loading,
    followingSet,
    followLoading,
    savedSet,
    validLocationIds,
    visibleExplorePostsCount,
    setVisibleExplorePostsCount,
    fetchMorePosts,
    hasMore,
    loadingMore,
    user,
    handleToggleFollow,
    handleToggleSave,
    sortedTrendingTags,
    filteredPosts,
    filteredUsers
  }
}
