import { NextResponse } from "next/server"
import { getDayPrices, updateDayPrices } from "@/lib/db"
import type { DayPrices } from "@/lib/types"

export async function GET() {
  try {
    const prices = await getDayPrices()
    return NextResponse.json({ prices })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { prices } = (await request.json()) as { prices: DayPrices[] }

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    await updateDayPrices(prices)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update prices" }, { status: 500 })
  }
}
