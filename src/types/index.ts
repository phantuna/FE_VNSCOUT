/**
 * SHARED TYPES & INTERFACES
 * These align with the Backend DTOs (PostResponse, PhotosRequest, UserResponse, etc.)
 */

export interface Location {
  id: string
  name: string
  code: string
  slug?: string
  nameWithType?: string
  address?: string
  latitude: number
  longitude: number
  province?: string
  category?: string
  parentLocationId?: string
  level: number // 0: Province, 1: Landmark/District
  coverPhoto?: string
  postCount?: number
  checkInCount?: number
  goldenHour?: string
  description?: string
  parent?: Location
  locationType?: "SPOT" | "SERVICE"  // Phân loại: Du lịch vs Dịch vụ
  creatorId?: string                  // ID người tạo địa điểm
}

export interface Photo {
  id: string
  imageUrl: string
  width?: number
  height?: number
  isLocationVerified?: boolean
  cameraMake?: string
  cameraModel?: string
  lensModel?: string
  iso?: number
  aperture?: number
  shutterSpeed?: string
  focalLength?: number
  dateTaken?: string
  gpsLatitude?: number
  gpsLongitude?: number
  /** "SAFE" | "WARNING" | null — kết quả kiểm duyệt Gemini */
  moderationStatus?: "SAFE" | "WARNING" | null
  /** Lý do kiểm duyệt (hiển thị khi WARNING) */
  moderationMessage?: string
  /** 0.0 = safe, 0.5 = warning */
  moderationScore?: number
}


export interface Post {
  id: string
  caption: string
  shootingTip?: string
  likeCount: number
  commentCount?: number
  liked?: boolean
  createdDate: string
  author: User
  location: Location
  manualLatitude?: number
  manualLongitude?: number
  tags: string[]
  photos: Photo[]
  isSaved?: boolean
  status?: "ACTIVE" | "PENDING_REVIEW" | "HIDDEN"
  pendingReason?: string
  visibility?: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE"
  averageRating?: number
  totalRatings?: number
}

export interface User {
  id: string
  username: string
  email?: string
  avatarUrl?: string
  bio?: string
  followersCount?: number
  followingCount?: number
  postsCount?: number
  isFollowing?: boolean
  level?: number
  levelTitle?: string
  reputationScore?: number
  roles?: string[]
}

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatarUrl?: string
  }
  createdDate?: string
  replies?: Comment[]
}

export interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "mention" | "checkin"
  actor: {
    id: string
    username: string
    avatarUrl?: string
  }
  message: string
  postImage?: string
  createdAt: string
  isRead: boolean
  postId?: string
}

/**
 * DATA REMOVED
 * All static mock data arrays (POSTS, USERS, LOCATIONS, etc.) have been removed.
 * Please use apiFetch() to retrieve real data from the MySQL database via the Spring Boot backend.
 */

export const CURRENT_USER_MOCK_FALLBACK: User = {
  id: "u_me",
  username: "user_scout",
  avatarUrl: "/default-avatar.svg",
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderAvatarUrl?: string
  content: string
  isRead: boolean
  sentAt: string
}

export interface Conversation {
  id: string
  otherUserId: string
  otherUserUsername: string
  otherUserAvatarUrl?: string
  lastMessageContent?: string
  lastMessageAt?: string
  unreadCount: number
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  postsPerDay?: { day: string; count: number }[];
  usersPerDay?: { day: string; count: number }[];
}

export interface ReportResponse {
  id: string
  postId: string
  postCaption: string
  postAuthorId?: string
  postAuthorUsername?: string
  reporterId: string
  reporterUsername: string
  reason: string
  status: "PENDING" | "RESOLVED" | "DISMISSED"
  createdAt: string
}
