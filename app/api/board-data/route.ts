import { NextResponse } from "next/server"
import { getDayPrices, getPromotions } from "@/lib/db"

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    // Get the current timestamp to prevent caching
    const timestamp = new Date().getTime()

    // Fetch fresh data directly
    const prices = await getDayPrices()
    const promotions = await getPromotions()

    console.log(`[${timestamp}] Board data requested - serving fresh data`)

    return NextResponse.json(
      {
        prices,
        promotions,
        timestamp,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching board data:", error)
    return NextResponse.json({ error: "Failed to fetch board data", details: String(error) }, { status: 500 })
  }
}
