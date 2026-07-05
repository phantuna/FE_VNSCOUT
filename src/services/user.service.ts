import { apiFetch } from "@/services/api.service"
import type { User } from "@/types"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  user: User
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function register(body: {
  username: string
  email: string
  password: string
}): Promise<User> {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify(body),
  })
}


export async function getMe(): Promise<User> {
  return apiFetch("/users/me")
}

export async function getUserById(userId: string): Promise<User> {
  return apiFetch(`/users/${userId}`)
}

export async function getAllUsers(): Promise<User[]> {
  const res = await apiFetch("/users/getall?size=1000")
  return res.content || res
}

export async function updateUser(
  userId: string,
  body: Partial<User> & { description?: string }
): Promise<User> {
  return apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}
