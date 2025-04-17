import { NextResponse } from "next/server"
import { checkDatabaseStatus } from "@/lib/db-utils"

export async function GET() {
  try {
    const status = await checkDatabaseStatus()

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check database status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
