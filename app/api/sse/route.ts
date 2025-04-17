import { NextResponse } from "next/server"
import { getLastUpdateTimestamp } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  const timestamp = await getLastUpdateTimestamp()

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ timestamp, type: "connected" })}\n\n`))

      // Keep the connection alive with a ping every 30 seconds
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`))
      }, 30000)

      // Check for updates every second
      let lastTimestamp = timestamp
      const checkInterval = setInterval(async () => {
        const newTimestamp = await getLastUpdateTimestamp()
        if (newTimestamp > lastTimestamp) {
          lastTimestamp = newTimestamp
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "update", timestamp: newTimestamp })}\n\n`))
        }
      }, 1000)

      // Clean up intervals if the connection is closed
      return () => {
        clearInterval(pingInterval)
        clearInterval(checkInterval)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
