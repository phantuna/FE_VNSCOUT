"use client"

import { useMemo, useState } from "react"
import { Trophy, TrendingUp, Shield, ChevronDown, ChevronUp, Star, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserReputationCenterProps {
  users: any[]
}

function getTrustScore(user: any): number {
  const rep = user.reputationScore || 0
  const level = user.level || 1
  const isDeleted = user.deleted ? -20 : 0
  return Math.min(100, Math.max(0, Math.floor(rep / 2) + level * 5 + isDeleted))
}

function getTrustLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: "Tin cậy cao", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" }
  if (score >= 55) return { label: "Trung bình", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" }
  if (score >= 30) return { label: "Cần theo dõi", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" }
  return { label: "Rủi ro cao", color: "text-red-600", bg: "bg-red-50 border-red-100" }
}

function TrustBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : score >= 30 ? "bg-orange-500" : "bg-red-500"
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

export function UserReputationCenter({ users }: UserReputationCenterProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const usersWithTrust = useMemo(() =>
    users
      .map(u => ({ ...u, trustScore: getTrustScore(u) }))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 10),
    [users]
  )

  if (users.length === 0) return null

  const topUser = usersWithTrust[0]
  const avgTrust = Math.round(usersWithTrust.reduce((sum, u) => sum + u.trustScore, 0) / usersWithTrust.length)

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>
              Trung tâm Đánh giá Uy tín
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1 pl-11">
              Top 10 thành viên theo Độ tin cậy
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-800">{avgTrust}<span className="text-sm text-slate-400 font-bold">/100</span></div>
            <p className="text-[10px] font-bold text-slate-400">Độ tin cậy trung bình</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-emerald-600">{usersWithTrust.filter(u => u.trustScore >= 80).length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Tin cậy cao</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-amber-600">{usersWithTrust.filter(u => u.trustScore >= 30 && u.trustScore < 80).length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Trung bình</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-red-600">{usersWithTrust.filter(u => u.trustScore < 30).length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Rủi ro</p>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {usersWithTrust.map((user, idx) => {
          const trust = getTrustLabel(user.trustScore)
          const isExpanded = expanded === user.id
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null

          return (
            <div key={user.id} className="transition-colors hover:bg-slate-50/50">
              <button
                className="w-full flex items-center gap-4 px-6 py-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : user.id)}
              >
                <div className="w-7 shrink-0 text-center">
                  {medal
                    ? <span className="text-base">{medal}</span>
                    : <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  }
                </div>

                <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">{user.username?.slice(0, 2).toUpperCase()}</div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-800 truncate">{user.username}</span>
                    {user.deleted && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <TrustBar score={user.trustScore} />
                    <span className={`text-[10px] font-black shrink-0 ${trust.color}`}>
                      {user.trustScore}/100
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-[9px] font-black px-2 py-0.5 border ${trust.bg} ${trust.color} shadow-none`}>
                    {trust.label}
                  </Badge>
                  {isExpanded
                    ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-5 animate-in slide-in-from-top-1 duration-200">
                  <div className="ml-[4.75rem] bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCell icon={<Star className="h-3 w-3 text-amber-500" />} label="Điểm uy tín" value={`${user.reputationScore || 0} RP`} />
                    <StatCell icon={<Trophy className="h-3 w-3 text-blue-500" />} label="Cấp độ" value={`Level ${user.level || 1}`} />
                    <StatCell icon={<TrendingUp className="h-3 w-3 text-emerald-500" />} label="Độ tin cậy" value={`${user.trustScore}/100`} />
                    <StatCell icon={<Shield className="h-3 w-3 text-slate-500" />} label="Trạng thái" value={user.deleted ? "Đã khóa" : "Bình thường"} valueColor={user.deleted ? "text-red-600" : "text-emerald-600"} />
                    <StatCell icon={<span className="text-[10px]">📧</span>} label="Email" value={user.email || "—"} small />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCell({ icon, label, value, valueColor, small }: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
  small?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className={`text-xs font-black ${valueColor || "text-slate-800"} ${small ? "truncate" : ""}`}>{value}</p>
    </div>
  )
}
