export type TimeSlot = "morning" | "afternoon"

export type SessionStatus = "open" | "confirmed" | "cancelled" | "completed"

export interface Session {
  id: string
  date: string
  timeSlot: TimeSlot
  startTime: string
  endTime: string
  maxStudents: 5
  enrolledStudents: string[]
  status: SessionStatus
  price: number
  zoomMeetingId?: string
  zoomJoinUrl?: string
  zoomStartUrl?: string
  cancelledAt?: string
  cancelledReason?: string
  confirmedAt?: string
  reminderSent?: boolean
  createdAt: string
  autoCancel5DaySent?: boolean
  adminForced?: boolean
  publicStatus?: "open" | "full"
}

export interface Booking {
  id: string
  userId: string
  sessionId: string
  stripePaymentId: string
  amount: number
  affiliateCode?: string | null
  status: "confirmed" | "credit_pending" | "credit_used" | "cancelled"
  zoomJoinUrl?: string
  createdAt: string
  creditGrantedAt?: string
  newSessionId?: string | null
  usedAt?: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  nombre?: string
  apellidos?: string
  telefono?: string
  ciudad?: string
  pais?: string
  purchasedCourses: string[]
  courseProgress?: number
  courseCompleted?: boolean
  completedAt?: string
  bookedSessions: string[]
  stripeCustomerId?: string
  affiliateCode?: string
  affiliateUserId?: string
  pushSubscriptions?: PushSubscriptionData[]
  isAdmin?: boolean
  createdAt: string
  creditAmount?: number
  credits?: any[]
}

export interface PushSubscriptionData {
  endpoint: string
  keys: { p256dh: string; auth: string }
  createdAt: string
  deviceType: "mobile" | "desktop"
}

export interface AffiliateRecord {
  userId: string
  code: string
  name: string
  email: string
  totalSales: number
  pendingCommission: number
  paidCommission: number
  sales: AffiliateSale[]
}

export interface AffiliateSale {
  buyerUserId: string
  buyerName: string
  type: "online" | "zoom"
  sessionId?: string
  amount: number
  date: string
  paid: boolean
}

export const TIME_SLOTS = {
  morning:   { start: "10:00", end: "14:00", label: "Mañana 10:00–14:00" },
  afternoon: { start: "15:00", end: "19:00", label: "Tarde 15:00–19:00" },
}

export function getAllowedSlots(date: Date): TimeSlot[] {
  const day = date.getDay()
  if (day === 0) return []
  if (day === 6) return ["morning"]
  return ["morning", "afternoon"]
}

export const SESSION_MAX = 5
export const AUTO_CANCEL_DAYS = 5
