"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { showSuccessToast } from "@/lib/toast-utils"


type ThemeMode = "light" | "dark" | "system"

interface AccentColor {
  name: string
  value: string
  hex: string
}

const ACCENT_COLORS: AccentColor[] = [
  // Warm
  { name: "Đỏ",       value: "0 84% 60%",    hex: "#ef4444" },
  { name: "Cam đỏ",   value: "14 90% 55%",   hex: "#f05a28" },
  { name: "Cam",      value: "25 95% 53%",    hex: "#f97316" },
  { name: "Vàng",     value: "45 93% 47%",    hex: "#eab308" },
  // Cool
  { name: "Xanh lá",  value: "142 71% 45%",  hex: "#22c55e" },
  { name: "Ngọc",     value: "172 66% 40%",  hex: "#14b8a6" },
  { name: "Xanh lam", value: "221 83% 53%",  hex: "#3b82f6" },
  { name: "Indigo",   value: "239 84% 67%",  hex: "#6366f1" },
  // Creative
  { name: "Tím",      value: "262 83% 58%",  hex: "#8b5cf6" },
  { name: "Hồng",     value: "336 80% 58%",  hex: "#ec4899" },
  // Neutral
  { name: "Xám",      value: "220 9% 46%",   hex: "#6b7280" },
  { name: "Đen",      value: "222 47% 11%",  hex: "#1e293b" },
]


const THEME_OPTIONS = [
  { value: "light", label: "Sáng", icon: Sun, desc: "Nền trắng, văn bản tối" },
  { value: "dark", label: "Tối", icon: Moon, desc: "Nền tối, thân thiện với mắt" },
  { value: "system", label: "Hệ thống", icon: Monitor, desc: "Theo cài đặt thiết bị" },
] as const

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === "dark") {
    root.classList.add("dark")
  } else if (mode === "light") {
    root.classList.remove("dark")
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    prefersDark ? root.classList.add("dark") : root.classList.remove("dark")
  }
}

function applyAccent(color: AccentColor) {
  document.documentElement.style.setProperty("--primary", color.value)
}

export function SettingsAppearance() {
  const [theme, setTheme] = useState<ThemeMode>("light")
  const [accent, setAccent] = useState<string>(ACCENT_COLORS[0].hex)

  useEffect(() => {
    const savedTheme = (localStorage.getItem("vps-theme") as ThemeMode) || "light"
    const savedAccent = localStorage.getItem("vps-accent") || ACCENT_COLORS[0].hex
    setTheme(savedTheme)
    setAccent(savedAccent)
    applyTheme(savedTheme)
    const accentObj = ACCENT_COLORS.find(c => c.hex === savedAccent) || ACCENT_COLORS[0]
    applyAccent(accentObj)
  }, [])

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode)
    applyTheme(mode)
    localStorage.setItem("vps-theme", mode)
  }

  const handleAccentChange = (color: AccentColor) => {
    setAccent(color.hex)
    applyAccent(color)
    localStorage.setItem("vps-accent", color.hex)
    showSuccessToast("Đã áp dụng", `Màu sắc giao diện đã đổi sang ${color.name}.`)
  }

  return (
    <div className="space-y-8">
      { }
      <div>
        <h3 className="text-lg font-semibold">Giao diện</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tùy chỉnh giao diện ứng dụng theo sở thích của bạn.
        </p>
        <Separator className="mt-4" />
      </div>

      { }
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Chế độ hiển thị</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Chọn chủ đề sáng, tối hoặc theo hệ thống.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-lg">
          {THEME_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-md",
                theme === value
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              )}
            >
              { }
              <div
                className={cn(
                  "w-full h-16 rounded-lg overflow-hidden border flex flex-col",
                  value === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                )}
              >
                { }
                <div className={cn(
                  "h-3 w-full flex items-center px-1.5 gap-1",
                  value === "dark" ? "bg-slate-800" : "bg-slate-100"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", value === "dark" ? "bg-slate-600" : "bg-slate-300")} />
                  <div className={cn("flex-1 h-1 rounded-full", value === "dark" ? "bg-slate-700" : "bg-slate-200")} />
                </div>
                { }
                <div className="flex-1 p-1.5 space-y-1">
                  <div className={cn("h-1.5 rounded w-3/4", value === "dark" ? "bg-slate-700" : "bg-slate-200")} />
                  <div className={cn("h-1.5 rounded w-1/2", value === "dark" ? "bg-slate-800" : "bg-slate-100")} />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{label}</span>
              </div>


              {theme === value && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <Check className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />


      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Màu sắc chủ đạo</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Màu này sẽ áp dụng cho toàn bộ giao diện ứng dụng.</p>
        </div>

        <div className="grid grid-cols-6 gap-2 max-w-sm">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleAccentChange(color)}
              title={color.name}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg",
                accent === color.hex
                  ? "border-foreground/40 bg-muted shadow-md scale-110"
                  : "border-transparent hover:border-muted"
              )}
            >
              <span
                className="h-9 w-9 rounded-full shadow-inner flex items-center justify-center transition-transform"
                style={{ backgroundColor: color.hex }}
              >
                {accent === color.hex && (
                  <Check className="h-4 w-4 text-white drop-shadow" />
                )}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{color.name}</span>
            </button>
          ))}
        </div>

        <div className="max-w-lg rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xem trước</p>
          <div className="flex items-center gap-3">
            <button
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: ACCENT_COLORS.find(c => c.hex === accent)?.hex || "#f97316" }}
            >
              Nút chính
            </button>
            <button
              className="rounded-full px-4 py-1.5 text-sm font-semibold border-2 transition-all"
              style={{
                borderColor: ACCENT_COLORS.find(c => c.hex === accent)?.hex || "#f97316",
                color: ACCENT_COLORS.find(c => c.hex === accent)?.hex || "#f97316",
              }}
            >
              Nút phụ
            </button>
            <span
              className="text-sm font-bold"
              style={{ color: ACCENT_COLORS.find(c => c.hex === accent)?.hex || "#f97316" }}
            >
              Link text
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
