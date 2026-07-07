"use client"
import React from "react"

interface EmptyStateProps {
  icon: React.ReactNode
  iconWrapperClass?: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  compact?: boolean
}

export function EmptyState({ icon, iconWrapperClass = "bg-slate-100 text-slate-400", title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-20"} space-y-4`}>
      <div
        className={`flex items-center justify-center ${compact ? "w-16 h-16 rounded-2xl" : "w-24 h-24 rounded-3xl"} ${iconWrapperClass}`}
        style={{ animation: "floatEmoji 3s ease-in-out infinite" }}
      >
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className={`${compact ? "text-base" : "text-lg"} font-black text-slate-800`}>{title}</h3>
        <p className={`${compact ? "text-xs" : "text-sm"} text-slate-500 max-w-xs mx-auto leading-relaxed`}>
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors"
        >
          {action.label}
        </button>
      )}

      <style jsx>{`
        @keyframes floatEmoji {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
