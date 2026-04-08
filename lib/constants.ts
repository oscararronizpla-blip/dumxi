export const COLLECTIONS = {
  users:      "users",
  sessions:   "sessions",
  bookings:   "bookings",
  affiliates: "affiliates",
  config:     "config",
  certificates: "certificates",
} as const

export const ADMIN_UID = process.env.ADMIN_UID ?? ""

export const PRICES = {
  zoom_normal: 25000,
  zoom_code:   20000,
  online_normal: 15000,
  online_code:   11800,
} as const

export const COMMISSIONS = {
  zoom:   5000,
  online: 2000,
} as const
