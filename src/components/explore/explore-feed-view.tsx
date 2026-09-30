"use client"

import { Search, Loader2, X, Sparkles, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExploreTabPhotos } from "./tabs/explore-tab-photos"
import { useExploreFeed, type ExploreCategory } from "@/hooks/use-explore-feed"

export function ExploreFeedView() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    posts,
    tags,
    loading,
    followingSet,
    followLoading,
    savedSet,
    validLocationIds,
    visibleExplorePostsCount,
    setVisibleExplorePostsCount,
    user,
    handleToggleFollow,
    handleToggleSave,
    sortedTrendingTags,
    filteredPosts,
    filteredUsers,
    fetchMorePosts,
    hasMore,
    loadingMore
  } = useExploreFeed()

  const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "ALL"

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("ALL")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header với Search đa năng & Filter Pills 1 chạm ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground shrink-0">Khám phá</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm thẻ, địa điểm, tỉnh thành, hoặc tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-muted/80 border-border/40 pl-9 pr-8 text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2 gap-1 shrink-0"
              >
                <X className="h-3.5 w-3.5" /> Xoá lọc
              </Button>
            )}
          </div>

          {/* Thanh Category Pills 1-chạm cuộn ngang */}
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
            {categories.map((cat: ExploreCategory) => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm scale-[1.02]"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/30"
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Info bar khi có lọc */}
        {isFiltering && (
          <div className="px-6 py-1.5 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Tìm thấy <strong className="text-foreground">{filteredPosts.length}</strong> khoảnh khắc
              {selectedCategory !== "ALL" && ` trong danh mục "${categories.find((c: ExploreCategory) => c.id === selectedCategory)?.label}"`}
              {searchQuery && ` theo từ khoá "${searchQuery}"`}
            </span>
          </div>
        )}
      </header>

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <ExploreTabPhotos
            posts={posts}
            validLocationIds={validLocationIds}
            sortedTrendingTags={sortedTrendingTags}
            filteredUsers={filteredUsers}
            followingSet={followingSet}
            followLoading={followLoading}
            handleToggleFollow={handleToggleFollow}
            filteredPosts={filteredPosts}
            visibleExplorePostsCount={visibleExplorePostsCount}
            setVisibleExplorePostsCount={setVisibleExplorePostsCount}
            fetchMorePosts={fetchMorePosts}
            hasMore={hasMore}
            loadingMore={loadingMore}
            user={user}
            handleToggleSave={handleToggleSave}
            savedSet={savedSet}
            setSearchQuery={setSearchQuery}
          />
        )}
      </div>
    </div>
  )
}
