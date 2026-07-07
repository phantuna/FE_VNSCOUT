"use client"

import { useState } from "react"
import { Trash2, Plus, Ban, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/admin/widgets/admin-empty-state"

interface BannedWord {
  id: string
  word: string
  type: string
  language: string
}

interface AdminTabBannedWordsProps {
  tabLoading: boolean
  bannedWords: BannedWord[]
  wordQuery: string
  setWordQuery: (val: string) => void
  handleAddWord: (word: string, type: string, language: string) => void
  handleDeleteWord: (id: string) => void
}

export function AdminTabBannedWords({
  tabLoading,
  bannedWords,
  wordQuery,
  setWordQuery,
  handleAddWord,
  handleDeleteWord
}: AdminTabBannedWordsProps) {
  const [newWord, setNewWord] = useState("")
  const [newType, setNewType] = useState("EXACT")
  const [newLanguage, setNewLanguage] = useState("vi")

  const onAdd = () => {
    if (!newWord.trim()) return
    handleAddWord(newWord.trim(), newType, newLanguage)
    setNewWord("")
  }

  const filteredWords = bannedWords;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <Ban className="h-5 w-5" />
            </div>
            Danh Sách Từ Cấm
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Quản lý bộ lọc từ ngữ vi phạm, độc hại.
          </p>
        </div>
        <div className="relative w-full sm:w-64 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Tìm từ cấm..."
            value={wordQuery}
            onChange={(e) => setWordQuery(e.target.value)}
            className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-orange-500 rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <Input
          placeholder="Nhập từ cấm mới..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          className="flex-1 rounded-xl h-10 border-slate-200"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="w-[140px] rounded-xl h-10 bg-white">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXACT">Chính xác (EXACT)</SelectItem>
            <SelectItem value="CONTAINS">Chứa (CONTAINS)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={newLanguage} onValueChange={setNewLanguage}>
          <SelectTrigger className="w-[100px] rounded-xl h-10 bg-white">
            <SelectValue placeholder="Ngôn ngữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">Việt (vi)</SelectItem>
            <SelectItem value="en">Anh (en)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onAdd} className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Thêm
        </Button>
      </div>

      {tabLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredWords.length === 0 ? (
        <EmptyState
          icon={<Ban className="w-10 h-10" />}
          iconWrapperClass="bg-rose-50 text-rose-600 shadow-sm border border-rose-100"
          title={wordQuery ? "Không tìm thấy từ cấm" : "Tìm kiếm để hiển thị từ cấm"}
          description={wordQuery ? "Thử tìm với từ khóa khác." : "Nhập từ khóa vào ô tìm kiếm để xem các từ cấm đã lưu."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map(bw => (
            <div key={bw.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="font-bold text-slate-800 truncate" title={bw.word}>{bw.word}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 font-medium">
                    {bw.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                    {bw.language}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteWord(bw.id)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
