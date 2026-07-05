"use client"

import { useAuth } from "@/context/AuthContext"
import { showLoginRequiredToast } from "@/lib/toast-utils"
import { useRouter } from "next/navigation"
import React from "react"


export function useGuestGuard() {
  const { user } = useAuth()
  const router = useRouter()

  const requireLogin = (callback?: () => void): boolean => {
    if (!user) {
      showLoginRequiredToast(router)
      return false
    }
    callback?.()
    return true
  }

  return {
    requireLogin,
    isLoggedIn: !!user,
    user,
  }
}
