import PriceBoard from "@/components/price-board"
import { getDayPrices, getPromotions } from "@/lib/db"
import Link from "next/link"

export default async function Home() {
  const prices = await getDayPrices()
  const promotions = await getPromotions()

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#2d455a]">Outta Boundz Price Board</h1>
          <Link href="/admin" className="bg-[#ff8210] hover:bg-[#e67200] text-white px-4 py-2 rounded-md">
            Admin Panel
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-[#2d455a] text-white">
            <h2 className="text-xl font-semibold">Live Preview (1920x1080)</h2>
          </div>
          <div className="p-4">
            <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-200 overflow-hidden">
              <PriceBoard prices={prices} promotions={promotions} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
