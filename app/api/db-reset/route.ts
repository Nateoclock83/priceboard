import { NextResponse } from "next/server"
import { resetDatabase } from "@/lib/db-utils"

export async function POST(request: Request) {
  try {
    // Simple API key check for protection
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // This is a simple protection mechanism - in production, use a more secure approach
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await resetDatabase()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: "Database reset successfully" })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reset database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
