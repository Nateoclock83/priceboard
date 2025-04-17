import { getDayPrices, getPromotions, getLateNightLanes } from "@/lib/db"
import type { Metadata } from "next"
import DisplayPageClient from "./DisplayPageClient"

// Add a comment to clarify the purpose of this page
// This page displays the price board with real-time updates
// It only refreshes when there are actual changes to prices or promotions

// Force dynamic rendering with no caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export const metadata: Metadata = {
  title: "Outta Boundz Price Board",
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
}

export default async function DisplayPage() {
  // Add cache-busting timestamp to ensure fresh data on initial load
  const timestamp = Date.now()
  const prices = await getDayPrices()
  const promotions = await getPromotions()
  const lateNightLanes = await getLateNightLanes()

  // Get the current day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = days[new Date().getDay()]

  return (
    <DisplayPageClient
      initialPrices={prices}
      initialPromotions={promotions}
      initialLateNightLanes={lateNightLanes}
      initialToday={today}
      initialTimestamp={timestamp}
    />
  )
}
