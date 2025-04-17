import LateNightLanesAdmin from "@/components/late-night-lanes-admin"
import { getLateNightLanes } from "@/lib/db"
import Link from "next/link"

export default async function LateNightLanesPage() {
  const lateNightLanes = await getLateNightLanes()

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#2d455a]">Late Night Lanes</h1>
          <div className="space-x-2">
            <Link href="/admin" className="bg-[#2d455a] hover:bg-[#1c2e3c] text-white px-4 py-2 rounded-md">
              Back to Admin
            </Link>
            <Link href="/" className="bg-[#ff8210] hover:bg-[#e67200] text-white px-4 py-2 rounded-md">
              View Price Board
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-[#0f0f1a] text-white">
            <h2 className="text-xl font-semibold">Manage Late Night Lanes</h2>
          </div>
          <div className="p-6">
            <LateNightLanesAdmin initialLateNightLanes={lateNightLanes} />
          </div>
        </div>
      </div>
    </main>
  )
}
