import { NextResponse } from "next/server"
import { exportHtml } from "@/lib/db"
import type { DayPrices } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { prices } = (await request.json()) as { prices: DayPrices[] }

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const htmlUrl = await exportHtml(prices)
    return NextResponse.json({ url: htmlUrl })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export HTML" }, { status: 500 })
  }
}
