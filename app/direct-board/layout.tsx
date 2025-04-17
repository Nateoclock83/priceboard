import type React from "react"
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function DirectBoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
