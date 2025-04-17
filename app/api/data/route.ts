import { NextResponse } from "next/server"
import { getDayPrices, getPromotions } from "@/lib/db"

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const prices = await getDayPrices()
    const promotions = await getPromotions()

    return NextResponse.json(
      {
        prices,
        promotions,
        timestamp: new Date().toISOString(),
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
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Failed to fetch data", details: String(error) }, { status: 500 })
  }
}
