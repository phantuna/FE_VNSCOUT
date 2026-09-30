"use client"

import { useState, useEffect, useRef } from "react"
import { Hash, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/services/api.service"

interface PostTagsProps {
  tags: string[]
  setTags: (tags: string[]) => void
  tagInput: string
  setTagInput: (val: string) => void
  extraSuggestions?: string[]
}

const DEFAULT_POPULAR_TAGS = [
  "PhongCanh",
  "ChanDung",
  "DuongPho",
  "HoangHon",
  "BinhMinh",
  "KienTruc",
  "DuLich",
  "NightShot",
  "Vintage",
]

export function PostTags({ tags, setTags, tagInput, setTagInput, extraSuggestions = [] }: PostTagsProps) {
  const [suggestions, setSuggestions] = useState<{id: string, name: string}[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Kết hợp gợi ý từ EXIF (nếu có) và danh sách phổ biến
  const quickTags = Array.from(new Set([...extraSuggestions, ...DEFAULT_POPULAR_TAGS])).slice(0, 10)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!tagInput.trim()) {
      setSuggestions([])
      return
    }
    const fetchTags = async () => {
      try {
        const res = await apiFetch(`/api/v1/tags/suggest?keyword=${encodeURIComponent(tagInput.trim().replace(/^#/, ""))}`)
        setSuggestions(res || [])
      } catch (err) {
        console.error(err)
      }
    }
    
    const debounce = setTimeout(fetchTags, 300)
    return () => clearTimeout(debounce)
  }, [tagInput])

  const addTag = (inputValue: string = tagInput) => {
    if (!inputValue.trim()) return
    const newTags = inputValue.split(/[ ,]+/).map(t => t.trim().replace(/^#/, "")).filter(Boolean)
    if (newTags.length > 0) {
      setTags(Array.from(new Set([...tags, ...newTags])).slice(0, 5))
      setTagInput("")
      setShowSuggestions(false)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const toggleQuickTag = (tag: string) => {
    if (tags.includes(tag)) {
      removeTag(tag)
    } else if (tags.length < 5) {
      setTags([...tags, tag])
    }
  }

  return (
    <div className="mb-3 relative" ref={wrapperRef}>
      <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted relative">
        <Hash className="h-5 w-5 text-primary shrink-0" />
        <Input
          placeholder={tags.length >= 5 ? "Tối đa 5 thẻ tag" : "Thêm thẻ tag (nhập để tìm kiếm hoặc chọn gợi ý bên dưới)"}
          value={tagInput}
          onChange={e => {
            const val = e.target.value
            if (val.includes(" ") || val.includes(",")) addTag(val)
            else {
              setTagInput(val)
              setShowSuggestions(true)
            }
          }}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
          onFocus={() => { if (tagInput.trim()) setShowSuggestions(true) }}
          disabled={tags.length >= 5}
          className="flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      
      {showSuggestions && tagInput.trim() && (
        <div className="absolute left-8 top-full mt-1 w-[calc(100%-2rem)] z-50 bg-popover text-popover-foreground rounded-md border border-border shadow-md max-h-48 overflow-y-auto">
          {suggestions.filter(s => !tags.includes(s.name)).length > 0 ? (
            suggestions
              .filter(s => !tags.includes(s.name))
              .map(s => (
                <div
                  key={s.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer text-sm flex items-center"
                  onClick={() => addTag(s.name)}
                >
                  <Hash className="h-3 w-3 mr-1 text-muted-foreground" /> {s.name}
                </div>
              ))
          ) : null}
          {!suggestions.find(s => s.name.toLowerCase() === tagInput.trim().replace(/^#/, "").toLowerCase()) && !tags.includes(tagInput.trim().replace(/^#/, "")) && (
            <div
              className={`px-4 py-2 hover:bg-muted cursor-pointer text-sm text-primary font-medium ${suggestions.filter(s => !tags.includes(s.name)).length > 0 ? "border-t border-border" : ""}`}
              onClick={() => addTag(tagInput.trim().replace(/^#/, ""))}
            >
              + Tạo thẻ mới: #{tagInput.trim().replace(/^#/, "")}
            </div>
          )}
        </div>
      )}

      {/* Danh sách thẻ đã chọn */}
      {tags.length > 0 && (
        <div className="ml-8 mt-1 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Đã chọn ({tags.length}/5):</span>
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs bg-primary/10 text-primary border-primary/20">
              #{tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={() => setTags([])}
            className="text-[11px] text-muted-foreground hover:text-destructive underline ml-1 cursor-pointer"
          >
            Xoá hết
          </button>
        </div>
      )}

      {/* Gợi ý thẻ 1-chạm (Quick Tags) */}
      {tags.length < 5 && (
        <div className="ml-8 mt-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              ✨ Gợi ý gắn nhanh (1 chạm):
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => {
              const isSelected = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleQuickTag(tag)}
                  className={`text-xs px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                      : "bg-muted/70 text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  }`}
                >
                  #{tag} {isSelected ? "✓" : "+"}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {tags.length >= 5 && <p className="ml-8 mt-2 text-xs text-amber-600 dark:text-amber-400">Đã chọn tối đa 5 thẻ tag.</p>}
    </div>
  )
}
