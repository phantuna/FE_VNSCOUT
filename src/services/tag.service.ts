import { apiFetch } from "@/services/api.service"

export interface Tag {
  id: string
  name: string
}

export async function getAllTags(): Promise<Tag[]> {
  return apiFetch("/api/v1/tags")
}
