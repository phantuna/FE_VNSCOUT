import { apiFetch } from "@/services/api.service"
import type { Location } from "@/types"

export interface LocationCreateRequest {
  name: string
  latitude: number
  longitude: number
  description?: string
  category?: string
  locationType?: "SPOT" | "SERVICE"
}

/** Cluster tỉnh/huyện để vẽ bubble trên map khi zoom xa */
export interface LocationCluster {
  id: string
  name: string
  latitude: number
  longitude: number
  spotCount: number
  serviceCount: number
  totalPostCount: number
  level: number
  code: string
}

export async function getAllLocations(): Promise<Location[]> {
  const res = await apiFetch("/api/locations?size=10000")
  return res.content || res
}

export async function getLocationById(locationId: string): Promise<Location> {
  return apiFetch(`/api/locations/${locationId}`)
}

export async function createLocation(
  body: LocationCreateRequest
): Promise<Location> {
  return apiFetch("/api/locations", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function getLocationClusters(zoom: number): Promise<LocationCluster[]> {
  return apiFetch(`/api/locations/clusters?zoom=${zoom}`)
}

export async function searchVietMap(
  query: string
): Promise<Array<any>> {
  return apiFetch(
    `/api/vietmap/proxy?path=api/search/v3&text=${encodeURIComponent(query)}&size=5`
  )
}

export async function getPlaceDetail(refId: string): Promise<any> {
  return apiFetch(
    `/api/vietmap/proxy?path=api/place/v3&refid=${encodeURIComponent(refId)}`
  )
}

export async function reverseGeocode(lat: number, lng: number): Promise<{
  display: string
  name?: string
}> {
  return apiFetch(`/api/vietmap/reverse?lat=${lat}&lng=${lng}`)
}

