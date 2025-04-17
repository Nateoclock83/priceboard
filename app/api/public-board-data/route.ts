import { NextResponse } from "next/server"
import { getDayPrices, getPromotions, getLateNightLanes } from "@/lib/db"

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    // Get the current timestamp to prevent caching
    const timestamp = Date.now()

    // Fetch fresh data directly
    const prices = await getDayPrices()
    const promotions = await getPromotions()
    const lateNightLanes = await getLateNightLanes()

    // Get the current day of the week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = days[new Date().getDay()]

    // Find today's prices
    const todayPrices = prices.find((p) => p.day === today) || prices[0]

    // Log the data for debugging
    console.log(`[${timestamp}] Public board data requested - serving fresh data for ${today}`)
    console.log(
      `Laser Tag available: ${todayPrices.laserTag.isAvailable}, time slots: ${todayPrices.laserTag.timeSlots.length}`,
    )

    // Add this new logging for promotions
    const activePromotions = promotions.filter(
      (promo) =>
        promo.isActive &&
        promo.applicableDays.includes(today) &&
        new Date(promo.startDate) <= new Date() &&
        new Date(promo.endDate) >= new Date(),
    )
    console.log(`Active promotions for ${today}: ${activePromotions.length}`)
    if (activePromotions.length > 0) {
      console.log("Active promotion details:", JSON.stringify(activePromotions))
    }

    // Check if Late Night Lanes is active
    const currentTime = `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
    const isLateNightActive =
      lateNightLanes.isActive &&
      lateNightLanes.applicableDays.includes(today) &&
      currentTime >= lateNightLanes.startTime &&
      (lateNightLanes.endTime === "CLOSE" || currentTime < lateNightLanes.endTime)

    console.log(`Late Night Lanes active: ${isLateNightActive}`)

    // Update the headers to be more aggressive with cache control
    return NextResponse.json(
      {
        prices,
        promotions,
        lateNightLanes,
        currentDay: today,
        todayPrices,
        timestamp,
        isLateNightActive,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "-1",
          "Surrogate-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          ETag: `"${timestamp}"`, // Add ETag for better caching
        },
      },
    )
  } catch (error) {
    console.error("Error fetching public board data:", error)
    return NextResponse.json({ error: "Failed to fetch board data", details: String(error) }, { status: 500 })
  }
}
