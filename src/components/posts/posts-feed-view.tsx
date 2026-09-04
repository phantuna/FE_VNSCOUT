"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { MapPin, Loader2, Navigation, AlertCircle, Search, X } from "lucide-react"
import { apiFetch } from "@/services/api.service"
import { type Post } from "@/types"
import { PostCard } from "./post-card"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type FeedStage = "nearby-150" | "nearby-300" | "all"
const STAGES: FeedStage[] = ["nearby-150", "nearby-300", "all"]

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

let cachedCoords: { lat: number, lng: number } | null = null;
let hasLocationError = false;

export function PostsFeedView() {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stage, setStage] = useState<FeedStage | "pending">(
    cachedCoords ? "nearby-150" : (hasLocationError ? "all" : "pending")
  )
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(cachedCoords)
  const [fetchingMore, setFetchingMore] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Search States
  const searchParams = useSearchParams()
  const q = searchParams?.get("q")

  const [searchQuery, setSearchQuery] = useState(q || "")
  const [searchResults, setSearchResults] = useState<Post[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHasMore, setSearchHasMore] = useState(true)
  const [searchPage, setSearchPage] = useState(0)
  const searchDebounce = useRef<NodeJS.Timeout | undefined>(undefined)

  const observerTarget = useRef(null)
  const searchObserverTarget = useRef(null)
  const mounted = useRef(false)
  const hasInitialized = useRef(false)

  // Request location on mount
  useEffect(() => {
    if (q) {
      setSearchQuery(q)
      setSearchPage(0)
      setSearchHasMore(true)
      fetchSearch(q, 0, true)
    }
  }, [q])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (cachedCoords || hasLocationError) return

    let timeout: NodeJS.Timeout
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout)
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          cachedCoords = coords
          setUserCoords(coords)
          setStage("nearby-150")
        },
        (err) => {
          console.warn("Location access denied or failed", err)
          clearTimeout(timeout)
          hasLocationError = true
          setStage("all")
        },
        { maximumAge: 10000, timeout: 5000, enableHighAccuracy: false }
      )

      // Fallback to "all" if location takes more than 3 seconds
      timeout = setTimeout(() => {
        setStage(prev => {
          if (prev === "pending") {
            hasLocationError = true
            return "all"
          }
          return prev
        })
      }, 3000)
    } else {
      hasLocationError = true
      setStage("all")
    }
  }, [])

  const getApiUrl = (currentStage: FeedStage, coords: { lat: number, lng: number } | null, pageNum: number) => {
    const viewerId = user ? `&viewerId=${user.id}` : ""
    if (currentStage === "nearby-150" && coords) {
      return `/api/v1/posts/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=150&page=${pageNum}&size=20${viewerId}`
    }
    if (currentStage === "nearby-300" && coords) {
      return `/api/v1/posts/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=300&page=${pageNum}&size=20${viewerId}`
    }
    return `/api/v1/posts/getAll?page=${pageNum}&size=20${viewerId}`
  }

  const fetchPosts = async (pageNum: number, currentStage: FeedStage, coords: { lat: number, lng: number } | null, isInitial = false) => {
    try {
      const url = getApiUrl(currentStage, coords, pageNum)
      const res = await apiFetch(url)
      const content: Post[] = res?.content || res || []

      // Đảo lộn ngẫu nhiên 20 bài mới nhất trong trang
      const shuffledContent = shuffleArray<Post>(content)

      setPosts(prev => {
        if (isInitial) return shuffledContent
        const existingIds = new Set(prev.map(p => p.id))
        const newPosts = shuffledContent.filter(p => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })

      if (content.length < 20) setHasMore(false)
      else setHasMore(true)

    } catch (err) {
      console.error(err)
      if (isInitial) setError("Không thể tải bài viết")
    } finally {
      setLoading(false)
      setFetchingMore(false)
    }
  }

  const fetchSearch = async (query: string, pageNum: number, isInitial = false) => {
    try {
      if (isInitial) setIsSearching(true)
      else setFetchingMore(true)

      const viewerId = user ? `&viewerId=${user.id}` : ""
      const url = `/api/v1/posts/search?q=${encodeURIComponent(query)}&page=${pageNum}&size=10${viewerId}`

      const res = await apiFetch(url)
      const content = res?.content || res || []

      setSearchResults(prev => {
        if (isInitial) return content
        const existingIds = new Set(prev.map(p => p.id))
        const newPosts = content.filter((p: Post) => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })

      if (content.length < 10) setSearchHasMore(false)
      else setSearchHasMore(true)

    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
      setFetchingMore(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(searchDebounce.current)

    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }

    searchDebounce.current = setTimeout(() => {
      setSearchPage(0)
      setSearchHasMore(true)
      fetchSearch(q, 0, true)
    }, 400)
  }

  // Initial fetch when stage is determined
  useEffect(() => {
    if (stage === "pending") return
    if (hasInitialized.current) return // Prevent re-fetching when stage changes during progressive scroll

    hasInitialized.current = true
    setLoading(true)
    setPage(0)
    setHasMore(true)
    fetchPosts(0, stage, userCoords, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, userCoords])

  // Infinite scroll for regular feed
  useEffect(() => {
    if (searchQuery.trim().length >= 2) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && !fetchingMore) {
          const maxPagesPerStage = 3; // 60 posts limit for nearby stages (3 pages * 20 posts)

          if (hasMore && (stage === "all" || page < maxPagesPerStage - 1)) {
            setPage(p => {
              const next = p + 1;
              setFetchingMore(true);
              fetchPosts(next, stage as FeedStage, userCoords);
              return next;
            })
          } else if (stage !== "pending" && stage !== "all") {
            // Force advance stage even if hasMore is true (hit limit) or run out of posts (hasMore is false)
            const nextStageIdx = STAGES.indexOf(stage) + 1
            if (nextStageIdx < STAGES.length) {
              const nextStage = STAGES[nextStageIdx]
              setStage(nextStage)
              setPage(0)
              setHasMore(true)
              setFetchingMore(true)
              fetchPosts(0, nextStage, userCoords, false)
            }
          }
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, fetchingMore, stage, page, userCoords, searchQuery])

  // Infinite scroll for search
  useEffect(() => {
    if (searchQuery.trim().length < 2) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && searchHasMore && !isSearching && !fetchingMore) {
          setSearchPage(p => {
            const next = p + 1;
            fetchSearch(searchQuery, next, false);
            return next;
          })
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    )

    if (searchObserverTarget.current) {
      observer.observe(searchObserverTarget.current)
    }

    return () => observer.disconnect()
  }, [searchHasMore, isSearching, fetchingMore, searchQuery])

  const isSearchMode = searchQuery.trim().length >= 2
  const displayPosts = isSearchMode ? searchResults : posts

  return (
    <div 
      className="min-h-screen bg-background relative"
      style={{
        backgroundImage: "url('/vnscout/bg-pattern.png')", // Đường dẫn tới file ảnh hoa văn trống đồng (Hình 3)
        backgroundRepeat: "repeat",
        backgroundSize: "600px",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Lớp phủ mờ để ảnh background không làm chìm nội dung (tuỳ chỉnh opacity) */}
      <div className="absolute inset-0 bg-white/80 pointer-events-none z-0"></div>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md pt-4 md:pt-6 pb-4">
        <div className="max-w-xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {stage === "all" ? "Mới nhất" : "Khám phá gần bạn"}
              </h1>
              {stage !== "all" && stage !== "pending" && (
                <p className="mt-0.5 text-xs font-medium text-primary flex items-center gap-1">
                  <Navigation className="h-3 w-3" /> Gần bạn
                </p>
              )}
              {stage === "all" && (
                <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Toàn quốc
                </p>
              )}
            </div>
            {stage === "all" && !loading && (
              <Button variant="outline" size="sm" onClick={() => {
                hasInitialized.current = false
                setStage("pending")
                mounted.current = false
              }} className="text-xs h-8 rounded-full">
                <Navigation className="h-3.5 w-3.5 mr-1" /> Tìm quanh đây
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết, địa điểm, thẻ..."
              className="pl-9 pr-9 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-full h-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-xl mx-auto py-6 sm:px-4 relative z-10">
        {locationStateIsPendingOrLoading(stage, loading, isSearching) ? (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                {stage === "pending" ? "Đang xác định vị trí..." : isSearching ? "Đang tìm kiếm..." : "Đang tải bài viết..."}
              </p>
            </div>
          </div>
        ) : error && !isSearchMode ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3 opacity-80" />
            <p className="text-sm text-foreground font-medium mb-4">{error}</p>
            <Button variant="outline" onClick={() => {
              hasInitialized.current = false;
              setStage("pending");
              mounted.current = false;
            }}>
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            {displayPosts.length > 0 ? (
              <div className="flex flex-col">
                {displayPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* Infinite Scroll Target */}
                <div ref={isSearchMode ? searchObserverTarget : observerTarget} className="h-20 flex items-center justify-center">
                  {fetchingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                  {!(isSearchMode ? searchHasMore : (hasMore || stage !== "all")) && displayPosts.length > 0 && (
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                      Đã hết bài viết
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-5">
                  {isSearchMode ? <Search className="h-8 w-8 text-muted-foreground/30" /> : <MapPin className="h-8 w-8 text-muted-foreground/30" />}
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {isSearchMode ? "Không tìm thấy kết quả" : "Không tìm thấy bài viết nào"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isSearchMode
                    ? `Không có bài viết nào khớp với "${searchQuery}"`
                    : stage !== "all"
                      ? "Chưa có ai đăng bài viết nào quanh khu vực của bạn."
                      : "Chưa có bài viết nào trong hệ thống."}
                </p>
                {!isSearchMode && stage !== "all" && (
                  <Button onClick={() => setStage("all")} className="mt-6 rounded-full">
                    Xem bài viết toàn quốc
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function locationStateIsPendingOrLoading(stage: FeedStage | "pending", loading: boolean, isSearching: boolean) {
  if (isSearching) return true;
  if (stage === "pending") return true;
  if (loading) return true;
  return false;
}
