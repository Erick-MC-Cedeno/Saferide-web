"use client"

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const calculateEstimatedFare = (pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
  const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
  const baseFare = 50
  const perKmRate = 12
  return Math.round(baseFare + distance * perKmRate)
}

export const calculateEstimatedDuration = (
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) => {
  const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
  const avgSpeed = 25
  return Math.round((distance / avgSpeed) * 60)
}

export const getDisplayName = (userData: unknown, user: Record<string, unknown> | null) => {
  const maybeName = (userData as { name?: string; full_name?: string } | null) ?? null
  const name = maybeName?.name ?? maybeName?.full_name
  if (typeof name === "string" && name.trim()) return name
  const email = user && typeof (user as any).email === "string" ? (user as any).email : undefined
  if (typeof email === "string") return email.split("@")[0]
  return "Usuario"
}

export const getProfileImage = (userData: unknown) => {
  try {
    const ud = userData as Record<string, unknown> | null
    const img = ud && typeof ud['profile_image'] === 'string' && ud['profile_image'] ? (ud['profile_image'] as string) : null
    return img || "/images/ProfileImage.jpg"
  } catch {
    return "/images/ProfileImage.jpg"
  }
}